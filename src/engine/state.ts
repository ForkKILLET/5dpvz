import { Entity, Game } from '@/engine'
import { isPrimitive } from '@/utils'

export class State<S> {
    constructor(public state: S) {}

    readonly game = Game.defaultGame

    updateTimer<K extends keyof S & keyof { [K in keyof S as S[K] extends number ? K : never]: void }>(
        timerName: K,
        { interval, once = false }: { interval: number, once?: boolean },
        onTimer: () => void
    ) {
        let timer = this.state[timerName] as number
        if (timer === interval && once) return 0

        timer += this.game.mspf0
        if (timer > interval) {
            if (! once) timer -= interval
            else timer = interval
            onTimer()
        }

        (this.state[timerName] as number) = timer
        return interval - timer
    }

    cloneState(entityMap: Map<number, Entity>): S {
        const _cloneState = <T>(state: T): T => {
            if (isPrimitive(state)) return state
            if (state instanceof Array) return state.map(_cloneState) as T
            if (state instanceof Set) return new Set(Array.from(state).map(_cloneState)) as T
            if (state instanceof Entity) return entityMap.get(state.id) as T
            return Object.fromEntries(
                Object.entries(state as {}).map(([ k, v ]) => [ k, _cloneState(v) ])
            ) as T
        }
        return _cloneState(this.state)
    }
}
