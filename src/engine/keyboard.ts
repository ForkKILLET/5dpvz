import { Emitter, Events } from '@/engine/events'

export interface KeyboardEvents extends Events {
    keydown: [ KeyboardEvent ]
    keyup: [ KeyboardEvent ]
}

export interface Keyboard {
    keys: Set<string>
    emitter: Emitter<KeyboardEvents>
}

export const useKeyboard = (): Keyboard => {
    const keys = new Set<string>()
    const emitter = new Emitter<KeyboardEvents>()

    document.addEventListener('keydown', ev => {
        keys.add(ev.key)
        emitter.emit('keydown', ev)
    })

    document.addEventListener('keyup', ev => {
        keys.delete(ev.key)
        emitter.emit('keyup', ev)
    })

    return { keys, emitter }
}
