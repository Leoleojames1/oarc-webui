'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface AudioContextType {
  userAudioData: Float32Array
  llmAudioData: Float32Array
  isSpeechRecognitionActive: boolean
  isListening: boolean
  isAutoSpeechEnabled: boolean
  isWakeWordEnabled: boolean
  isRecording: boolean
  recognizedText: string
  toggleSpeechRecognition: () => void
  sendAudioCommand: (command: string) => void
  startRecording: () => Promise<void>
  stopRecording: () => void
}

const AudioContext = createContext<AudioContextType | null>(null)

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}

interface AudioProviderProps {
  children: React.ReactNode
}

export function AudioProvider({ children }: AudioProviderProps) {
  // State for audio data and recognition status
  const [userAudioData, setUserAudioData] = useState<Float32Array>(new Float32Array(0))
  const [llmAudioData, setLlmAudioData] = useState<Float32Array>(new Float32Array(0))
  const [isSpeechRecognitionActive, setIsSpeechRecognitionActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isAutoSpeechEnabled, setIsAutoSpeechEnabled] = useState(false)
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recognizedText, setRecognizedText] = useState('')
  
  // Refs for audio handling
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)
  
  const MAX_RECONNECT_ATTEMPTS = 5
  const RECONNECT_DELAY = 2000
  
  const { toast } = useToast()

  const initializeAudioStream = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current)
      processorRef.current = audioContextRef.current.createScriptProcessor(1024, 1, 1)
      
      source.connect(processorRef.current)
      processorRef.current.connect(audioContextRef.current.destination)
      
      processorRef.current.onaudioprocess = (e) => {
        if (isRecording && wsRef.current?.readyState === WebSocket.OPEN) {
          const audioData = e.inputBuffer.getChannelData(0)
          // Convert Float32Array to ArrayBuffer for sending
          const buffer = new ArrayBuffer(audioData.length * 4)
          const view = new Float32Array(buffer)
          view.set(audioData)
          wsRef.current.send(buffer)
          setUserAudioData(audioData)
        }
      }
    } catch (err) {
      console.error('Error initializing audio:', err)
      toast({
        title: "Audio Error",
        description: "Could not initialize microphone",
        variant: "destructive",
      })
    }
  }

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) return

    try {
      wsRef.current = new WebSocket('ws://localhost:2020/audio-stream')
      
      wsRef.current.onopen = () => {
        reconnectAttemptsRef.current = 0
        toast({
          title: "Audio Connected",
          description: "Audio WebSocket connection established",
        })
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          switch (data.type) {
            case 'user_audio_data':
              setUserAudioData(new Float32Array(data.audio))
              break
            case 'llm_audio_data':
              setLlmAudioData(new Float32Array(data.audio))
              break
            case 'recognition_result':
              setRecognizedText(data.text)
              // Handle recognized text for commands or chat
              if (data.text.startsWith('/')) {
                sendAudioCommand(data.text)
              }
              break
          }
          
          // Handle status updates
          if (data.status) {
            setIsSpeechRecognitionActive(data.status.speech_recognition_active)
            setIsListening(data.status.listen_flag)
            setIsAutoSpeechEnabled(data.status.auto_speech_flag)
            setIsWakeWordEnabled(data.status.wake_commands_enabled)
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error)
        }
      }

      wsRef.current.onclose = () => {
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connectWebSocket()
          }, RECONNECT_DELAY)
        } else {
          toast({
            title: "Connection Failed",
            description: "Unable to establish audio connection. Please refresh the page.",
            variant: "destructive",
          })
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        toast({
          title: "Connection Error",
          description: "Audio WebSocket encountered an error",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error)
    }
  }

  useEffect(() => {
    connectWebSocket()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (processorRef.current) {
        processorRef.current.disconnect()
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [toast])

  const startRecording = async () => {
    if (!audioContextRef.current) {
      await initializeAudioStream()
    }
    
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWebSocket()
    }
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_recording' }))
      setIsRecording(true)
    }
  }

  const stopRecording = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop_recording' }))
    }
    setIsRecording(false)
  }

  const toggleSpeechRecognition = () => {
    const newState = !isSpeechRecognitionActive
    setIsSpeechRecognitionActive(newState)
    if (newState) {
      startRecording()
    } else {
      stopRecording()
    }
    sendAudioCommand(newState ? '/speech on' : '/speech off')
  }

  const audioSocket = new WebSocket(`ws://localhost:2020/audio/${agentId}`);
    audioSocket.binaryType = "arraybuffer";

    // Handle incoming audio
    audioSocket.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        // Handle audio data
        playAudio(event.data);
      } else {
        // Handle JSON messages
        const message = JSON.parse(event.data);
        handleMessage(message);
      }
    }
  }

  const sendAudioCommand = (command: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Error",
        description: "Audio WebSocket is not connected",
        variant: "destructive",
      })
      return
    }

    try {
      wsRef.current.send(JSON.stringify({
        type: 'audio_command',
        command
      }))
    } catch (error) {
      console.error('Error sending audio command:', error)
      toast({
        title: "Error",
        description: "Failed to send audio command",
        variant: "destructive",
      })
    }
  }

  const value = {
    userAudioData,
    llmAudioData,
    isSpeechRecognitionActive,
    isListening,
    isAutoSpeechEnabled,
    isWakeWordEnabled,
    isRecording,
    recognizedText,
    toggleSpeechRecognition,
    sendAudioCommand,
    startRecording,
    stopRecording,
  }

  return (
    <AudioContext.Provider value={value}>
      {children}
      {reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS && (
        <div className="fixed bottom-4 left-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-sm">
          Audio connection failed - Please refresh the page
        </div>
      )}
    </AudioContext.Provider>
  )
}