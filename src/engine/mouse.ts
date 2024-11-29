import { Emitter, Events, Game, Vector2D } from '@/engine'

export interface MouseEvents extends Events {
    click: [ MouseEvent ]
    rightclick: [ MouseEvent ]
}

export interface Mouse {
    position: Vector2D
    emitter: Emitter<MouseEvents>
}

export const useMouse = (game: Game): Mouse => {
    const { ctx } = game
    const position: Vector2D = { x: 0, y: 0 }

    document.addEventListener('mousemove', ev => {
        const rect = ctx.canvas.getBoundingClientRect()
        position.x = ev.clientX - rect.left
        position.y = ev.clientY - rect.top
    })

    ctx.canvas.addEventListener('contextmenu', ev => {
        ev.preventDefault()
        emitter.emit('rightclick', ev)
    })

    ctx.canvas.addEventListener('click', event => {
        emitter.emit('click', event)
    })

    const emitter = new Emitter<MouseEvents>()

    return { position, emitter }
}
