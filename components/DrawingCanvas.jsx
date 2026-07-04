'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

// -----------------------------------------------------------------------------
// DrawingCanvas.jsx
// Page blanche pour dessiner, utilisée comme mode de contribution pour les
// projets de type "design". Le résultat est exporté en image (PNG data URL) et
// stocké comme n'importe quelle autre contribution (champ `content`).
// -----------------------------------------------------------------------------

const COLORS = ['#1f2937', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ffffff']

const CANVAS_WIDTH = 700
const CANVAS_HEIGHT = 420

const DrawingCanvas = forwardRef(function DrawingCanvas({ disabled }, ref) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const historyRef = useRef([])
  const [color, setColor] = useState('#1f2937')
  const [lineWidth, setLineWidth] = useState(4)
  const [canUndo, setCanUndo] = useState(false)

  // Fond blanc initial (sinon le canvas est transparent et l'export PNG serait vide à l'oeil).
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const point = e.touches?.[0] || e
    return {
      x: ((point.clientX - rect.left) / rect.width) * canvas.width,
      y: ((point.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const pushHistory = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    if (historyRef.current.length > 30) historyRef.current.shift()
    setCanUndo(true)
  }

  const startDraw = (e) => {
    if (disabled) return
    e.preventDefault()
    pushHistory()
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    drawingRef.current = true
  }

  const moveDraw = (e) => {
    if (!drawingRef.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = getPos(e)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endDraw = () => {
    drawingRef.current = false
  }

  const undo = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const prev = historyRef.current.pop()
    if (prev) ctx.putImageData(prev, 0, 0)
    if (!historyRef.current.length) setCanUndo(false)
  }

  const resetCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    historyRef.current = []
    setCanUndo(false)
  }

  const clear = () => {
    pushHistory()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  useImperativeHandle(ref, () => ({
    exportImage: () => canvasRef.current.toDataURL('image/png'),
    clear: resetCanvas,
  }))

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            disabled={disabled}
            className={`w-6 h-6 rounded-full border ${
              color === c ? 'ring-2 ring-offset-1 ring-indigo-500 border-transparent' : 'border-neutral-300'
            }`}
            style={{ backgroundColor: c }}
            aria-label={`Couleur ${c}`}
          />
        ))}
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={disabled}
          className="w-7 h-7 rounded cursor-pointer border border-neutral-300"
          aria-label="Couleur personnalisée"
        />
        <input
          type="range"
          min="1"
          max="20"
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          disabled={disabled}
          className="w-24 accent-indigo-600"
          aria-label="Épaisseur du trait"
        />
        <button type="button" onClick={undo} disabled={disabled || !canUndo} className="btn-secondary text-xs px-2 py-1">
          Annuler
        </button>
        <button type="button" onClick={clear} disabled={disabled} className="btn-secondary text-xs px-2 py-1">
          Effacer
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={startDraw}
        onMouseMove={moveDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={moveDraw}
        onTouchEnd={endDraw}
        className="w-full rounded-lg border border-neutral-200 touch-none cursor-crosshair"
        style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
      />
      <p className="text-xs text-neutral-400 mt-1">Dessinez ici, puis ajoutez votre contribution à la chaîne.</p>
    </div>
  )
})

export default DrawingCanvas
