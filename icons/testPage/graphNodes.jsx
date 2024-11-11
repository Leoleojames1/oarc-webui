'use client'

import { useState, useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lock, Unlock } from 'lucide-react'

export default function Component() {
  const [mindMaps, setMindMaps] = useState([])
  const [showInput, setShowInput] = useState(true)
  const [input, setInput] = useState('')
  const [gravity, setGravity] = useState(50)
  const [linkDistance, setLinkDistance] = useState(100)
  const [charge, setCharge] = useState(-200)
  const [visualizationType, setVisualizationType] = useState('force')
  const svgRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)
  const [controlPanelLocked, setControlPanelLocked] = useState(false)
  const [jsonInputLocked, setJsonInputLocked] = useState(false)

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', updateDimensions)
    updateDimensions()

    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    if (!mindMaps.length || !dimensions.width || !dimensions.height) return

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)

    svg.selectAll('*').remove()

    // Add oceanic background
    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#ocean-gradient)')

    // Define oceanic gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'ocean-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#0077be')

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#001a33')

    // Add bubbles
    for (let i = 0; i < 50; i++) {
      svg.append('circle')
        .attr('cx', Math.random() * dimensions.width)
        .attr('cy', Math.random() * dimensions.height)
        .attr('r', Math.random() * 5)
        .attr('fill', 'rgba(255, 255, 255, 0.3)')
        .attr('class', 'bubble')
    }

    const { nodes, links } = processData(mindMaps)

    const zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        setZoom(event.transform.k)
        mainGroup.attr('transform', event.transform)
      })

    svg.call(zoomBehavior)

    const mainGroup = svg.append('g')

    if (visualizationType === 'force') {
      renderForceDirectedGraph(mainGroup, nodes, links)
    } else if (visualizationType === 'tree') {
      renderTreeGraph(mainGroup, nodes, links)
    }

  }, [mindMaps, dimensions, linkDistance, charge, visualizationType])

  function renderForceDirectedGraph(svg, nodes, links) {
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(linkDistance))
      .force('charge', d3.forceManyBody().strength(charge))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius(30))

    const link = svg.append('g')
      .selectAll('rect')
      .data(links)
      .enter().append('rect')
      .attr('fill', d => d.isInterMapLink ? '#ff7f50' : '#4fc3f7')
      .attr('opacity', 0.6)
      .attr('width', 3)
      .attr('height', d => Math.sqrt(d.value) * 2)

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))

    node.append('circle')
      .attr('r', 10)
      .attr('fill', d => d.group ? d3.schemeCategory10[d.group % 10] : '#666')
      .attr('stroke', '#81d4fa')
      .attr('stroke-width', 2)

    node.append('text')
      .attr('dx', 15)
      .attr('dy', '.35em')
      .text(d => d.label)
      .attr('font-size', '12px')
      .attr('fill', '#e0f7fa')

    node.append('title')
      .text(d => d.id)

    simulation.on('tick', () => {
      link
        .attr('x', d => (d.source.x + d.target.x) / 2 - 1.5)
        .attr('y', d => (d.source.y + d.target.y) / 2 - Math.sqrt(d.value))
        .attr('transform', d => {
          const angle = Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x) * 180 / Math.PI
          return `rotate(${angle}, ${(d.source.x + d.target.x) / 2}, ${(d.source.y + d.target.y) / 2})`
        })

      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    function dragged(event) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }
  }

  function renderTreeGraph(svg, nodes, links) {
    const hierarchy = d3.stratify()
      .id(d => d.id)
      .parentId(d => links.find(link => link.target === d.id)?.source)
      (nodes)

    const treeLayout = d3.tree().size([dimensions.height - 100, dimensions.width - 100])
    const root = treeLayout(hierarchy)

    const link = svg.append('g')
      .selectAll('path')
      .data(root.links())
      .enter().append('path')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x))
      .attr('fill', 'none')
      .attr('stroke', d => d.target.data.isInterMapLink ? '#ff7f50' : '#4fc3f7')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5)

    const node = svg.append('g')
      .selectAll('g')
      .data(root.descendants())
      .enter().append('g')
      .attr('transform', d => `translate(${d.y},${d.x})`)

    node.append('circle')
      .attr('r', 10)
      .attr('fill', d => d.data.group ? d3.schemeCategory10[d.data.group % 10] : '#666')
      .attr('stroke', '#81d4fa')
      .attr('stroke-width', 2)

    node.append('text')
      .attr('dx', d => d.children ? -15 : 15)
      .attr('dy', '.35em')
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => d.data.label)
      .attr('font-size', '12px')
      .attr('fill', '#e0f7fa')

    node.append('title')
      .text(d => d.data.id)
  }

  const handleJsonSubmit = () => {
    try {
      let parsedInput

      // Try parsing as JSON first
      try {
        parsedInput = JSON.parse(input)
      } catch (e) {
        // If JSON parsing fails, try evaluating as JavaScript
        parsedInput = eval(`(${input})`)
      }

      // Ensure the input is an array
      if (!Array.isArray(parsedInput)) {
        parsedInput = [parsedInput]
      }

      setMindMaps([...mindMaps, parsedInput])
      setInput('')
    } catch (error) {
      alert('Invalid input. Please check your JSON or JavaScript object notation.')
    }
  }

  function processData(mindMaps) {
    const nodes = []
    const links = []
    let nodeId = 0

    mindMaps.forEach((mindMap, mapIndex) => {
      const processNode = (node, parentId = null) => {
        const id = `map${mapIndex}_node${nodeId++}`
        const newNode = {
          id,
          group: mapIndex,
          label: node.label || node.instruction || '',
        }
        nodes.push(newNode)

        if (parentId) {
          links.push({
            source: parentId,
            target: id,
            value: 1,
          })
        }

        if (node.children) {
          node.children.forEach(child => processNode(child, id))
        }
      }

      if (Array.isArray(mindMap)) {
        mindMap.forEach(item => processNode(item))
      } else {
        processNode(mindMap)
      }
    })

    // Add inter-map connections
    for (let i = 0; i < mindMaps.length - 1; i++) {
      const sourceNode = nodes.find(node => node.group === i)
      const targetNode = nodes.find(node => node.group === i + 1)
      if (sourceNode && targetNode) {
        links.push({
          source: sourceNode.id,
          target: targetNode.id,
          value: 2,
          isInterMapLink: true
        })
      }
    }

    return { nodes, links }
  }

  function DraggablePanel({ children, initialPosition, isLocked, setIsLocked }) {
    const [position, setPosition] = useState(initialPosition)
    const [isDragging, setIsDragging] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
      const handleMouseMove = (event) => {
        if (!isDragging || isLocked) return
        setPosition({
          x: event.clientX,
          y: event.clientY,
        })
      }

      const handleMouseUp = () => {
        setIsDragging(false)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }, [isDragging, isLocked])

    const handleMouseDown = () => {
      if (!isLocked) {
        setIsDragging(true)
      }
    }

    return (
      <div
        ref={ref}
        className={`absolute ${isLocked ? 'cursor-default' : 'cursor-move'}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="relative">
          {children}
          <Button
            className="absolute top-2 right-2 p-1"
            variant="ghost"
            size="icon"
            onClick={() => setIsLocked(!isLocked)}
          >
            {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen relative overflow-hidden bg-[#001a33]">
      <svg ref={svgRef} className="w-full h-full" />
      
      <DraggablePanel 
        initialPosition={{ x: 10, y: 10 }} 
        isLocked={controlPanelLocked}
        setIsLocked={setControlPanelLocked}
      >
        <Card className="w-80 bg-[#003366] text-[#e0f7fa] border-[#4fc3f7]">
          <CardHeader>
            <CardTitle className="text-[#81d4fa]">Control Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="visualizationType" className="text-[#4fc3f7]">Visualization Type</Label>
                <Select onValueChange={setVisualizationType} defaultValue={visualizationType}>
                  <SelectTrigger className="bg-[#004080] text-[#e0f7fa] border-[#4fc3f7]">
                    <SelectValue placeholder="Select visualization type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#004080] text-[#e0f7fa] border-[#4fc3f7]">
                    <SelectItem value="force">Force-Directed</SelectItem>
                    <SelectItem value="tree">Tree</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="gravity" className="text-[#4fc3f7]">Gravity</Label>
                <Slider 
                  id="gravity" 
                  min={0} 
                  max={100} 
                  step={1}
                  value={[gravity]}
                  onValueChange={(value) => setGravity(value[0])}
                  
                  className="[&_[role=slider]]:bg-[#4fc3f7]"
                />
              </div>
              <div>
                <Label htmlFor="linkDistance" className="text-[#4fc3f7]">Link Distance</Label>
                <Slider 
                  id="linkDistance" 
                  min={50} 
                  max={200} 
                  step={1}
                  value={[linkDistance]}
                  onValueChange={(value) => setLinkDistance(value[0])}
                  className="[&_[role=slider]]:bg-[#4fc3f7]"
                />
              </div>
              <div>
                <Label htmlFor="charge" className="text-[#4fc3f7]">Charge</Label>
                <Slider 
                  id="charge" 
                  min={-500} 
                  max={0} 
                  step={1}
                  value={[charge]}
                  onValueChange={(value) => setCharge(value[0])}
                  className="[&_[role=slider]]:bg-[#4fc3f7]"
                />
              </div>
              <div>
                <Label htmlFor="zoom" className="text-[#4fc3f7]">Zoom</Label>
                <div className="text-[#e0f7fa]">{zoom.toFixed(2)}x</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DraggablePanel>

      <DraggablePanel 
        initialPosition={{ x: 10, y: 300 }}
        isLocked={jsonInputLocked}
        setIsLocked={setJsonInputLocked}
      >
        <Card className="w-80 bg-[#003366] text-[#e0f7fa] border-[#4fc3f7]">
          <CardHeader>
            <CardTitle className="text-[#81d4fa]">JSON Input</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter JSON or JavaScript object notation here..."
                rows={10}
                className="mb-4 bg-[#004080] text-[#e0f7fa] border-[#4fc3f7] placeholder-[#81d4fa]"
              />
              <Button onClick={handleJsonSubmit} className="bg-[#4fc3f7] text-[#003366] ">Submit</Button>
            </div>
          </CardContent>
        </Card>
      </DraggablePanel>

      <Button 
        className="absolute bottom-4 right-4 bg-[#4fc3f7] text-[#003366]"
        onClick={() => setShowInput(!showInput)}
      >
        {showInput ? 'Hide JSON Input' : 'Show JSON Input'}
      </Button>

      <style jsx global>{`
        .bubble {
          animation: rise 10s infinite ease-in;
        }
        @keyframes rise {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-${dimensions.height}px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}