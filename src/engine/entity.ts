import {
    createIdGenerator, Position, positionAdd,
    Emitter, Events, ListenerOptions,
    State, Comp, CompCtor, CompSelector
} from '@/engine'
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

export class Entity<
    C = any,
    S extends EntityState = EntityState,
    V extends EntityEvents = EntityEvents
> extends State<S> {
    static generateEntityId = createIdGenerator()

    readonly id = Entity.generateEntityId()

    constructor(public config: C, state: S) {
        super(state)
    }

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
    hasComp(...sels: CompSelector[]) {
        return sels.every(sel => this.comps.some(Comp.runSelector(sel)))
    }
    addCompRaw(comp: Comp) {
        const _addComp = () => {
            const { dependencies } = comp.constructor as any as { dependencies: CompSelector[] }
            if (! this.hasComp(...dependencies))
                this.error(`Component missing dependencies: ${
                    dependencies.map(dep => Comp.getCtorFromSelector(dep).name).join(', ')
                }.`)
            this.comps.push(comp)
        }
        if (this.started) _addComp()
        else this.afterStart(_addComp, this.startedToStart)
        return this
    }
    addComp<A extends any[], M extends Comp>(
        Comp: { create: (entity: M['entity'], ...args: A) => M },
        ...args: A
    ) {
        return this.addCompRaw(Comp.create(this, ...args))
    }
    removeComp<M extends Comp>(sel: CompSelector<M>) {
        return this.afterStart(() => {
            this.comps = this.comps.filter(Comp.runSelector(sel))
        })
    }
    getComp<M extends Comp>(sel: CompSelector<M>): M | undefined {
        return this.comps.find(Comp.runSelector(sel))
    }
    withComp<M extends Comp>(Comp: CompSelector<M>, fn: (comp: M) => void) {
        return this.afterStart(() => {
            const comp = this.getComp(Comp)
            if (comp) fn(comp)
        })
    }
    withComps<const Ms extends Comp[]>(Comps: { [I in keyof Ms]: CompSelector<Ms[I]> }, fn: (...comps: Ms) => void) {
        return this.afterStart(() => {
            const comps = Comps.map(this.getComp.bind(this))
            if (comps.every(comp => comp)) fn(...comps as Ms)
        })
    }
    getComps<M extends Comp>(Comp: CompCtor<M>): M[] {
        return this.comps.filter((comp): comp is M => comp instanceof Comp)
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

