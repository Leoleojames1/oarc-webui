import React, { useRef, useEffect, useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Copy, Check, Paperclip, X } from 'lucide-react'
import { Eye, Code } from 'lucide-react'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { InlineMath, BlockMath } from 'react-katex'

import 'katex/dist/katex.min.css'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [copiedStates, setCopiedStates] = useState({})
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const fileInputRef = useRef(null)

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

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates(prev => ({ ...prev, [id]: true }))
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    const newFiles = []

    for (const file of files) {
      try {
        const text = await file.text()
        const extension = file.name.split('.').pop().toLowerCase()
        newFiles.push({
          name: file.name,
          content: text,
          language: getLanguageFromExtension(extension),
          size: file.size
        })
      } catch (err) {
        console.error(`Error reading file ${file.name}:`, err)
      }
    }

    setUploadedFiles([...uploadedFiles, ...newFiles])
    setIsFileDialogOpen(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getLanguageFromExtension = (ext) => {
    const languageMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      rb: 'ruby',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      html: 'html',
      css: 'css',
      json: 'json',
      yml: 'yaml',
      yaml: 'yaml',
      md: 'markdown',
      sql: 'sql',
      sh: 'bash',
      bash: 'bash',
      rs: 'rust',
      go: 'go',
      swift: 'swift',
      kt: 'kotlin',
    }
    return languageMap[ext] || 'plaintext'
  }

  const insertFileContent = (file) => {
    const codeBlock = `\`\`\`${file.language}\n${file.content}\n\`\`\``
    setMessage(prev => {
      const newMessage = prev ? `${prev}\n\n${codeBlock}` : codeBlock
      return newMessage
    })
    setIsFileDialogOpen(false)
    setUploadedFiles([])
  }

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

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
    const baseStyle = "inline-block p-4 rounded-lg whitespace-pre-wrap break-words max-w-[80%] shadow-md relative group "
    
    switch(msg.role) {
      case 'user':
        return baseStyle + 'bg-emerald-500 text-white'
      case 'assistant':
        return baseStyle + 'bg-indigo-500 text-white'
        // return baseStyle + 'bg-sky-500 text-white'
      case 'system':
      default:
        return baseStyle + 'bg-amber-500 text-white'
    }
  }

  const CopyButton = ({ text, id }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 bg-black bg-opacity-20 hover:bg-opacity-30"
            onClick={() => handleCopy(text, id)}
          >
            {copiedStates[id] ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copiedStates[id] ? 'Copied!' : 'Copy message'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  const MarkdownContent = ({ content }) => {
    const [showRawLatex, setShowRawLatex] = useState({})
  
    const renderLatexContent = (text, id) => {
      // First, escape any literal backslashes that aren't part of LaTeX
      let processedText = text
  
      // Pattern to match LaTeX expressions including escaped delimiters
      const latexPattern = /(?:\\\[[\s\S]*?\\\]|\\\(.*?\\\)|\$\$[\s\S]*?\$\$|\$[^\n$]*?\$)/g
      const parts = []
      let lastIndex = 0
      let match
  
      while ((match = latexPattern.exec(processedText)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
          parts.push(processedText.slice(lastIndex, match.index))
        }
  
        const fullMatch = match[0]
        const isBlock = fullMatch.startsWith('\\[') || fullMatch.startsWith('$$')
        let latex
  
        if (fullMatch.startsWith('\\[')) {
          latex = fullMatch.slice(2, -2).trim()
        } else if (fullMatch.startsWith('$$')) {
          latex = fullMatch.slice(2, -2).trim()
        } else if (fullMatch.startsWith('\\(')) {
          latex = fullMatch.slice(2, -2).trim()
        } else {
          latex = fullMatch.slice(1, -1).trim()
        }
  
        const latexId = `${id}-latex-${match.index}`
        const showRaw = showRawLatex[latexId]
  
        parts.push(
          <span 
            key={latexId} 
            className="relative group inline-flex items-center"
          >
            <span className={`
              ${isBlock ? 'block my-4' : 'inline-block'} 
              latex-wrapper 
              hover:bg-opacity-10 
              hover:bg-blue-500 
              rounded 
              px-1
              ${isBlock ? 'w-full text-center' : ''}
            `}>
              {showRaw ? (
                <code className="bg-black bg-opacity-20 px-1 py-0.5 rounded text-sm font-mono">
                  {fullMatch}
                </code>
              ) : (
                isBlock ? (
                  <div className="text-blue-300">
                    <BlockMath math={latex} />
                  </div>
                ) : (
                  <span className="text-blue-300">
                    <InlineMath math={latex} />
                  </span>
                )
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={`
                        absolute -right-7 top-1/2 transform -translate-y-1/2
                        opacity-0 group-hover:opacity-100 transition-opacity
                        p-1 rounded-full bg-gray-800/50 hover:bg-gray-700/50
                        border border-gray-600/30 shadow-lg
                      `}
                      onClick={() => setShowRawLatex(prev => ({
                        ...prev,
                        [latexId]: !prev[latexId]
                      }))}
                    >
                      {showRaw ? (
                        <Eye className="h-3 w-3 text-gray-300" />
                      ) : (
                        <Code className="h-3 w-3 text-gray-300" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {showRaw ? 'Show rendered' : 'Show LaTeX'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
          </span>
        )
  
        lastIndex = match.index + fullMatch.length
      }
  
      // Add remaining text
      if (lastIndex < processedText.length) {
        parts.push(processedText.slice(lastIndex))
      }
  
      return parts
    }
  
    return (
      <ReactMarkdown
        className="prose prose-invert max-w-none"
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => {
            if (typeof children === 'string') {
              const id = Math.random().toString(36).substr(2, 9)
              return <p className="mb-1">{renderLatexContent(children, id)}</p>
            }
            return <p className="mb-1">{children}</p>
          },
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            const codeId = `code-${Math.random().toString(36).substr(2, 9)}`
            
            return !inline ? (
              <div className="relative group">
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
                <CopyButton 
                  text={String(children)} 
                  id={codeId}
                />
              </div>
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
  }

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
                <CopyButton 
                  text={msg.content}
                  id={`msg-${index}`}
                />
              </div>
            </div>
          ))}
          
          {currentStream.content && (
            <div className="flex justify-start">
              <div className={getMessageStyle(currentStream)}>
                <MarkdownContent content={currentStream.content} />
                <CopyButton 
                  text={currentStream.content}
                  id="current-stream"
                />
              </div>
            </div>
          )}
          
          {commandResult && (
            <div className="flex justify-start">
              <div className={getMessageStyle({ role: 'system' })}>
                <MarkdownContent content={commandResult} />
                <CopyButton 
                  text={commandResult}
                  id="command-result"
                />
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
          <div className="relative flex-grow flex">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message or /command..."
              className="flex-grow bg-gray-800 text-green-400 border-green-400 pr-10"
              disabled={!isConnected}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-gray-700"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4 text-green-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload code file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept=".js,.jsx,.ts,.tsx,.py,.rb,.java,.cpp,.c,.cs,.php,.html,.css,.json,.yml,.yaml,.md,.sql,.sh,.bash,.rs,.go,.swift,.kt"
            />
          </div>
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

      <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
        <DialogContent className="bg-gray-800 text-green-400 border-green-400">
          <DialogHeader>
            <DialogTitle>Select File to Insert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {uploadedFiles.map((file, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer group"
                onClick={() => insertFileContent(file)}
              >
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-400">
                    {(file.size / 1024).toFixed(1)}KB • {file.language}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}