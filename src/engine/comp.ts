import { Emitter, Entity, EntityCloneMap, Events, State } from '@/engine'

export interface CompEvents extends Events {
    attach: [ Entity ]
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

    static create<M extends Comp>(this: CompCtor<M>, entity: M['entity'], config: M['config'], state: M['state']): M {
        return new this(entity, config, state)
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

export interface CompCtor<M extends Comp = Comp> {
    dependencies: CompSelector[]
    new (entity: M['entity'], config: M['config'], state: M['state']): M
}

export type CompSelector<M extends Comp = any> =
    | CompCtor<M>
    | [ Comp: CompCtor<M>, filter: (comp: M) => boolean ]
