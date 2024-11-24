import { Game } from '@/engine'

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

        timer += this.game.mspf
        if (timer > interval) {
            if (! once) timer -= interval
            else timer = interval
            onTimer()
        }

        (this.state[timerName] as number) = timer
        return interval - timer
    }
}
