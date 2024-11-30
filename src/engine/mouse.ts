import { Emitter, Events, Game, Vector2D } from '@/engine'

export interface MouseEvents extends Events {
    click: [ MouseEvent ]
    rightclick: [ MouseEvent ]
}

export interface Mouse {
    pos: Vector2D
    emitter: Emitter<MouseEvents>
}

export const useMouse = (game: Game): Mouse => {
    const { canvas } = game.ctx
    const pos: Vector2D = { x: 0, y: 0 }

    document.addEventListener('mousemove', ev => {
        const rect = canvas.getBoundingClientRect()
        pos.x = ev.clientX - rect.left
        pos.y = ev.clientY - rect.top
    })

    canvas.addEventListener('contextmenu', ev => {
        ev.preventDefault()
        emitter.emit('rightclick', ev)
    })

    canvas.addEventListener('click', event => {
        emitter.emit('click', event)
    })

    const emitter = new Emitter<MouseEvents>()

    return { pos, emitter }
}
