import { createIdGenerator, Game, Position, Emitter, Events, positionAdd, ListenerOptions } from '@/engine'
import { Disposer, remove, RemoveIndex } from '@/utils'

export interface EntityState {
    position: Position
    zIndex: number
    scale?: number
}

export interface EntityEvents extends Events {
    'start': []
    'before-render': []
    'after-render': []
    'attach': [ superEntity: Entity ]
    'unattach': []
    'dispose': []
    'position-update': [ delta: Position ]
}

export type InjectKey<T> = symbol & { __injectType: T }
export const injectKey = <T>(description: string) => Symbol(description) as InjectKey<T>

export class Comp<E extends Entity = Entity> {
    static dependencies: CompCtor[] = []

    constructor(public readonly entity: E) {}

    update() {}
    frozenUpdate() {}
}
export type CompCtor<C extends Comp = Comp> =
    | (new (...args: any[]) => C)
    | (abstract new (...args: any[]) => C)
export type CompSelector<C extends Comp> =
    | CompCtor<C>
    | [ Comp: CompCtor<C>, filter: (comp: C) => boolean ]

export class Entity<
    C = any,
    S extends EntityState = EntityState,
    V extends EntityEvents = EntityEvents
> {
    static generateEntityId = createIdGenerator()

    readonly id = Entity.generateEntityId()

    readonly game = Game.defaultGame

    constructor(public config: C, public state: S) {}

    active = true
    get deepActive(): boolean {
        return this.active && (this.superEntity?.deepActive ?? true)
    }
    activate() {
        this.active = true
        this.game.emitter.emit('entityActivate', this)
        return this
    }
    deactivate() {
        this.active = false
        this.game.emitter.emit('entityDeactivate', this)
        return this
    }

    startedToStart = false
    started = false
    starters: (() => void)[] = []
    async start(): Promise<void> {
        this.game.allEntities.push(this)
        await Promise.all(this.starters.map(fn => fn()))
    }
    runStart() {
        this.startedToStart = true
        this.start().then(() => {
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
    afterStart(fn: (self: this) => void, capture = false) {
        if (this.started) fn(this)
        else this.on('start', () => fn(this), { capture })
        return this
    }
    toStart() {
        return new Promise(res => this.afterStart(res))
    }

    with(fn: (entity: this) => void) {
        fn(this)
        return this
    }
    as<T>() {
        return this as unknown as T
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
                .runStart()
                .afterStart(() => {
                    entity.superEntity = this
                    this.attachedEntities.push(entity)
                    entity
                        .emit('attach', this)
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
        entities.forEach(entity => entity.emit('unattach'))
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

    log(message: string) {
        console.log(`Entity #${ this.id }: ${ message }\n%o`, this)
    }
    error(message: string) {
        message = `Entity #${ this.id }: ${ message }`
        console.error(`${ message }\n%o`, this)
        throw new Error(message)
    }

    comps: Comp[] = []
    hasComp(...Comps: CompCtor[]) {
        return Comps.every(Comp => this.comps.some(comp => comp instanceof Comp))
    }
    getCompSelector<C extends Comp>(Comp: CompSelector<C>) {
        return (comp: Comp): comp is C => {
            if (typeof Comp === 'function') return comp instanceof Comp
            return comp instanceof Comp[0] && Comp[1](comp)
        }
    }
    addCompRaw(comp: Comp) {
        const _addComp = () => {
            const { dependencies } = comp.constructor as any as { dependencies: CompCtor[] }
            if (! this.hasComp(...dependencies))
                this.error(`Component missing dependencies: ${ dependencies.map(Dep => Dep.name).join(', ') }.`)

            this.comps.push(comp)
        }
        if (this.started) _addComp()
        else this.afterStart(_addComp, this.startedToStart)
        return this
    }
    addComp<A extends any[], C extends Comp>(Comp: new (entity: this, ...args: A) => C, ...args: A) {
        return this.addCompRaw(new Comp(this, ...args))
    }
    removeComp<C extends Comp>(Comp: CompSelector<C>) {
        return this.afterStart(() => {
            this.comps = this.comps.filter(this.getCompSelector(Comp))
        })
    }
    getComp<C extends Comp>(Comp: CompSelector<C>): C | undefined {
        return this.comps.find(this.getCompSelector(Comp))
    }
    withComp<C extends Comp>(Comp: CompSelector<C>, fn: (comp: C) => void) {
        return this.afterStart(() => {
            const comp = this.getComp(Comp)
            if (comp) fn(comp)
        })
    }
    withComps<const Cs extends Comp[]>(Comps: { [I in keyof Cs]: CompSelector<Cs[I]> }, fn: (...comps: Cs) => void) {
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
    preRender() {
        this.attachedEntities
            .filter(entity => entity.active && entity.autoRender)
            .forEach(entity => entity.runRender())
    }
    render() {}

    frozen = false
    unfreezable = false
    get deepFrozen(): boolean {
        return ! this.unfreezable
            && (this.frozen || (this.superEntity?.deepFrozen ?? false))
    }
    setUnfreezable() {
        this.unfreezable = true
        return this
    }
    freeze() {
        if (! this.unfreezable) this.frozen = true
        return this
    }
    unfreeze() {
        this.frozen = false
        return this
    }

    runUpdate() {
        if (! this.active || this.disposed) return
        this.frozenUpdate()
        this.comps.forEach(comp => comp.frozenUpdate())
        this.attachedEntities.forEach(entity => entity.runUpdate())
        if (this.deepFrozen) return
        this.update()
        this.comps.forEach(comp => comp.update())
    }
    update() {}
    frozenUpdate() {}

    protected emitter = new Emitter<V>()
    emit<K extends keyof RemoveIndex<V>>(event: K, ...args: V[K]) {
        this.emitter.emit(event, ...args)
        return this
    }
    bubble<K extends keyof RemoveIndex<V>>(event: K, ...args: V[K]) {
        this.emit(event, ...args)
        this.superEntity?.bubble(event, ...args)
        return this
    }
    on<K extends keyof RemoveIndex<V>>(event: K, listener: (...args: V[K]) => void, options: ListenerOptions = {}) {
        const off = this.emitter.on(event, listener, options)
        this.disposers.push(off)
        return this
    }
    forwardEvents<F extends Events, Ks extends (keyof RemoveIndex<V> & keyof RemoveIndex<F>)[]>(
        source: Emitter<F>, events: Ks,
    ) {
        this.emitter.forward(source, events)
        return this
    }

    updateTimer<K extends keyof S>(
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
        this.state.position = positionAdd(this.state.position, delta)
        this.attachedEntities.forEach(entity => entity.updatePosition(delta))
        return this
    }
    updatePositionTo({ x, y }: Position) {
        return this.updatePosition({
            x: x - this.state.position.x,
            y: y - this.state.position.y,
        })
    }
}

export interface EntityCtor<E extends Entity = Entity> {
    new (config: E['config'], state: E['state']): E
}

