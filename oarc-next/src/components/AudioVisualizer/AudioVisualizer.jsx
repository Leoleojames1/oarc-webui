import React, { useRef, useEffect } from 'react'

export default function AudioVisualizer({ audioData = new Float32Array(0), isDarkTheme = true, isUserAudio = false }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = isDarkTheme ? (isUserAudio ? '#3B82F6' : '#10B981') : (isUserAudio ? '#2563EB' : '#059669')
    ctx.strokeStyle = ctx.fillStyle

    const sliceWidth = width / audioData.length
    let x = 0

    ctx.beginPath()
    ctx.moveTo(0, height / 2)

    for (let i = 0; i < audioData.length; i++) {
      const y = (audioData[i] + 1) / 2 * height
      ctx.lineTo(x, y)
      x += sliceWidth
    }

    ctx.lineTo(width, height / 2)
    ctx.stroke()
  }, [audioData, isDarkTheme, isUserAudio])

  return (
    <div className="w-full h-full p-2 bg-opacity-50 rounded-lg" style={{ backgroundColor: isDarkTheme ? 'rgba(31, 41, 55, 0.5)' : 'rgba(243, 244, 246, 0.5)' }}>
      <canvas ref={canvasRef} width={300} height={100} className="w-full h-full" />
    </div>
  )
}