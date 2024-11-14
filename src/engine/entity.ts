import { createIdGenerator, Game, Position, Emitter, Events } from '@/engine'
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
}

export type InjectKey<T> = symbol & { __injectType: T }
export const injectKey = <T>() => Symbol() as InjectKey<T>

export class Comp {
    static dependencies: CompCtor[] = []

    constructor(public readonly entity: Entity) {}

    update() {}
}

export type CompCtor<C extends Comp = Comp> = new (...args: any[]) => C

export class Entity<C = any, S extends EntityState = any, E extends EntityEvents = EntityEvents> {
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
    async start(game: Game): Promise<void> {
        this.game = game
        game.allEntities.push(this)
    }
    runStart(game: Game) {
        this.start(game).then(() => {
            this.started = true
            this.emit('start')
            this.game.emitter.emit('entityStart', this)
        })
        return this
    }
    afterStart(fn: (self: this) => void) {
        if (this.started) fn(this)
        else this.on('start', () => fn(this))
    }

    autoRender = true
    setAutoRender(autoRender: boolean) {
        this.autoRender = autoRender
        return this
    }

    superEntity: Entity | null = null
    attachedEntities: Entity[] = []
    attach(...entities: Entity[]) {
        return this.afterStart(() => entities.forEach(entity => entity
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
            }),
        ))
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
        const { dependencies } = Comp as any as { dependencies: CompCtor[] }
        if (! this.hasComp(...dependencies))
            throw new Error(`Missing dependencies: ${ dependencies.map(Dep => Dep.name).join(', ') }.`)

        this.comps.push(new Comp(this, ...args))
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
        const comp = this.getComp(Comp)
        if (comp) fn(comp)
        return this
    }
    getComps<C extends Comp>(Comp: CompCtor<C>): C[] {
        return this.comps.filter((comp): comp is C => comp instanceof Comp)
    }

    runRender() {
        this.preRender()

        this.addRenderJob(() => {
            this.emit('before-render')
            this.render()
            this.emit('after-render')
        })
    }
    addRenderJob(renderer: () => void, zIndexDelta = 0) {
        this.game.addRenderJob({
            zIndex: this.state.zIndex + zIndexDelta,
            renderer,
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
        this.state = this.update()
        this.attachedEntities.forEach(entity => entity.runUpdate())
        this.comps.forEach(comp => comp.update())
    }
    protected update() {
        return this.state
    }

    protected emitter = new Emitter<E>()
    emit<K extends keyof RemoveIndex<E>>(event: K, ...args: E[K]) {
        this.emitter.emit(event, ...args)
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

    useTimer<K extends keyof {
        [K in keyof S as S[K] extends number ? K : never]: void
    }>(timerName: K, timerInterval: number, onTimer: () => void) {
        let timer = this.state[timerName] as number + this.game.mspf
        if (timer > timerInterval) {
            timer -= timerInterval
            onTimer()
        }
        (this.state[timerName] as number) = timer
    }
}

export type EntityCtor<E extends Entity = Entity> = new (...args: any[]) => E
