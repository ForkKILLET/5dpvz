import { createEmitter, Emitter, Position } from '@/engine'

export interface Mouse {
    position: Position
    emitter: Emitter<null, MouseEvents>
}

export interface MouseEvents {
    'click': [ [ MouseEvent ], void ]
    [event: string]: [ any[], any ]
}

export const useMouse = (ctx: CanvasRenderingContext2D): Mouse => {
    const position: Position = { x: 0, y: 0 }

    document.addEventListener('mousemove', evt => {
        const rect = ctx.canvas.getBoundingClientRect()
        position.x = evt.clientX - rect.left
        position.y = evt.clientY - rect.top
    })

    ctx.canvas.addEventListener('click', evt => {
        emitter.emit('click', null, evt)
    })

    const emitter = createEmitter<null, MouseEvents>()

    return { position, emitter }
}

export interface ClickableEvents {
    click: [ [], void ]
    mouseenter: [ [], void ]
    mouseleave: [ [], void ]
}