import { Emitter, Events } from '@/engine/events'

export interface KeyboardEvents extends Events {
    keydown: [ KeyboardEvent ]
    keyup: [ KeyboardEvent ]
    keypress: [ KeyboardEvent ]
}

export interface Keyboard {
    keys: Set<string>
    emitter: Emitter<KeyboardEvents>
}

export const useKeyboard = (): Keyboard => {
    const keys = new Set<string>()
    const emitter = new Emitter<KeyboardEvents>()

    document.addEventListener('keydown', ev => {
        emitter.emit('keydown', ev)
        keys.add(ev.key)
    })
    document.addEventListener('keyup', ev => {
        emitter.emit('keyup', ev)
        keys.delete(ev.key)
    })
    window.addEventListener('blur', () => {
        keys.clear()
    })
    document.addEventListener('keypress', ev => {
        emitter.emit('keypress', ev)
    })

    return { keys, emitter }
}
