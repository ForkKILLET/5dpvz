import { Position } from '@/engine'

export interface Mouse {
    position: Position
}

export const useMouse = (ctx: CanvasRenderingContext2D) => {
    const position: Position = { x: 0, y: 0 }
    document.addEventListener('mousemove', (e) => {
        const rect = ctx.canvas.getBoundingClientRect()
        position.x = e.clientX - rect.left
        position.y = e.clientY - rect.top
    })
    return { position }
}   