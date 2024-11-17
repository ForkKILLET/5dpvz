import { createIdGenerator, Game, Position, Emitter, Events, add } from '@/engine'
import { Disposer, remove, RemoveIndex } from '@/utils'
import { placeholder } from '@/utils/any'

export interface EntityState {
    position: Position
    zIndex: number
}

export interface EntityEvents extends Events {
    'start': []
    'before-render': []
    'after-render': []
    'attached': [ superEntity: Entity ]
    'unattached': []
    'dispose': []
    'position-update': [ delta: Position ]
}

export type InjectKey<T> = symbol & { __injectType: T }
export const injectKey = <T>(description: string) => Symbol(description) as InjectKey<T>

export class Comp {
    static dependencies: CompCtor[] = []

    constructor(public readonly entity: Entity) {}

    update() {}
}

export type CompCtor<C extends Comp = Comp> = new (...args: any[]) => C

export class Entity<
    C = any,
    S extends EntityState = EntityState,
    E extends EntityEvents = EntityEvents
> {
    static generateEntityId = createIdGenerator()

    readonly id = Entity.generateEntityId()

    started = false

    constructor(public config: C, public state: S) {}

    active = true
    get deepActive(): boolean {
        return this.active && (this.superEntity?.deepActive ?? true)
    }
    activate() {
        this.active = true
        this.afterStart(() => this.game.emitter.emit('entityActivate', this))
        return this
    }
    deactivate() {
        this.active = false
        this.afterStart(() => this.game.emitter.emit('entityDeactivate', this))
        return this
    }

    game: Game = placeholder
    starters: (() => void)[] = []
    async start(game: Game): Promise<void> {
        this.game = game
        game.allEntities.push(this)
        await Promise.all(this.starters.map(fn => fn()))
    }
    runStart(game: Game) {
        this.start(game).then(() => {
            this.started = true
            this.emit('start')
            this.game.emitter.emit('entityStart', this)
        })
        return this
    }
    beforeStart(fn: () => void) {
        if (this.started) fn()
        else this.starters.push(fn)
        return this
    }
    afterStart(fn: (self: this) => void) {
        if (this.started) fn(this)
        else this.on('start', () => fn(this))
        return this
    }
    toStart() {
        return new Promise(res => this.afterStart(res))
    }

    autoRender = true
    setAutoRender(autoRender: boolean) {
        this.autoRender = autoRender
        return this
    }

    superEntity: Entity | null = null
    attachedEntities: Entity[] = []
    attach(...entities: Entity[]) {
        entities.forEach(entity => this.beforeStart(() => new Promise<void>(res => {
            entity
                .runStart(this.game)
                .afterStart(() => {
                    entity.superEntity = this
                    this.attachedEntities.push(entity)
                    entity
                        .emit('attached', this)
                        .on('dispose', () => {
                            this.unattach(entity)
                        })
                    this.game.emitter.emit('entityAttach', entity)
                    res()
                })
        })))
        return this
    }
    attachTo(superEntity: Entity) {
        superEntity.attach(this)
        return this
    }
    unattach(...entities: Entity[]) {
        entities.forEach(entity => entity.emit('unattached'))
        this.attachedEntities = this.attachedEntities.filter(entity => ! entities.includes(entity))
        return this
    }

    select<E extends Entity>(EntityCtor: EntityCtor<E>): E | undefined {
        return this.attachedEntities.find((entity): entity is E => entity instanceof EntityCtor)
    }
    selectAll<E extends Entity>(EntityCtor: EntityCtor<E>): E[] {
        return this.attachedEntities.filter((entity): entity is E => entity instanceof EntityCtor)
    }

    providedValues: Record<symbol, any> = {}
    provide<T>(injectKey: InjectKey<T>, value: T) {
        this.providedValues[injectKey] = value
        return this
    }
    get injectableKeys(): symbol[] {
        return [
            ...Object.getOwnPropertySymbols(this.providedValues),
            ...this.superEntity?.injectableKeys ?? [],
        ]
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
        this.emit('dispose')
        this.game.emitter.emit('entityStart', this)

        this.disposers.forEach(dispose => dispose())
        this.attachedEntities.forEach(entity => entity.dispose())

        if (! this.game) return
        remove(this.game.allEntities, entity => entity === this)
    }

    comps: Comp[] = []
    hasComp(...Comps: CompCtor[]) {
        return Comps.every(Comp => this.comps.some(comp => comp instanceof Comp))
    }
    addComp<A extends any[], C extends Comp>(
        Comp: new (entity: this, ...args: A) => C,
        ...args: A
    ) {
        this.afterStart(() => {
            const { dependencies } = Comp as any as { dependencies: CompCtor[] }
            if (! this.hasComp(...dependencies))
                throw new Error(`Missing dependencies: ${ dependencies.map(Dep => Dep.name).join(', ') }.`)

            this.comps.push(new Comp(this, ...args))
        })
        return this
    }
    removeComp(comp: Comp) {
        remove(this.comps, c => c === comp)
        return this
    }
    getComp<C extends Comp>(Comp: CompCtor<C>): C | undefined {
        return this.comps.find((comp): comp is C => comp instanceof Comp)
    }
    withComp<C extends Comp>(Comp: CompCtor<C>, fn: (comp: C) => void) {
        return this.afterStart(() => {
            const comp = this.getComp(Comp)
            if (comp) fn(comp)
        })
    }
    withComps<const Cs extends Comp[]>(Comps: { [I in keyof Cs]: CompCtor<Cs[I]> }, fn: (...comps: Cs) => void) {
        return this.afterStart(() => {
            const comps = Comps.map(this.getComp.bind(this))
            if (comps.every(comp => comp)) fn(...comps as Cs)
        })
    }
    getComps<C extends Comp>(Comp: CompCtor<C>): C[] {
        return this.comps.filter((comp): comp is C => comp instanceof Comp)
    }

    runRender() {
        this.preRender()

        this.addRenderJob(() => {
            this.render()
        })
    }
    addRenderJob(renderer: () => void, zIndexDelta = 0) {
        this.game.addRenderJob({
            zIndex: this.state.zIndex + zIndexDelta,
            renderer: () => {
                this.bubble('before-render')
                renderer()
                this.bubble('after-render')
            },
        })
    }
    protected preRender() {
        this.attachedEntities
            .filter(entity => entity.active && entity.autoRender)
            .forEach(entity => entity.runRender())
    }
    protected render() {}

    frozen = false
    freeze() {
        this.frozen = true
        return this
    }
    unfreeze() {
        this.frozen = false
        return this
    }

    runUpdate() {
        if (! this.active || this.disposed) return
        this.preUpdate()
    }
    preUpdate() {
        this.update()
        this.comps.forEach(comp => comp.update())
        this.attachedEntities.forEach(entity => entity.runUpdate())
    }
    protected update() {}

    protected emitter = new Emitter<E>()
    emit<K extends keyof RemoveIndex<E>>(event: K, ...args: E[K]) {
        this.emitter.emit(event, ...args)
        return this
    }
    bubble<K extends keyof RemoveIndex<E>>(event: K, ...args: E[K]) {
        this.emit(event, ...args)
        this.superEntity?.bubble(event, ...args)
        return this
    }
    on<K extends keyof RemoveIndex<E>>(event: K, listener: (...args: E[K]) => void) {
        const off = this.emitter.on(event, listener)
        this.disposers.push(off)
        return this
    }
    forwardEvents<F extends Events, Ks extends (keyof RemoveIndex<E> & keyof RemoveIndex<F>)[]>(
        source: Emitter<F>, events: Ks,
    ) {
        this.emitter.forward(source, events)
        return this
    }

    updateTimer<K extends keyof {
        [K in keyof S as S[K] extends number ? K : never]: void
    }>(
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
    updatePosition(delta: Position) {
        this.emit('position-update', delta)
        this.state.position = add(this.state.position, delta)
        this.attachedEntities.forEach(entity => entity.updatePosition(delta))
    }
}

export type EntityCtor<E extends Entity = Entity> = new (...args: any[]) => E
