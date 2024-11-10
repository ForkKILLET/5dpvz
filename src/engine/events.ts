import { RemoveIndex } from '@/utils/type'

export type Events = Record<string, [ any[], any ]>

export type Emitter<T, E extends Events> = {
    events: Partial<{ [K in keyof E]: E[K][1][] }>
    emit<K extends keyof RemoveIndex<E>>(event: K, ...args: [ T, ...E[K][0] ]): void
    on<K extends keyof RemoveIndex<E>>(event: K, cb: (...args: [ T, ...E[K][0] ]) => E[K][1]): () => void
}

export const createEmitter = <T, E extends Events>(): Emitter<T, E> => {
    const events: Partial<{ [K in keyof E]: E[K][1][] }> = {}

    const emit = <K extends keyof E>(event: K, ...args: E[K][0]) => {
        events[event]?.forEach(cb => cb(...args))
    }

    const on = <K extends keyof E>(event: K, cb: E[K][1]) => {
        const cbs = events[event] ??= []
        cbs.push(cb)
        return () => {
            events[event] = cbs.filter(c => c !== cb)
        }
    }

    return { events, emit, on }
}