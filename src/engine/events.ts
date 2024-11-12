import { Disposer, RemoveIndex } from '@/utils'

export type Events = Record<string, any[]>

export type Listener<E extends Events, K extends keyof E> = (...args: E[K]) => void

export class Emitter<E extends Events> {
    listeners: Partial<{
        [K in keyof E]: Listener<E, K>[]
    }> = {}

    emit<K extends keyof RemoveIndex<E>>(event: K, ...args: E[K]) {
        this.listeners[event]?.forEach(listener => listener(...args))
    }

    on<K extends keyof RemoveIndex<E>>(event: K, listener: Listener<E, K>) {
        const currentListeners = this.listeners[event] ??= []
        currentListeners.push(listener)
        return () => {
            this.listeners[event] = currentListeners.filter(c => c !== listener)
        }
    }

    onSome<const Ks extends (keyof RemoveIndex<E>)[]>(
        events: Ks, listener: (...args: [ Ks[number], ...E[Ks[number]] ]) => void
    ) {
        const disposers: Disposer[] = events
            .map(event => this.on(event, (...args) => listener(event, ...args)))
        return () => disposers.forEach(fn => fn())
    }

    forward<F extends Events, const Ks extends (keyof RemoveIndex<F> & RemoveIndex<E>)[]>(
        source: Emitter<F>, events: Ks
    ) {
        events.forEach(event => {
            let locked = false
            const lock = (fn: () => void) => {
                if (locked) return
                locked = true
                fn()
                locked = false
            }
            source.on(event, (...args) => lock(() => this.emit(event as any, ...args as any)))
            this.on(event as any, (...args) => lock(() => source.emit(event, ...args as any)))
        })
    }
}