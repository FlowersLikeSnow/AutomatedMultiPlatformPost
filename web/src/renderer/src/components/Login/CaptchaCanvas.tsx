import { useEffect, useRef, useCallback } from 'react'

interface CaptchaCanvasProps {
  width?: number
  height?: number
  onChange?: (code: string) => void
}

function randomColor(min: number, max: number): string {
  const r = Math.floor(Math.random() * (max - min) + min)
  const g = Math.floor(Math.random() * (max - min) + min)
  const b = Math.floor(Math.random() * (max - min) + min)
  return `rgb(${r},${g},${b})`
}

function generateCode(length = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function CaptchaCanvas({
  width = 120,
  height = 40,
  onChange
}: CaptchaCanvasProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const codeRef = useRef<string>('')

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background
    ctx.fillStyle = randomColor(200, 240)
    ctx.fillRect(0, 0, width, height)

    // Generate code
    const code = generateCode()
    codeRef.current = code
    onChange?.(code)

    // Draw text
    const fontSize = Math.floor(height * 0.6)
    ctx.font = `bold ${fontSize}px Arial`
    ctx.textBaseline = 'middle'

    for (let i = 0; i < code.length; i++) {
      const txt = code[i]
      const x = (width / (code.length + 1)) * (i + 1) - fontSize / 4
      const y = height / 2 + (Math.random() * 6 - 3)
      const deg = Math.random() * 30 - 15

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate((deg * Math.PI) / 180)
      ctx.fillStyle = randomColor(50, 160)
      ctx.fillText(txt, 0, 0)
      ctx.restore()
    }

    // Draw noise lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = randomColor(40, 180)
      ctx.beginPath()
      ctx.moveTo(Math.random() * width, Math.random() * height)
      ctx.lineTo(Math.random() * width, Math.random() * height)
      ctx.stroke()
    }

    // Draw noise dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = randomColor(0, 255)
      ctx.beginPath()
      ctx.arc(Math.random() * width, Math.random() * height, 1, 0, 2 * Math.PI)
      ctx.fill()
    }
  }, [width, height, onChange])

  useEffect(() => {
    draw()
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={draw}
      className="cursor-pointer rounded border border-[var(--border-color)]"
      title="点击刷新验证码"
    />
  )
}
