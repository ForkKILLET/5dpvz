import { Disposer, eq, remove, RemoveIndex } from '@/utils'

export type Events = Record<string, any[]>

export type Listener<V extends Events, K extends keyof V> = (...args: V[K]) => boolean | void

export interface ListenerOptions {
    capture?: boolean
}

export class Emitter<V extends Events> {
    private active = true
    activate() {
        this.active = true
    }
    deactivate() {
        this.active = false
    }

    listeners: Partial<{
        [K in keyof V]: {
            normal: Listener<V, K>[]
            capture: Listener<V, K>[]
        }
    }> = {}

    emit<K extends keyof RemoveIndex<V>>(event: K, ...args: V[K]) {
        if (! this.active) return

        const listeners = this.listeners[event]
        if (! listeners) return
        for (const listener of listeners.capture)
            if (listener(...args) === false) return
        for (const listener of listeners.normal)
            listener(...args)
    }

    on<K extends keyof RemoveIndex<V>>(
        event: K,
        listener: Listener<V, K>,
        { capture = false }: ListenerOptions = {}
    ) {
        const currentListeners = this.listeners[event] ??= {
            normal: [],
            capture: [],
        }
        const concreteListeners = currentListeners[capture ? 'capture' : 'normal']
        concreteListeners.push(listener)
        return () => remove(concreteListeners, eq(listener))
    }

    onSome<const Ks extends (keyof RemoveIndex<V>)[]>(
        events: Ks, listener: (...args: [ Ks[number], ...V[Ks[number]] ]) => void,
    ) {
        const disposers: Disposer[] = events
            .map(event => this.on(event, (...args) => listener(event, ...args)))
        return () => disposers.forEach(fn => fn())
    }

    forward<F extends Events, const Ks extends (keyof RemoveIndex<F> & keyof RemoveIndex<V>)[]>(
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
