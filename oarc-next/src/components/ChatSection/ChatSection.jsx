import React, { useRef, useEffect, useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { 
  Copy, 
  Check, 
  Paperclip, 
  X, 
  Settings as SettingsIcon,
  FileText,
  FileCode,
  FileJson,
  FileImage,
  File,
  Eye,
  Code,
  Expand,
  Minimize
} from 'lucide-react'
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

import { Switch } from "@/components/ui/switch";
import dynamic from 'next/dynamic';
import mermaid from 'mermaid';

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
  const [fontSize, setFontSize] = useState(16)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const chatContainerRef = useRef(null)
  const [currentStream, setCurrentStream] = useState({ role: 'assistant', content: '' })
  const [copiedStates, setCopiedStates] = useState({})
  const [attachedFiles, setAttachedFiles] = useState([])
  const fileInputRef = useRef(null)
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const getFileIcon = (language) => {
    switch (language) {
      case 'javascript':
      case 'typescript':
      case 'python':
      case 'java':
      case 'cpp':
      case 'c':
      case 'csharp':
      case 'php':
      case 'ruby':
      case 'rust':
      case 'go':
      case 'swift':
      case 'kotlin':
        return <FileCode className="w-8 h-8" />;
      case 'json':
      case 'yaml':
        return <FileJson className="w-8 h-8" />;
      case 'markdown':
      case 'txt':
        return <FileText className="w-8 h-8" />;
      case 'html':
      case 'css':
        return <FileCode className="w-8 h-8" />;
      default:
        return <File className="w-8 h-8" />;
    }
  };
  const NextJSPreview = dynamic(() => import('../NextJSPreview/NextJSPreview'), { ssr: false });

  useEffect(() => {
    const savedConfig = localStorage.getItem('chatConfig')
    if (savedConfig) {
      const config = JSON.parse(savedConfig)
      if (config.fontSize) {
        setFontSize(config.fontSize)
      }
    }
  }, [])

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

  const CodeBlock = ({ language, children, isUserMessage, isDarkTheme }) => {
    const [showPreview, setShowPreview] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [previewError, setPreviewError] = useState(null);
    const mermaidRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
  
    const getFontSize = (baseSize) => {
      const ratio = fontSize / 16;
      return `${0.9 * ratio}em`;
    };
  
    const getPreviewType = (language) => {
      return language === 'mermaid' ? 'mermaid' : 'react';
    };

    const PreviewWrapper = ({ children, error }) => (
      <div className="rounded-lg bg-gray-800 border border-gray-700 overflow-hidden">
        {error ? (
          <div className="p-4 bg-red-900/20 text-red-400">{error}</div>
        ) : children}
      </div>
    );

    const canRender = (language) => {
      return ['javascript', 'typescript', 'jsx', 'tsx', 'mermaid'].includes(language?.toLowerCase());
    };

    useEffect(() => {
      if (language === 'mermaid' && showPreview && mermaidRef.current) {
        try {
          mermaid.initialize({
            startOnLoad: false,
            theme: isDarkTheme ? 'dark' : 'default',
            securityLevel: 'loose',
            flowchart: {
              htmlLabels: true,
              useMaxWidth: true,
            }
          });
          
          const uniqueId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const cleanedCode = children
          .replace(/graph LR graph LR/, 'graph LR')
          .replace(/title\[([^\]]+)\]/, '$1')
          .trim();

          mermaid.render(uniqueId, cleanedCode).then(({ svg }) => {
            if (mermaidRef.current) {
              mermaidRef.current.innerHTML = svg;
            }
          }).catch((error) => {
            setPreviewError(error.message);
          });
        } catch (error) {
          setPreviewError(error.message);
        }
      }
    }, [showPreview, language, children, isDarkTheme]);
  
    const renderPreview = () => {
      if (previewError) return (
        <div className="relative group">
          <div className="text-red-500">Error: {previewError}</div>
          <CopyButton text={previewError} id={`error-${Math.random()}`} />
        </div>
      );
      
      return (
        <div className="relative group p-4 bg-white rounded-lg">
          {language === 'mermaid' ? (
            <>
              <div ref={mermaidRef} className="mermaid">{children}</div>
              <CopyButton text={children} id={`mermaid-${Math.random()}`} />
            </>
          ) : (
            <NextJSPreview code={children} onLoadStart={() => setIsLoading(true)} onLoadEnd={() => setIsLoading(false)} />
          )}
        </div>
      );
    };
  
    return (
      <div className="relative">
        {canRender(language) && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-gray-800/90 rounded-full px-3 py-1">
            <span className="text-xs text-green-400">Render</span>
            <Switch
              checked={showPreview}
              onCheckedChange={setShowPreview}
              className="data-[state=checked]:bg-green-400"
            />
          </div>
        )}
        {showPreview && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute -top-2 right-6 h-6 w-6 rounded-full bg-gray-800/90"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <Minimize className="h-3 w-3 text-green-400" />
            ) : (
              <Expand className="h-3 w-3 text-green-400" />
            )}
          </Button>
        )}
        {!showPreview ? (
          <SyntaxHighlighter
            style={dracula}
            language={language}
            className="rounded-lg"
            customStyle={{
              margin: 0,
              fontSize: getFontSize(fontSize),
            }}
          >
            {children}
          </SyntaxHighlighter>
        ) : (
          <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
            <div className={`mt-4 ${isExpanded ? 'hidden' : 'block'}`}>
              {renderPreview()}
            </div>
            <DialogContent className="max-w-7xl w-full h-[80vh]">
              {renderPreview()}
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  };

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

    setAttachedFiles(prev => [...prev, ...newFiles])
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

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSend = () => {
    if ((message.trim() || attachedFiles.length > 0) && isConnected) {
      let finalMessage = message.trim()
      
      // Append file contents to the message if there are attached files
      if (attachedFiles.length > 0) {
        const fileContents = attachedFiles.map(file => (
          `File: ${file.name}\n\`\`\`${file.language}\n${file.content}\n\`\`\``
        )).join('\n\n')
        
        finalMessage = finalMessage
          ? `${finalMessage}\n\n${fileContents}`
          : fileContents
      }

      if (finalMessage.startsWith('/')) {
        sendMessage('command', finalMessage)
      } else {
        sendMessage('chat', finalMessage)
      }
      
      setMessage('')
      setAttachedFiles([])
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getMessageStyle = (msg) => {
    const getFontSizeClass = (size) => {
      const sizes = {
        12: 'text-xs',    // 0.75rem (12px)
        14: 'text-sm',    // 0.875rem (14px)
        16: 'text-base',  // 1rem (16px)
        18: 'text-lg',    // 1.125rem (18px)
        20: 'text-xl',    // 1.25rem (20px)
        22: 'text-2xl',   // 1.5rem (24px)
        24: 'text-3xl'    // 1.875rem (30px)
      }
      return sizes[size] || 'text-base'
    }
  
    const baseStyle = `inline-block p-4 rounded-lg whitespace-pre-wrap break-words max-w-[80%] shadow-md relative group ${getFontSizeClass(fontSize)}`
    
    switch(msg.role) {
      case 'user':
        return `${baseStyle} bg-emerald-500 text-white`
      case 'assistant':
        return `${baseStyle} bg-indigo-500 text-white`
      case 'system':
      default:
        return `${baseStyle} bg-amber-500 text-white`
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
      // Convert \[ \] to $$ $$ format first
      text = text.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$')
      // Convert \( \) to $ $ format
      text = text.replace(/\\\((.*?)\\\)/g, '$$1')
      
      // Then split on $$ $$ and $ $ patterns
      const parts = text.split(/((?:\$\$[\s\S]*?\$\$|\$[^\n$]*?\$))/g)
      
      return parts.map((part, index) => {
        if (part?.startsWith('$')) {
          const isBlock = part.startsWith('$$')
          const latex = isBlock ? part.slice(2, -2) : part.slice(1, -1)
          const latexId = `${id}-latex-${index}`
          const showRaw = showRawLatex[latexId]

          return (
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
                    {isBlock ? `\\[\n${latex}\n\\]` : `\\(${latex}\\)`}
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
        }
        return <span key={`${id}-text-${index}`}>{part}</span>
      })
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
              <CodeBlock 
                language={language}
                isUserMessage={false}
                isDarkTheme={isDarkTheme}
              >
                {String(children).replace(/\n$/, '')}
              </CodeBlock>
                <CopyButton 
                  text={String(children)} 
                  id={codeId}
                />
              </div>
            ) : (
              <code
                className={`bg-black bg-opacity-20 px-1 py-0.5 rounded ${getFontSizeClass(fontSize)}`}
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
    <Card className="w-full h-full flex flex-col bg-gray-900 text-green-400 font-mono relative">
      {/* Settings Button - Positioned in top left */}
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 left-2 z-10 bg-gray-800 hover:bg-gray-700"
        onClick={() => setIsSettingsOpen(true)}
      >
        <SettingsIcon className="h-4 w-4 text-green-400" />
      </Button>
  
      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="bg-gray-800 text-green-400 border-green-400">
          <DialogHeader>
            <DialogTitle>Chat Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Font Size: {fontSize}px</label>
              <Slider
                value={[fontSize]}
                onValueChange={([value]) => {
                  setFontSize(value)
                  // Save to localStorage immediately when changed
                  const savedConfig = localStorage.getItem('chatConfig')
                  const config = savedConfig ? JSON.parse(savedConfig) : {}
                  localStorage.setItem('chatConfig', JSON.stringify({
                    ...config,
                    fontSize: value
                  }))
                }}
                min={12}
                max={24}
                step={2}
                className="mt-2"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
  
      {/* Main Chat Content */}
      <CardContent 
        className="flex-grow overflow-y-auto p-4 scroll-smooth pt-12" 
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
                <MarkdownContent content={
                  typeof commandResult === 'object' && commandResult.formatted 
                    ? commandResult.formatted 
                    : String(commandResult)
                } />
                <CopyButton 
                  text={
                    typeof commandResult === 'object' && commandResult.formatted 
                      ? commandResult.formatted 
                      : String(commandResult)
                  }
                  id="command-result"
                />
              </div>
            </div>
          )}
        </div>
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
        
        {attachedFiles.length > 0 && (
          <div className="mt-2 relative">
            <div className="overflow-x-auto flex space-x-2 pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {attachedFiles.map((file, index) => (
                <div 
                  key={index} 
                  className="flex-shrink-0 w-32 h-32 bg-gray-800 rounded-lg p-3 relative group hover:bg-gray-700 transition-colors"
                >
                  <div className="flex flex-col h-full">
                    {/* File Icon */}
                    <div className="flex-grow flex items-center justify-center text-green-400 opacity-60">
                      {getFileIcon(file.language)}
                    </div>
                    
                    {/* File Name */}
                    <div className="mt-2">
                      <p className="text-xs text-green-400 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-green-400/60">
                        {(file.size / 1024).toFixed(1)}KB
                      </p>
                    </div>

                    {/* Remove Button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500/80 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3 text-white" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
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
                  <p>Attach code files</p>
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
    </Card>
  )
}