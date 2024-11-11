import { createIdGenerator, Game, Position, createEmitter } from '@/engine'
import { Disposer } from '@/utils'

export interface EntityState {
    position: Position
    zIndex: number
}

export interface EntityEvents {
    'before-render': [ [], void ]
    'after-render': [ [], void ]
    'delegated': [ [ superEntity: Entity ], void ]
    [event: string]: [ any[], any ]
}

export type InjectKey<T> = symbol & { __injectType: T }
export const injectKey = <T>() => Symbol() as InjectKey<T>

export class Entity<C extends object = any, S extends EntityState = any, E extends EntityEvents = any> {
    static generateEntityId = createIdGenerator()

    readonly id = Entity.generateEntityId()

    constructor(protected config: C, public state: S) {}

    active = true
    activate() {
        this.active = true
        return this
    }
    deactivate() {
        this.active = false
        return this
    }

    game: Game = null as any
    async start(game: Game): Promise<void> {
        this.game = game
        await Promise.all(this.delegatedEntities.map(entity => entity.start(game)))
    }

    autoRender = false
    enableAutoRender() {
        this.autoRender = true
        return this
    }

    superEntity: Entity | null = null
    delegatedEntities: Entity[] = []
    delegate(entities: Entity[]) {
        entities.forEach(entity => {
            entity.superEntity = this
            entity.emit('delegated', this)
            this.delegatedEntities.push(entity)
        })
        return this
    }

    providedValues: Record<symbol, any> = {}
    provide<T>(injectKey: InjectKey<T>, value: T) {
        this.providedValues[injectKey] = value
        return this
    }
    inject<T>(injectKey: InjectKey<T>): T | null {
        if (! this.superEntity) return null
        if (injectKey in this.superEntity.providedValues) return this.superEntity.providedValues[injectKey]
        return this.superEntity.inject(injectKey)
    }

    protected disposers: Disposer[] = []
    dispose() {
        this.disposers.forEach(dispose => dispose())
        this.delegatedEntities.forEach(entity => entity.dispose())
    }

    runRender() {
        if (! this.active) return
        this.game.ctx.save()
        this.emit('before-render')
        this.render()
        this.delegatedEntities
            .filter(entity => entity.enableAutoRender)
            .forEach(entity => entity.runRender())
        this.emit('after-render')
        this.game.ctx.restore()
    }
    protected render() {}

    runUpdate() {
        if (! this.active) return
        this.state = this.update()
        this.delegatedEntities.forEach(entity => entity.runUpdate())
    }
    protected update() {
        return this.state
    }

    protected emitter = createEmitter<this, E>()
    emit<K extends keyof E>(event: K, ...args: E[K][0]) {
        this.emitter.emit(event, this, ...args)
        return this
    }
    on<K extends keyof E>(event: K, cb: (...args: [ this, ...E[K][0] ]) => E[K][1], abortController?: AbortController) {
        const off = this.emitter.on(event, cb)
        this.disposers.push(off)
        abortController?.signal.addEventListener('abort', off)
        return this
    }
}
