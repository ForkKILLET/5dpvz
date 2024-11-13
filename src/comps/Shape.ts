import { Position, Comp, Entity } from '@/engine'

export class ShapeComp extends Comp {
    constructor(entity: Entity, public contains: (point: Position) => boolean) {
        super(entity)
    }
}
