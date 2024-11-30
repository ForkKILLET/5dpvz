import { RectShape, Size } from '@/comps/Shape'
import { kDebugFold } from '@/debug'
import {
    createIdGenerator, Vector2D, vAdd,
    Emitter, Events, ListenerOptions,
    State, Comp, CompCtor, CompSelector,
    RenderPipeline,
    RenderJob,
    vSub,
} from '@/engine'
import { apply, by, Disposer, eq, mapk, not, remove, RemoveIndex } from '@/utils'

export interface EntityConfig {}

export interface EntityState {
    pos: Vector2D
    size: Size
    zIndex: number
    scale?: number
    resourceId?: string
    cloning?: boolean
}

export interface EntityEvents extends Events {
    'start': []
    'clone-finish': []
    'before-render': []
    'after-render': []
    'attach': [ superEntity: Entity ]
    'unattach': []
    'dispose': []
    'pos-update': [ delta: Vector2D ]
}

export type InjectKey<T> = symbol & { _injectType: T }
export const injectKey = <T>(description: string) => Symbol(description) as InjectKey<T>

export type EntityCloneMap = Map<number, Entity>

export class Entity<
    C extends EntityConfig = EntityConfig,
    S extends EntityState = EntityState,
    V extends EntityEvents = EntityEvents
> extends State<S> {
    constructor(public config: C, state: S) {
        super(state)

        if (state.cloning) this.on('clone-finish', () => this.build())
        else this.afterStart(() => this.build())

        this.afterStart(() => {
            const { width, height } = this.state.size
            this.pipeline.inputNode.width = width
            this.pipeline.inputNode.height = height
        })
    }

    [kDebugFold] = false

    static generateEntityId = createIdGenerator()
    readonly id = Entity.generateEntityId()

    active = true
    get deepActive(): boolean {
        return this.active && (this.superEntity?.deepActive ?? true)
    }
    activate() {
        this.active = true
        this.emitter.activate()
        this.game.emitter.emit('entityActivate', this)
        return this
    }
    deactivate() {
        this.active = false
        this.afterStart(() => {
            this.emitter.deactivate()
            this.game.emitter.emit('entityDeactivate', this)
        })
        return this
    }

    buildName: string | null = null
    build() {}
    useBuilder<E extends Entity>(buildName: string, builder: () => E): E {
        const buildClone = this.attachedEntities.find(mapk('buildName', eq(buildName))) as E | undefined
        if (buildClone) return buildClone
        const build = builder().attachTo(this)
        build.buildName = buildName
        return build
    }

    startedToRunStart = false
    startedToBeforeStart = false
    started = false
    starters: (() => void)[] = []
    async start(): Promise<void> {
        this.game.allEntities.push(this)
    }
    runStart() {
        this.startedToRunStart = true
        apply(async () => {
            await this.start()
            this.startedToBeforeStart = true
            await Promise.all(this.starters.map(fn => fn()))
            this.started = true
            this.emit('start')
            this.game.emitter.emit('entityStart', this)
        })
        return this
    }
    beforeStart(fn: () => void) {
        if (this.startedToBeforeStart) fn()
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
    configAutoRender(autoRender: boolean) {
        this.autoRender = autoRender
        return this
    }

    superEntity: Entity | null = null
    attachedEntities: Entity[] = []
    attach(...entities: Entity[]) {
        if (this.state.cloning) return this
        entities.forEach(entity => this.beforeStart(async () => {
            await entity.runStart().toStart()
            entity.superEntity = this
            this.attachedEntities.push(entity)
            entity
                .emit('attach', this)
                .on('dispose', () => this.unattach(entity))
            this.game.emitter.emit('entityAttach', entity)
        }))
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
    addRawComp(comp: Comp) {
        if (this.state.cloning) return this
        const _addComp = () => {
            const { dependencies } = comp.constructor as CompCtor
            if (! this.hasComp(...dependencies))
                this.error(`Component missing dependencies: ${
                    dependencies.map(dep => Comp.getCtorFromSelector(dep).name).join(', ')
                }.`)
            this.comps.push(comp)
            comp.emitter.emit('attach', this)
        }
        if (this.started) _addComp()
        else this.afterStart(_addComp, this.startedToRunStart)
        return this
    }
    addLazyComp(compBuilder: (entity: this) => Comp) {
        return this.addRawComp(compBuilder(this))
    }
    addLoseComp<M extends Comp, A extends any[]>( // FIXME: infer E
        Comp: CompCtor<any> & { create: (entity: M['entity'], ...args: A) => M },
        ...args: A
    ) {
        return this.addRawComp(Comp.create(this, ...args))
    }
    addComp<M extends Comp, A extends any[]>(
        Comp: CompCtor<any> & { create: (entity: M['entity'], ...args: A) => M },
        ...args: A
    ) {
        if (this.hasComp(Comp)) return this
        return this.addLoseComp(Comp, ...args)
    }
    removeComp<M extends Comp>(sel: CompSelector<M>) {
        return this.afterStart(() => {
            this.comps = this.comps.filter(not(Comp.runSelector(sel)))
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

    pipeline = new RenderPipeline()
    get ctx() {
        return this.pipeline.inputNode.ctx
    }
    get sizeTuple() {
        return [ this.state.size.width, this.state.size.height ] as const
    }
    get superCtx(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
        return (this.superEntity ?? this.game).ctx
    }
    get superRenderJobs(): RenderJob[] {
        return (this.superEntity ?? this.game).renderJobs
    }
    get superPos(): Vector2D {
        return this.superEntity?.pos ?? { x: 0, y: 0 }
    }

    renderJobs: RenderJob[] = []

    get pos(): Vector2D {
        return this.getComp(RectShape.withTag(eq('boundary')))?.rect ?? this.state.pos
    }

    runRender() {
        this.preRender()

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
        this.renderJobs
            .sort(by(job => job.zIndex))
            .forEach(job => job.renderer())
        this.renderJobs = []

        this.addRenderJob(() => {
            this.render()
            const { canvas, offset } = this.pipeline.getOutput()
            const pos = vAdd(vSub(this.pos, this.superPos), offset)

            this.superCtx.drawImage(canvas, pos.x, pos.y)
        })
    }
    addRenderJob(renderer: () => void, zIndexDelta = 0) {
        this.superRenderJobs.push({
            zIndex: this.state.zIndex + zIndexDelta,
            renderer: () => {
                this.ctx.save()
                this.bubble('before-render')
                renderer()
                this.bubble('after-render')
                this.ctx.restore()
            },
        })
    }
    preRender() {
        this.attachedEntities
            .filter(entity => entity.active && entity.autoRender)
            .forEach(entity => entity.runRender())
    }
    render() {}

    runUpdate() {
        if (! this.active || this.disposed) return
        this.update()
        this.postUpdate()
    }
    postUpdate() {
        this.attachedEntities.forEach(entity => entity.runUpdate())
        this.comps.forEach(comp => comp.update())
    }
    update() {}

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

    updatePos(delta: Vector2D) {
        this.emit('pos-update', delta)
        this.state.pos = vAdd(this.state.pos, delta)
        this.attachedEntities.forEach(entity => entity.updatePos(delta))
        return this
    }
    updatePosTo({ x, y }: Vector2D) {
        return this.updatePos({
            x: x - this.state.pos.x,
            y: y - this.state.pos.y,
        })
    }

    cloneEntity(entityMap: EntityCloneMap = new Map): this {
        const Ctor = this.constructor as EntityCtor<this>
        const newAttachedEntities = this.attachedEntities.map(entity => entity.cloneEntity(entityMap))
        const newEntity = new Ctor({ ...this.config }, { ...this.cloneState(entityMap), cloning: true })
        entityMap.set(this.id, newEntity)
        newEntity.beforeStart(() => {
            newEntity.state.cloning = false
            newEntity.buildName = this.buildName
            Promise.all(newAttachedEntities.map(entity => new Promise(res => entity
                .attachTo(newEntity)
                .on('attach', res)
            ))).then(() => newEntity.emit('clone-finish'))
            this.comps.forEach(comp => newEntity.addRawComp(comp.cloneComp(entityMap, newEntity)))
        })
        return newEntity
    }
}

export interface EntityCtor<E extends Entity = Entity> {
    new (config: E['config'], state: E['state']): E
}

