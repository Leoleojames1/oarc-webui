'use client'

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Orbitron } from 'next/font/google'

const orbitron = Orbitron({ subsets: ['latin'] })

const SpaceBackground = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const ships = []
    const shipCount = 12
    const stars = []
    const starCount = 200

    class Star {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 1.5 + 0.5
      }

      draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    class SpaceShip {
      constructor() {
        this.reset()
      }

      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height - canvas.height
        this.z = Math.random() * 1.5 + 1
        this.baseSpeed = (3 - this.z) * 0.5
        this.speed = { x: 0, y: this.baseSpeed }
        this.color = `hsl(${Math.random() * 60 + 180}, 100%, 50%)`
        this.trail = []
        this.maxTrailLength = 100
        this.time = 0
        this.orbitFrequency = Math.random() * 0.2 + 0.1
        this.orbitAmplitude = Math.random() * 10 + 5 // Reduced orbit amplitude
        this.lightningTree = null
      }

      move() {
        this.time += 0.1
        
        // Smoother movement with gradual changes
        const targetSpeedX = (Math.random() - 0.5) * this.baseSpeed
        const targetSpeedY = this.baseSpeed + Math.random() * this.baseSpeed * 0.5

        this.speed.x += (targetSpeedX - this.speed.x) * 0.1
        this.speed.y += (targetSpeedY - this.speed.y) * 0.1

        this.x += this.speed.x
        this.y += this.speed.y

        // Constrain movement
        this.x = Math.max(0, Math.min(canvas.width, this.x))
        
        if (this.y > canvas.height) {
          this.reset()
        }

        this.trail.unshift({ x: this.x, y: this.y, time: this.time })
        if (this.trail.length > this.maxTrailLength) {
          this.trail.pop()
        }

        // Generate lightning tree only once
        if (!this.lightningTree) {
          this.lightningTree = this.generateLightningTree()
        }
      }

      generateLightningTree() {
        const tree = []
        const generateBranch = (x, y, angle, depth) => {
          if (depth <= 0) return

          const length = Math.random() * 30 + 15
          const endX = x + Math.cos(angle) * length
          const endY = y + Math.sin(angle) * length

          tree.push({ startX: x, startY: y, endX, endY })

          if (Math.random() < 0.6) {
            generateBranch(endX, endY, angle + Math.random() * 0.5 - 0.25, depth - 1)
          }
          if (Math.random() < 0.6) {
            generateBranch(endX, endY, angle - Math.random() * 0.5 + 0.25, depth - 1)
          }
        }

        generateBranch(this.x, this.y, Math.PI, 4)
        return tree
      }

      draw() {
        // Draw orbiting lightning (smaller circles)
        ctx.strokeStyle = this.color
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < Math.PI * 2; i += 0.1) {
          const orbitX = this.x + Math.cos(i + this.time * this.orbitFrequency) * this.orbitAmplitude
          const orbitY = this.y + Math.sin(i + this.time * this.orbitFrequency) * this.orbitAmplitude
          ctx.lineTo(orbitX, orbitY)
        }
        ctx.closePath()
        ctx.stroke()

        // Draw backwards lightning trail
        ctx.beginPath()
        this.trail.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y)
          } else {
            ctx.lineTo(point.x, point.y)
          }
        })
        ctx.stroke()

        // Draw lightning tree
        if (this.lightningTree) {
          ctx.beginPath()
          this.lightningTree.forEach(branch => {
            ctx.moveTo(branch.startX, branch.startY)
            ctx.lineTo(branch.endX, branch.endY)
          })
          ctx.stroke()
        }

        // Draw lightning glow
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 4
        ctx.stroke()

        // Draw spaceship
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.moveTo(this.x, this.y - 15 / this.z)
        ctx.lineTo(this.x - 7.5 / this.z, this.y + 15 / this.z)
        ctx.lineTo(this.x + 7.5 / this.z, this.y + 15 / this.z)
        ctx.closePath()
        ctx.fill()

        // Draw engine glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.beginPath()
        ctx.arc(this.x, this.y + 15 / this.z, 4 / this.z, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    for (let i = 0; i < shipCount; i++) {
      ships.push(new SpaceShip())
    }

    for (let i = 0; i < starCount; i++) {
      stars.push(new Star())
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      stars.forEach(star => star.draw())

      ships.forEach(ship => {
        ship.move()
        ship.draw()
      })

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />
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
    <div className={`min-h-screen bg-black text-white overflow-hidden ${orbitron.className}`}>
      <SpaceBackground />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
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

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur-xl opacity-75"></div>
          <div className="relative bg-black bg-opacity-50 rounded-3xl p-8">
            <div className="flex flex-col items-center justify-center space-y-8">
              <AlienButton href="/oarcUI">Enter OARC UI</AlienButton>
              <AlienButton href="/profile">User Identity</AlienButton>
              <AlienButton href="/settings">System Config</AlienButton>
            </div>
          </div>
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