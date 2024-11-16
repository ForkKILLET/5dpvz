import { Comp, Entity, isInRect, Position } from '@/engine'

export class BoundaryComp extends Comp {
    constructor(entity: Entity, public width: number, public height: number) {
        super(entity)
    }

    contains(point: Position) {
        const { width, height } = this
        return isInRect(point, {
            ...this.entity.state.position,
            width, height,
        })
    }
}
