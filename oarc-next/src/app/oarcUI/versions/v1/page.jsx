'use client'

import { useState, useEffect } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import AvatarCard from './AvatarCard'
import ChatSection from './ChatSection'
import CommandSection from './CommandSection'

const ResponsiveGridLayout = WidthProvider(Responsive)

export default function EnhancedChatInterface() {
  const [layout, setLayout] = useState([
    { i: 'avatar', x: 0, y: 0, w: 4, h: 8 },
    { i: 'chat', x: 4, y: 0, w: 4, h: 12 },
    { i: 'commands', x: 8, y: 0, w: 4, h: 12 },
  ])

  const [selectedModel, setSelectedModel] = useState('')
  const [availableModels, setAvailableModels] = useState([])

  useEffect(() => {
    fetchAvailableModels()
  }, [])

  const fetchAvailableModels = async () => {
    try {
      const response = await fetch('http://localhost:8000/available_models')
      const data = await response.json()
      setAvailableModels(data.models)
    } catch (error) {
      console.error('Error fetching available models:', error)
    }
  }

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout)
  }

  const handleModelChange = async (value) => {
    setSelectedModel(value)
    try {
      await fetch('http://localhost:8000/swap_model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model_name: value }),
      })
    } catch (error) {
      console.error('Error swapping model:', error)
    }
  }

  return (
    <div className="h-screen w-full p-4">
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        onLayoutChange={handleLayoutChange}
        isDraggable
        isResizable
      >
        <div key="avatar">
          <AvatarCard />
        </div>
        <div key="chat">
          <ChatSection
            selectedModel={selectedModel}
            availableModels={availableModels}
            onModelChange={handleModelChange}
          />
        </div>
        <div key="commands">
          <CommandSection />
        </div>
      </ResponsiveGridLayout>
    </div>
  )
}