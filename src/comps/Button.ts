import { Comp, CompCtor, Entity, EntityEvents, EntityState } from '@/engine'
import { HoverableComp, HoverableEvents } from '@/comps/Hoverable'

export interface ButtonEvents extends HoverableEvents, EntityEvents {}

export interface ButtonConfig {}

export interface ButtonState {}

export type ButtonLikeEntity = Entity<any, EntityState, ButtonEvents>

export class ButtonComp<E extends ButtonLikeEntity = ButtonLikeEntity> extends Comp<ButtonConfig, ButtonState, E> {
    static dependencies = [ HoverableComp ]

    constructor(entity: E, config: ButtonConfig, state: ButtonState) {
        super(entity, config, state)
        entity.withComp(HoverableComp, ({ emitter }) => {
            entity.forwardEvents(emitter, [ 'click', 'rightclick', 'mouseenter', 'mouseleave' ])
        })
    }

    static create<C extends ButtonComp>(this: CompCtor<C>, entity: C['entity']) {
        return new this(entity, {}, {})
    }
}
