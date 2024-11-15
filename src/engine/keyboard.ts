import { Emitter, Events } from '@/engine/events'

export interface KeyboardEvents extends Events {
    keypress: [ KeyboardEvent ]
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

    document.addEventListener('keypress', ev => {
        keys.add(ev.key)
        emitter.emit('keypress', ev)
    })

    return { keys, emitter }
}
