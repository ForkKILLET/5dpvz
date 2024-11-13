import { Comp, Entity } from '@/engine'
import { HoverableComp } from '@/comps/Hoverable'

export class CursorComp extends Comp {
    static dependencies = [ HoverableComp ]

    constructor(entity: Entity, public cursor: string) {
        super(entity)
    }
}
