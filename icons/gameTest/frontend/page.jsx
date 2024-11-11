'use client'

import { useState, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, Text, useGLTF, Environment } from '@react-three/drei'
import { Vector3 } from 'three'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Placeholder for space station model
function SpaceStation({ position, onInteract }) {
  return (
    <mesh position={position} onClick={onInteract}>
      <boxGeometry args={[2, 4, 2]} />
      <meshStandardMaterial color="#666666" />
    </mesh>
  )
}

// Planet component with atmosphere
function Planet({ position, color, size = 1, onInteract, isHostile }) {
  return (
    <group position={position}>
      <mesh onClick={onInteract}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial 
          color={isHostile ? '#ff4444' : '#ffffff'} 
          transparent
          opacity={0.1}
        />
      </mesh>
    </group>
  )
}

// Player ship that can be controlled
function PlayerShip({ position, rotation }) {
  return (
    <mesh position={position} rotation={rotation}>
      <coneGeometry args={[0.5, 2, 8]} />
      <meshStandardMaterial color="#44ff44" />
    </mesh>
  )
}

// Main game component
function GameScene() {
  const [playerPos, setPlayerPos] = useState(new Vector3(0, 0, 10))
  const [playerRot, setPlayerRot] = useState([0, 0, 0])
  const [showDialog, setShowDialog] = useState(false)
  const [dialogContent, setDialogContent] = useState('')
  const [ws, setWs] = useState(null)
  const speed = 0.1
  const keysPressed = useRef({})

  // WebSocket connection
  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:8000/ws/chat')
    setWs(websocket)
    return () => websocket.close()
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key.toLowerCase()] = true
    }
    const handleKeyUp = (e) => {
      keysPressed.current[e.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Movement and game loop
  useFrame(() => {
    const newPos = playerPos.clone()
    if (keysPressed.current['w']) newPos.z -= speed
    if (keysPressed.current['s']) newPos.z += speed
    if (keysPressed.current['a']) newPos.x -= speed
    if (keysPressed.current['d']) newPos.x += speed
    if (keysPressed.current['q']) newPos.y += speed
    if (keysPressed.current['e']) newPos.y -= speed
    setPlayerPos(newPos)
  })

  // Interaction handler
  const handleInteract = async (type, isHostile) => {
    if (!ws) return
    
    const situation = isHostile ? 'hostile' : 'trading'
    ws.send(JSON.stringify({
      character_type: type,
      situation: situation
    }))

    ws.onmessage = (event) => {
      setDialogContent(event.data)
      setShowDialog(true)
    }
  }

  return (
    <>
      <Stars />
      <Environment preset="night" />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      <PlayerShip position={playerPos} rotation={playerRot} />

      {/* Friendly trading station */}
      <SpaceStation 
        position={[0, 0, -10]} 
        onInteract={() => handleInteract('merchant', false)}
      />

      {/* Friendly planet */}
      <Planet 
        position={[-10, 0, -20]} 
        color="#4444ff" 
        size={3}
        isHostile={false}
        onInteract={() => handleInteract('friendly alien', false)}
      />

      {/* Hostile planet */}
      <Planet 
        position={[10, 0, -20]} 
        color="#ff4444" 
        size={2}
        isHostile={true}
        onInteract={() => handleInteract('hostile alien', true)}
      />

      {/* Dialog UI */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alien Communication</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <p className="text-lg">{dialogContent}</p>
            <Button onClick={() => setShowDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function Component() {
  return (
    <div className="w-full h-screen">
      <Canvas camera={{ position: [0, 5, 15], fov: 75 }}>
        <GameScene />
      </Canvas>
      
      {/* Controls overlay */}
      <div className="fixed bottom-4 left-4 bg-black/50 text-white p-4 rounded-lg">
        <h3 className="font-bold mb-2">Controls:</h3>
        <p>WASD - Move horizontally</p>
        <p>Q/E - Move vertically</p>
        <p>Click objects to interact</p>
      </div>
    </div>
  )
}