import { Comp, Entity, isInRect, Position, Rect } from '@/engine'
import { placeholder } from '@/utils'

export class BoundaryComp<E extends Entity = Entity> extends Comp<E> {
    constructor(
        entity: E,
        public boundaryGetter: (entity: E) => { width: number, height: number, x?: number, y?: number }
    ) {
        super(entity)
        this.rect = this.getRect()
    }

    rect: Rect = placeholder
    frozenUpdate() {
        this.rect = this.getRect()
    }
    getRect() {
        const { position } = this.entity.state
        const { x = position.x, y = position.y, width, height } = this.boundaryGetter(this.entity)
        return { x, y, width, height }
    }

    contains(point: Position) {
        return isInRect(point, this.rect)
    }

    static derive(entity: Entity) {
        return entity.getComp(BoundaryComp)!.boundaryGetter(entity)
    }
}
