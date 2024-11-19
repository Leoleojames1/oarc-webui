import React, { useRef, useEffect, useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ChatSection({ 
  selectedModel, 
  availableModels, 
  onModelChange, 
  sendMessage, 
  chatHistory,
  streamingMessage,
  isConnected,
  commandResult
}) {
  const [message, setMessage] = useState('')
  const chatContainerRef = useRef(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatHistory, streamingMessage])

  const handleSend = () => {
    if (message.trim() && isConnected) {
      if (message.startsWith('/')) {
        sendMessage('command', message.trim())
      } else {
        sendMessage('chat', message.trim())
      }
      setMessage('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getMessageStyle = (msg) => {
    // Base styles
    let baseStyle = "inline-block p-2 rounded "
    
    switch (msg.role) {
      case 'user':
        return baseStyle + 'bg-blue-500 text-white'
      case 'assistant':
        // Use color from backend if available, otherwise fallback
        return baseStyle + (msg.color ? `bg-[${msg.color}]` : 'bg-green-500') + ' text-white'
      case 'system':
        return baseStyle + (msg.color ? `bg-[${msg.color}]` : 'bg-gray-500') + ' text-white'
      default:
        return baseStyle + 'bg-gray-300 text-black'
    }
  }

  return (
    <Card className="w-full h-full flex flex-col bg-gray-900 text-green-400 font-mono">
      <CardContent className="flex-grow overflow-auto p-4" ref={chatContainerRef}>
        {/* Chat History */}
        {chatHistory.map((msg, index) => (
          <div 
            key={index} 
            className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <span className={getMessageStyle(msg)}>
              {msg.role === 'user' ? '> ' : ''}{msg.content}
            </span>
          </div>
        ))}
        
        {/* Streaming Message */}
        {streamingMessage && (
          <div className="mb-2 text-left">
            <span className={getMessageStyle({ role: 'assistant' })}>
              {streamingMessage}
            </span>
          </div>
        )}
        
        {/* Command Result */}
        {commandResult && (
          <div className="mb-2 text-left">
            <span className={getMessageStyle({ role: 'system' })}>
              Command Result: {commandResult}
            </span>
          </div>
        )}
      </CardContent>
      
      {/* Input Section */}
      <div className="p-4 border-t border-green-400">
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-full bg-gray-800 text-green-400 border-green-400">
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-green-400 border-green-400">
            {availableModels.map((model) => (
              <SelectItem key={model} value={model}>{model}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex mt-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or /command..."
            className="flex-grow bg-gray-800 text-green-400 border-green-400"
            disabled={!isConnected}
          />
          <Button 
            onClick={handleSend}
            className={`ml-2 bg-green-600 text-white hover:bg-green-700 ${
              !isConnected && 'opacity-50 cursor-not-allowed'
            }`}
            disabled={!isConnected}
          >
            Send
          </Button>
        </div>
      </div>
      
      {!isConnected && (
        <div className="p-2 bg-red-500 text-white text-center">
          Disconnected - Waiting for connection...
        </div>
      )}
    </Card>
  )
}