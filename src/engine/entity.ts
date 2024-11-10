import { createIdGenerator, Game, Position, createEmitter } from '@/engine'
import { Disposer, RemoveIndex } from '@/utils'

export interface CommonState {
    position: Position
    zIndex: number
}

export interface CommonEvents {
    'before-render': [ [], void ]
    'after-render': [ [], void ]
    [key: string]: [ any[], any ]
}

export abstract class Entity<C extends object, S extends CommonState, E extends CommonEvents> {
    static generateEntityId = createIdGenerator()

    readonly id = Entity.generateEntityId()

    constructor(protected config: C, public state: S) {}

    game: Game = null as any
    start(game: Game): Promise<void> | void {
        this.game = game
    }

    protected disposers: Disposer[] = []
    dispose() {
        this.disposers.forEach(dispose => dispose())
    }

    runRender() {
        this.game.ctx.save()
        this.emit('before-render')
        this.render()
        this.emit('after-render')
        this.game.ctx.restore()
    }
    protected abstract render(): void

    abstract update(): S

    protected emitter = createEmitter<this, E>()
    emit<K extends keyof RemoveIndex<E>>(event: K, ...args: E[K][0]) {
        this.emitter.emit(event, this, ...args)
        return this
    }
    on<K extends keyof RemoveIndex<E>>(event: K, cb: (...args: [ this, ...E[K][0] ]) => E[K][1], abortController?: AbortController) {
        const off = this.emitter.on(event, cb)
        this.disposers.push(off)
        abortController?.signal.addEventListener('abort', off)
        return this
    }
}
