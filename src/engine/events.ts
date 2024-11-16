import { Disposer, eq, remove, RemoveIndex } from '@/utils'

export type Events = Record<string, any[]>

export type Listener<E extends Events, K extends keyof E> = (...args: E[K]) => boolean | void

export class Emitter<E extends Events> {
    listeners: Partial<{
        [K in keyof E]: {
            normal: Listener<E, K>[]
            capture: Listener<E, K>[]
        }
    }> = {}

    emit<K extends keyof RemoveIndex<E>>(event: K, ...args: E[K]) {
        const listeners = this.listeners[event]
        if (! listeners) return
        for (const listener of listeners.capture)
            if (listener(...args) === false) return
        for (const listener of listeners.normal)
            listener(...args)
    }

    on<K extends keyof RemoveIndex<E>>(
        event: K,
        listener: Listener<E, K>,
        { capture = false }: { capture?: boolean } = {}
    ) {
        const currentListeners = this.listeners[event] ??= {
            normal: [],
            capture: [],
        }
        const concreteListeners = currentListeners[capture ? 'capture' : 'normal']
        concreteListeners.push(listener)
        return () => remove(concreteListeners, eq(listener))
    }

    onSome<const Ks extends (keyof RemoveIndex<E>)[]>(
        events: Ks, listener: (...args: [ Ks[number], ...E[Ks[number]] ]) => void,
    ) {
        const disposers: Disposer[] = events
            .map(event => this.on(event, (...args) => listener(event, ...args)))
        return () => disposers.forEach(fn => fn())
    }

    forward<F extends Events, const Ks extends (keyof RemoveIndex<F> & keyof RemoveIndex<E>)[]>(
        source: Emitter<F>, events: Ks,
    ) {
        events.forEach(event => {
            let locked = false
            const lock = (fn: () => void) => {
                if (locked) return
                locked = true
                fn()
                locked = false
            }
            source.on(event, (...args) => lock(() => this.emit(event, ...args as any)))
            this.on(event, (...args) => lock(() => source.emit(event, ...args as any)))
        })
    }
}

export interface Stopable {
    stop(): void
}
