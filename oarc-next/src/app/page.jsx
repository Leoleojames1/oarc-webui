'use client'

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Orbitron } from 'next/font/google'

const orbitron = Orbitron({ subsets: ['latin'] })

const IsometricBackground = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationFrameId

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const drawIsometricGrid = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const gridSize = 40
      const sqrt3 = Math.sqrt(3)
      const gridWidth = Math.ceil(canvas.width / (gridSize * sqrt3)) + 2
      const gridHeight = Math.ceil(canvas.height / (gridSize * 1.5)) + 2

      ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)'
      ctx.lineWidth = 1

      for (let row = -1; row < gridHeight; row++) {
        for (let col = -1; col < gridWidth; col++) {
          const x = (col + (row % 2) * 0.5) * gridSize * sqrt3
          const y = row * gridSize * 1.5

          // Draw upward-pointing triangle
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + gridSize * sqrt3 / 2, y + gridSize * 1.5)
          ctx.lineTo(x - gridSize * sqrt3 / 2, y + gridSize * 1.5)
          ctx.closePath()
          ctx.stroke()
        }
      }

      // Draw purple trace
      const traceLength = 20
      const traceOpacity = 0.9
      const traceSpeed = 0.002

      let currentRow = Math.floor(Math.random() * gridHeight)
      let currentCol = Math.floor(Math.random() * gridWidth)
      let currentEdge = Math.floor(Math.random() * 3) // 0: top, 1: right, 2: left

      ctx.lineWidth = 4

      for (let i = 0; i < traceLength; i++) {
        const t = (time * traceSpeed + i * 0.1) % 1
        const fadeOpacity = traceOpacity * (1 - i / traceLength)

        const x = (currentCol + (currentRow % 2) * 0.5) * gridSize * sqrt3
        const y = currentRow * gridSize * 1.5

        ctx.shadowColor = 'rgba(200, 0, 255, 0.5)'
        ctx.shadowBlur = 10
        ctx.strokeStyle = `rgba(200, 0, 255, ${fadeOpacity})`

        ctx.beginPath()
        switch (currentEdge) {
          case 0: // top edge
            ctx.moveTo(x, y)
            ctx.lineTo(x + gridSize * sqrt3 / 2, y + gridSize * 1.5)
            break
          case 1: // right edge
            ctx.moveTo(x + gridSize * sqrt3 / 2, y + gridSize * 1.5)
            ctx.lineTo(x - gridSize * sqrt3 / 2, y + gridSize * 1.5)
            break
          case 2: // left edge
            ctx.moveTo(x - gridSize * sqrt3 / 2, y + gridSize * 1.5)
            ctx.lineTo(x, y)
            break
        }
        ctx.stroke()

        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0

        // Random walk
        const direction = Math.floor(Math.random() * 3)
        switch (direction) {
          case 0: // move right
            currentCol++
            currentEdge = 2
            break
          case 1: // move down-left
            currentRow++
            if (currentRow % 2 === 0) currentCol--
            currentEdge = 1
            break
          case 2: // move down-right
            currentRow++
            if (currentRow % 2 !== 0) currentCol++
            currentEdge = 0
            break
        }

        currentCol = (currentCol + gridWidth) % gridWidth
        currentRow = (currentRow + gridHeight) % gridHeight
      }
    }

    const animate = (time) => {
      drawIsometricGrid(time)
      animationFrameId = requestAnimationFrame(animate)
    }

    resizeCanvas()
    animate(0)

    window.addEventListener('resize', resizeCanvas)
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" />
}

const AlienButton = ({ children, href }) => (
  <Link href={href} passHref>
    <motion.div
      className="w-64 h-16 relative cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg transform skew-x-12" />
      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg transform -skew-x-12" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-lg z-10">{children}</span>
      </div>
    </motion.div>
  </Link>
)

export default function Home() {
  return (
    <div className={`relative min-h-screen bg-black text-white overflow-hidden ${orbitron.className}`}>
      <IsometricBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        <header className="text-center mb-40">
          <h1 className="text-7xl font-bold mb-4 relative inline-block">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-pink-500 glow-effect yellow-outline">
              OARC WebUI
            </span>
          </h1>
          <motion.p 
            className="text-2xl text-cyan-400"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Digital Frontier at Your Command
          </motion.p>
        </header>

        <div className="flex flex-col items-center justify-center space-y-8">
          <AlienButton href="/oarcUI">Enter OARC UI</AlienButton>
          <AlienButton href="/profile">User Identity</AlienButton>
          <AlienButton href="/settings">System Config</AlienButton>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-900 to-transparent pointer-events-none" />

      <style jsx global>{`
        body {
          background: black;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .text-cyan-400 {
          animation: pulse 3s infinite;
        }

        .glow-effect {
          text-shadow: 
            0 0 5px #ff00ff,
            0 0 10px #ff00ff,
            0 0 20px #ff00ff,
            0 0 40px #ff00ff;
        }

        .yellow-outline {
          -webkit-text-stroke: 2px yellow;
        }
      `}</style>
    </div>
  )
}

