import { Entity, State } from '@/engine'

export class Comp<C = any, S = any, E extends Entity = Entity> extends State<S> {
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

    constructor(public readonly entity: E, public config: C, state: S) {
        super(state)
    }

    static create<M extends Comp>(this: CompCtor<M>, entity: M['entity'], config: M['config'], state: M['state']): M {
        return new this(entity, config, state)
    }

    update() {}

    cloneComp(targetEntity: E): Comp<C, S, E> {
        const Ctor = this.constructor as CompCtor<Comp<C, S, E>>
        return new Ctor(targetEntity, this.config, this.cloneState())
    }
}

export interface CompCtor<M extends Comp = Comp> {
    new (entity: M['entity'], config: M['config'], state: M['state']): M
}

export type CompSelector<M extends Comp = any> =
    | CompCtor<M>
    | [ Comp: CompCtor<M>, filter: (comp: M) => boolean ]
