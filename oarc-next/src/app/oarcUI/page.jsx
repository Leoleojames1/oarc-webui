'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import AvatarCard from '@/components/AvatarCard/AvatarCard'
import ChatSection from '@/components/ChatSection/ChatSection'
import CommandSection from '@/components/CommandSection/CommandSection'
import AudioVisualizer from '@/components/AudioVisualizer/AudioVisualizer'
import { useToast } from '@/hooks/use-toast'
import { ToastProvider } from '@/components/ui/toast'
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, User, Plus, X, Mic } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import DesktopStreamCard from "@/components/DesktopStreamCard/DesktopStreamCard"

const ResponsiveGridLayout = WidthProvider(Responsive)

export default function EnhancedChatInterface() {
  // Layout State
  const [layout, setLayout] = useState([
    { i: 'avatar', x: 0, y: 0, w: 4, h: 8 },
    { i: 'chat', x: 4, y: 0, w: 8, h: 16 },
    { i: 'command', x: 0, y: 8, w: 4, h: 8 },
    { i: 'audioVisualizer', x: 0, y: 16, w: 12, h: 4 },
  ])

  // App State
  const [selectedModel, setSelectedModel] = useState('')
  const [availableModels, setAvailableModels] = useState([])
  const [chatHistory, setChatHistory] = useState([])
  const [streamingMessage, setStreamingMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isDarkTheme, setIsDarkTheme] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [ollamaApiUrl, setOllamaApiUrl] = useState('http://localhost:11434')
  const [userName, setUserName] = useState('')
  const [commandResult, setCommandResult] = useState(null)

  // New state for audio and speech recognition
  const [userAudioData, setUserAudioData] = useState(new Float32Array(0))
  const [llmAudioData, setLlmAudioData] = useState(new Float32Array(0))
  const [isSpeechRecognitionActive, setIsSpeechRecognitionActive] = useState(false)

  // WebSocket References
  const ws = useRef(null)
  const audioWs = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const isComponentMounted = useRef(true)
  const MAX_RECONNECT_ATTEMPTS = 5
  const RECONNECT_DELAY = 2000

  // UI Components Config
  const [availableComponents] = useState([
    { id: 'avatar', name: 'Avatar' },
    { id: 'chat', name: 'Chat' },
    { id: 'command', name: 'Command' },
    { id: 'audioVisualizer', name: 'Audio Visualizer' },
  ])

  const { toast } = useToast()

  const setupWebSocket = useCallback(() => {
    // Generate a unique agent ID if not already stored
    const agentId = localStorage.getItem('agentId') || 
                   `agent-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('agentId', agentId);
  
    if (ws.current?.readyState === WebSocket.CONNECTING) return;
    if (ws.current?.readyState === WebSocket.OPEN) return;
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) return;
  
    try {
      ws.current = new WebSocket(`ws://localhost:2020/ws/${agentId}`)
      
      ws.current.onopen = () => {
        if (!isComponentMounted.current) return
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
        toast({
          title: "Connected",
          description: "WebSocket connection established",
        })
      }
      
      ws.current.onmessage = (event) => {
        if (!isComponentMounted.current) return
        try {
          const message = JSON.parse(event.data)
          console.log('WebSocket received:', message); // Add this debug line
          
          switch (message.type) {
            case 'chat_message':
              setChatHistory(prev => [...prev, { 
                role: 'user', 
                content: message.content 
              }])
              break
            case 'chat_response':
              if (message.is_stream) {
                // Handle streaming message
                setStreamingMessage(message.content)
              } else {
                // Handle complete message
                setChatHistory(prev => [...prev, { 
                  role: 'assistant', 
                  content: message.content 
                }])
                setStreamingMessage('')
              }
              break
            case 'command_result':
              setCommandResult(message.content)
              setChatHistory(prev => [...prev, { 
                role: 'system', 
                content: message.content 
              }])
              break
            case 'error':
              toast({
                title: "Error",
                description: message.content,
                variant: "destructive"
              })
              break
          }
        } catch (error) {
          console.error('Error processing message:', error)
        }
      }

      ws.current.onclose = (event) => {
        if (!isComponentMounted.current) return
        setIsConnected(false)
        
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            setupWebSocket()
          }, RECONNECT_DELAY)
        } else {
          toast({
            title: "Connection Failed",
            description: "Maximum reconnection attempts reached. Please refresh the page.",
            variant: "destructive",
          })
        }
      }

      ws.current.onerror = (error) => {
        if (!isComponentMounted.current) return
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error)
    }
  }, [toast])

  const setupAudioWebSocket = useCallback(() => {
    const agentId = localStorage.getItem('agentId');
    
    audioWs.current = new WebSocket(`ws://localhost:2020/audio-stream/${agentId}`)
    audioWs.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.user_audio_data) {
        setUserAudioData(new Float32Array(data.user_audio_data))
      }
      if (data.llm_audio_data) {
        setLlmAudioData(new Float32Array(data.llm_audio_data))
      }
    }
    audioWs.current.onerror = (error) => {
      console.error('Audio WebSocket error:', error)
    }
    audioWs.current.onclose = () => {
      console.log('Audio WebSocket closed')
    }
  }, [])

  useEffect(() => {
    setupWebSocket()
    setupAudioWebSocket()
    fetchAvailableModels()
    loadConfig()

    return () => {
      if (ws.current) {
        ws.current.close()
      }
      if (audioWs.current) {
        audioWs.current.close()
      }
    }
  }, [setupWebSocket, setupAudioWebSocket])

  const sendMessage = useCallback((type, content) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Error", 
        description: "Not connected to server",
        variant: "destructive",
      })
      return
    }
  
    try {
      ws.current.send(JSON.stringify({
        type: type,
        content: content
      }))
      
      setStreamingMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }, [toast])

  const getMessageColor = (role, color) => {
    switch (role) {
      case 'user':
        return 'bg-blue-500 text-white'
      case 'assistant':
        return color ? `bg-[${color}] text-white` : 'bg-green-500 text-white'
      case 'system':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-gray-300 text-black'
    }
  }
  
  const fetchAvailableModels = async () => {
    try {
      const response = await fetch('http://localhost:2020/available_models')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setAvailableModels(data.models || [])
    } catch (error) {
      console.error('Error fetching available models:', error)
      toast({
        title: "Error",
        description: `Failed to fetch available models: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const handleModelChange = async (value) => {
    setSelectedModel(value)
    try {
      const response = await fetch('http://localhost:2020/set_model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: value }),
      })
      
      if (!response.ok) throw new Error('Failed to set model')
      
      toast({
        title: "Model Changed",
        description: `Model set to ${value}`,
      })
    } catch (error) {
      console.error('Error setting model:', error)
      toast({
        title: "Error",
        description: "Failed to set model",
        variant: "destructive",
      })
    }
  }

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
  };

  const saveConfig = useCallback(() => {
    const config = {
      layout,
      isDarkTheme,
      ollamaApiUrl,
      userName,
    }
    localStorage.setItem('chatConfig', JSON.stringify(config))
    toast({
      title: "Configuration Saved",
      description: "Your settings have been saved.",
    })
  }, [layout, isDarkTheme, ollamaApiUrl, userName, toast])

  const loadConfig = useCallback(() => {
    const savedConfig = localStorage.getItem('chatConfig')
    if (savedConfig) {
      const config = JSON.parse(savedConfig)
      setLayout(config.layout || layout)
      setIsDarkTheme(config.isDarkTheme)
      setOllamaApiUrl(config.ollamaApiUrl || ollamaApiUrl)
      setUserName(config.userName || '')
    }
  }, [])

  // Modify the addComponent function to handle the new component and prevent stacking
  const addComponent = (componentId) => {
    const newComponent = {
      i: `${componentId}-${Date.now()}`, // Ensure unique key for each component
      x: 0,
      y: Infinity, // This ensures the new component is placed at the bottom
      w: 4,
      h: 8,
    };
  
    setLayout((prevLayout) => {
      // Find the maximum y value in the current layout to place the new component below existing ones
      const maxY = prevLayout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
      newComponent.y = maxY;
  
      return [...prevLayout, newComponent];
    });
  };

  const removeComponent = useCallback((componentId) => {
    setLayout(prev => prev.filter(item => item.i !== componentId))
  }, [])

  const toggleSpeechRecognition = useCallback(() => {
    setIsSpeechRecognitionActive(prev => !prev)
    sendMessage('command', isSpeechRecognitionActive ? '/speech off' : '/speech on')
  }, [isSpeechRecognitionActive, sendMessage])

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        toggleSpeechRecognition()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [toggleSpeechRecognition])

  return (
    <ToastProvider>
      <div className={`h-screen w-full p-4 ${isDarkTheme ? 'bg-gray-900 text-green-400' : 'bg-gray-100 text-gray-900'} font-mono`}>
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={30}
          onLayoutChange={handleLayoutChange}
          isDraggable
          isResizable
          draggableCancel=".non-draggable"
        >
          {layout.map(item => (
            <div key={item.i} className="overflow-hidden">
              {item.i === 'avatar' && <AvatarCard />}
              {item.i === 'chat' && (
                <ChatSection
                  selectedModel={selectedModel}
                  availableModels={availableModels}
                  onModelChange={handleModelChange}
                  sendMessage={sendMessage}
                  chatHistory={chatHistory}
                  streamingMessage={streamingMessage}
                  isConnected={isConnected}
                  commandResult={commandResult}
                />
              )}
              {item.i === 'command' && (
                <CommandSection
                  sendMessage={sendMessage}
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                  isConnected={isConnected}
                />
              )}
              {item.i.startsWith('desktopStream') && (
                <DesktopStreamCard />
              )}
              {item.i === 'audioVisualizer' && (
                <div className="flex h-full">
                  <div className="flex-1 mr-1">
                    <AudioVisualizer 
                      audioData={userAudioData} 
                      isDarkTheme={isDarkTheme}
                      isUserAudio={true}
                    />
                  </div>
                  <div className="flex-1 ml-1">
                    <AudioVisualizer 
                      audioData={llmAudioData} 
                      isDarkTheme={isDarkTheme}
                      isUserAudio={false}
                    />
                  </div>
                </div>
              )}
              <Button
                className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                onClick={() => removeComponent(item.i)}
              >
                <X size={16} />
              </Button>
            </div>
          ))}
        </ResponsiveGridLayout>

        <Button
          className="fixed top-4 right-24 p-2 bg-green-800 text-green-400 rounded-full"
          onClick={toggleSpeechRecognition}
        >
          <Mic size={24} />
        </Button>

        <Button
          className="fixed top-4 right-16 p-2  bg-green-800 text-green-400 rounded-full"
          onClick={() => setIsProfileOpen(true)}
        >
          <User size={24} />
        </Button>
        
        <Button
          className="fixed top-4 right-4 p-2 bg-green-800 text-green-400 rounded-full"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings size={24} />
        </Button>

        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className={`${isDarkTheme ? 'bg-gray-800 text-green-400' : 'bg-white text-gray-900'}`}>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <Switch
                  id="dark-mode"
                  checked={isDarkTheme}
                  onCheckedChange={setIsDarkTheme}
                />
              </div>
              <div>
                <Label htmlFor="ollama-api">Ollama API URL</Label>
                <Input
                  id="ollama-api"
                  value={ollamaApiUrl}
                  onChange={(e) => setOllamaApiUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Add Component</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {availableComponents.map(component => (
                    <Button
                      key={component.id}
                      onClick={() => addComponent(component.id)}
                      className="w-full"
                    >
                      <Plus size={16} className="mr-2" />
                      {component.name}
                    </Button>
                  ))}
                  <Button
                    onClick={() => addComponent('desktopStream')}
                    className="w-full"
                  >
                    <Plus size={16} className="mr-2" />
                    Desktop Stream
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent className={`${isDarkTheme ? 'bg-gray-800 text-green-400' : 'bg-white text-gray-900'}`}>
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col space-y-4">
              <div>
                <Label htmlFor="user-name">Name</Label>
                <Input
                  id="user-name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button onClick={() => {
                saveConfig()
                setIsProfileOpen(false)
              }}>
                Save Profile
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {!isConnected && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md">
            {reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS
              ? "Connection failed. Please refresh the page."
              : "WebSocket disconnected. Attempting to reconnect..."}
          </div>
        )}
      </div>
    </ToastProvider>
  )
}