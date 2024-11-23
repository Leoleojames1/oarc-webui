import React, { useRef, useEffect, useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism'

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
  const [currentStream, setCurrentStream] = useState({ role: 'assistant', content: '' })

  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current
      const isNearBottom = scrollHeight - chatContainerRef.current.scrollTop <= clientHeight + 100
      
      if (isNearBottom) {
        chatContainerRef.current.scrollTop = scrollHeight
      }
    }
  }, [chatHistory, currentStream])

  useEffect(() => {
    if (streamingMessage) {
      setCurrentStream(prev => ({
        role: 'assistant',
        content: prev.content + streamingMessage
      }))
    } else {
      setCurrentStream({ role: 'assistant', content: '' })
    }
  }, [streamingMessage])

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
    const baseStyle = "inline-block p-4 rounded-lg whitespace-pre-wrap break-words max-w-[80%] shadow-md "
    
    switch(msg.role) {
      case 'user':
        return baseStyle + 'bg-emerald-500 text-white'
      case 'assistant':
        return baseStyle + 'bg-sky-500 text-white'
      case 'system':
      default:
        return baseStyle + 'bg-amber-500 text-white'
    }
  }

  const MarkdownContent = ({ content }) => (
    <ReactMarkdown
      className="prose prose-invert max-w-none"
      components={{
        p: ({ children }) => <p className="mb-1">{children}</p>,
        code: ({ node, inline, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '')
          const language = match ? match[1] : ''
          
          return !inline ? (
            <SyntaxHighlighter
              style={dracula}
              language={language}
              PreTag="div"
              className="rounded-lg"
              showLineNumbers={true}
              customStyle={{
                margin: 0,
                borderRadius: '0.5rem',
                fontSize: '0.9em',
              }}
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code
              className="bg-black bg-opacity-20 px-1 py-0.5 rounded text-sm"
              {...props}
            >
              {children}
            </code>
          )
        },
        pre: ({ children }) => <div className="overflow-x-auto">{children}</div>,
      }}
    >
      {content}
    </ReactMarkdown>
  )

  return (
    <Card className="w-full h-full flex flex-col bg-gray-900 text-green-400 font-mono">
      <CardContent 
        className="flex-grow overflow-y-auto p-4 scroll-smooth" 
        ref={chatContainerRef}
      >
        <div className="flex flex-col space-y-4">
          {chatHistory.map((msg, index) => (
            <div 
              key={`msg-${index}`}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={getMessageStyle(msg)}>
                <MarkdownContent content={msg.content} />
              </div>
            </div>
          ))}
          
          {currentStream.content && (
            <div className="flex justify-start">
              <div className={getMessageStyle(currentStream)}>
                <MarkdownContent content={currentStream.content} />
              </div>
            </div>
          )}
          
          {commandResult && (
            <div className="flex justify-start">
              <div className={getMessageStyle({ role: 'system' })}>
                <MarkdownContent content={commandResult} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
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
    </Card>
  )
}