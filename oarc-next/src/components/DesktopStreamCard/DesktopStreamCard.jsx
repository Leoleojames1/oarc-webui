import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Monitor, Camera } from 'lucide-react'

export default function DesktopStreamCard() {
  const [streamSource, setStreamSource] = useState('monitor')
  const [availableMonitors, setAvailableMonitors] = useState([])
  const [selectedMonitor, setSelectedMonitor] = useState('')
  const videoRef = useRef(null)

  useEffect(() => {
    // In a real implementation, this would be fetched from the backend
    setAvailableMonitors(['Monitor 1', 'Monitor 2'])
    setSelectedMonitor('Monitor 1')
  }, [])

  const startStream = () => {
    // This is a placeholder. In a real implementation, you would
    // connect to your backend to start the stream
    console.log(`Starting ${streamSource} stream`)
    if (videoRef.current) {
      videoRef.current.src = '/placeholder.svg?height=480&width=640'
    }
  }

  return (
    <Card className="w-full h-full bg-gray-800 text-green-400 overflow-hidden">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <Select value={streamSource} onValueChange={(value) => setStreamSource(value)}>
            <SelectTrigger className="w-[180px] bg-gray-700 text-green-400 border-green-400">
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 text-green-400 border-green-400">
              <SelectItem value="monitor">Monitor</SelectItem>
              <SelectItem value="webcam">Webcam</SelectItem>
            </SelectContent>
          </Select>
          {streamSource === 'monitor' && (
            <Select value={selectedMonitor} onValueChange={setSelectedMonitor}>
              <SelectTrigger className="w-[180px] bg-gray-700 text-green-400 border-green-400">
                <SelectValue placeholder="Select monitor" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 text-green-400 border-green-400">
                {availableMonitors.map((monitor) => (
                  <SelectItem key={monitor} value={monitor}>{monitor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={startStream} className="bg-green-600 text-white hover:bg-green-700">
            Start Stream
          </Button>
        </div>
        <div className="flex-grow relative bg-black rounded-lg overflow-hidden">
          <video 
            ref={videoRef}
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
          />
          {!videoRef.current?.src && (
            <div className="absolute inset-0 flex items-center justify-center">
              {streamSource === 'monitor' ? (
                <Monitor className="w-16 h-16 text-green-400 opacity-50" />
              ) : (
                <Camera className="w-16 h-16 text-green-400 opacity-50" />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}