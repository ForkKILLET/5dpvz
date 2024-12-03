import { Emitter, Entity, EntityCloneMap, Events, State } from '@/engine'
import { eq } from '@/utils'

export interface CompEvents extends Events {
    attach: [ entity: Entity ]
    dispose: []
}

export class Comp<C = any, S = any, V extends CompEvents = CompEvents, E extends Entity = Entity> extends State<S> {
    static readonly dependencies: CompSelector<any>[] = []

    static selector = <M extends Comp>(
        Comp: CompCtor<M>, filter: (comp: M) => boolean
    ): CompSelector<M> => [ Comp, filter ]

    static runSelector = <M extends Comp>(Comp: CompSelector<M>) => {
        return (comp: Comp): comp is M => {
            if (typeof Comp === 'function') return comp instanceof Comp
            return comp instanceof Comp[0] && Comp[1](comp)
        }
    }

    static getCtorFromSelector = <M extends Comp>(Comp: CompSelector<M>) => {
        return typeof Comp === 'function' ? Comp : Comp[0]
    }

    dispose() {
        this.emitter.emit('dispose')
        this.entity.removeComp([ Comp, eq(this) ])
    }

    constructor(public readonly entity: E, public config: C, state: S) {
        super(state)
    }

    emitter = new Emitter<V>()

    update() {}

    cloneComp(entityMap: EntityCloneMap, targetEntity: E): this {
        const Ctor = this.constructor as CompCtor<this>
        return new Ctor(targetEntity, this.config, this.cloneState(entityMap))
    }
}

export type CompCtor<M extends Comp = Comp>
    = new (entity: M['entity'], config: M['config'], state: M['state']) => M

export type CompCtorA<M extends Comp = Comp> =
    | CompCtor<M>
    | (abstract new (entity: M['entity'], config: M['config'], state: M['state']) => M)

export type CompSelector<M extends Comp = any> =
    | CompCtorA<M>
    | [ Comp: CompCtorA<M>, filter: (comp: M) => boolean ]

export type CompStatic<M extends Comp = Comp> = CompCtor<M> & {
    dependencies: CompSelector<any>[]
}
