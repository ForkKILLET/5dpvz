import { createIdGenerator, Game, Position, Emitter, Events } from '@/engine'
import { Disposer, RemoveIndex } from '@/utils'

export interface EntityState {
    position: Position
    zIndex: number
}

export interface EntityEvents extends Events {
    'before-render': []
    'after-render': []
    'delegated': [ superEntity: Entity ]
}

export type InjectKey<T> = symbol & { __injectType: T }
export const injectKey = <T>() => Symbol() as InjectKey<T>

export abstract class Comp {
    static dependencies: CompCtor[] = []
}

export type CompCtor<C extends Comp = Comp> = new (...args: any[]) => C

export class Entity<C = any, S extends EntityState = any, E extends EntityEvents = EntityEvents> {
    static generateEntityId = createIdGenerator()

    readonly id = Entity.generateEntityId()

    constructor(protected config: C, public state: S) {}

    active = true
    get deepActive(): boolean {
        return this.active && (this.superEntity?.deepActive ?? true)
    }
    activate() {
        this.active = true
        return this
    }
    deactivate() {
        this.active = false
        return this
    }

    game: Game = null as any
    async start(game: Game): Promise<this> {
        this.game = game
        game.allEntities.push(this)
        await Promise.all(this.delegatedEntities.map(entity => entity.start(game)))
        return this
    }
    startThen(game: Game, fn: (self: this) => void) {
        this.start(game).then(() => fn(this))
        return this
    }

    autoRender = false
    enableAutoRender() {
        this.autoRender = true
        return this
    }

    superEntity: Entity | null = null
    delegatedEntities: Entity[] = []
    delegate(...entities: Entity[]) {
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
    disposed = false
    dispose() {
        if (this.disposed) return
        this.disposed = true

        this.disposers.forEach(dispose => dispose())
        this.delegatedEntities.forEach(entity => entity.dispose())

        if (! this.game) return
        const index = this.game.allEntities.indexOf(this)
        if (index >= 0) this.game.allEntities.splice(index, 1)
    }

    comps: Comp[] = []
    hasComp(...Comps: CompCtor[]) {
        return Comps.every(Comp => this.comps.some(comp => comp instanceof Comp))
    }
    addComp(comp: Comp) {
        const { dependencies } = comp.constructor as typeof Comp
        if (! this.hasComp(...dependencies))
            throw new Error(`Missing dependencies: ${dependencies.map(Comp => Comp.name).join(', ')}.`)
        this.comps.push(comp)
        return this
    }
    removeComp(comp: Comp) {
        const index = this.comps.indexOf(comp)
        if (index >= 0) this.comps.splice(index, 1)
        return this
    }
    getComp<C extends Comp>(Comp: CompCtor<C>): C | undefined {
        return this.comps.find((comp): comp is C => comp instanceof Comp)
    }
    withComp<C extends Comp>(Comp: CompCtor<C>, fn: (comp: C | undefined) => void) {
        fn(this.getComp(Comp))
        return this
    }
    getComps<C extends Comp>(Comp: CompCtor<C>): C[] {
        return this.comps.filter((comp): comp is C => comp instanceof Comp)
    }

    runRender(immediate = false) {
        if (! this.active || this.disposed) return

        const render = () => {
            this.game.ctx.save()
            this.emit('before-render')
            this.render()
            this.emit('after-render')
            this.game.ctx.restore()
        }
    
        this.preRunder(immediate)

        if (immediate) render()
        else this.game.addRenderJob({
            zIndex: this.state.zIndex,
            render
        })
    }
    protected preRunder(immediate = false) {
        this.delegatedEntities
            .filter(entity => entity.autoRender)
            .forEach(entity => entity.runRender(immediate))
    }
    protected render() {}

    runUpdate() {
        if (! this.active || this.disposed) return
        this.state = this.update()
        this.delegatedEntities.forEach(entity => entity.runUpdate())
    }
    protected update() {
        return this.state
    }

    protected emitter = new Emitter<E>()
    emit<K extends keyof RemoveIndex<E>>(event: K, ...args: E[K]) {
        if (! this.active || this.disposed) return
        this.emitter.emit(event, ...args)
        return this
    }
    on<K extends keyof RemoveIndex<E>>(event: K, listener: (...args: E[K]) => void, abortController?: AbortController) {
        const off = this.emitter.on(event, listener)
        this.disposers.push(off)
        abortController?.signal.addEventListener('abort', off)
        return this
    }
    forwardEvents<F extends Events, Ks extends (keyof RemoveIndex<E> & keyof RemoveIndex<F>)[]>(source: Emitter<F>, events: Ks) {
        this.emitter.forward(source, events)
        return this
    }
}
