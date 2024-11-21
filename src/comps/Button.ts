import { Comp, Entity, EntityEvents, EntityState } from '@/engine'
import { HoverableComp, HoverableEvents } from '@/comps/Hoverable'

export interface ButtonEvents extends HoverableEvents, EntityEvents {}

export class ButtonComp<E extends Entity<any, EntityState, ButtonEvents>> extends Comp<E> {
    static dependencies = [ HoverableComp ]

    constructor(entity: E) {
        super(entity)

        entity.withComp(HoverableComp, ({ emitter }) => {
            entity.forwardEvents(emitter, [ 'click', 'rightclick', 'mouseenter', 'mouseleave' ])
        })
    }
}
