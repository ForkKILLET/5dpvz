import { Comp, CompCtor, Entity } from '@/engine'
import { HoverableComp } from '@/comps/Hoverable'

export interface CursorConfig {
    cursor: string
}

export interface CursorState {}

export class CursorComp extends Comp<CursorConfig, CursorState> {
    static dependencies = [ HoverableComp ]

    static create<M extends Comp>(this: CompCtor<M>, entity: Entity, cursor: string) {
        return new this(entity, { cursor }, {})
    }
}
