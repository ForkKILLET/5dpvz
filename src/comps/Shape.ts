import { Position, Comp, Entity } from '@/engine'

export class ShapeComp extends Comp {
    constructor(entity: Entity, public contains: (point: Position) => boolean) {
        super(entity)
    }
} // TODO: need delete

export abstract class Shape extends Comp {
    constructor(entity: Entity) {
        super(entity)
    }

    abstract contains(point: Position): boolean
    abstract intersects(other: Shape): boolean
}

export class RectShapeComp extends Shape {
    constructor(
        entity: Entity,
        public center: Position,
        public width: number,
        public height: number
    ) {
        super(entity)
    }

    contains(point: Position): boolean {
        return (
            point.x >= this.center.x - this.width / 2 &&
            point.x <= this.center.x + this.width / 2 &&
            point.y >= this.center.y - this.height / 2 &&
            point.y <= this.center.y + this.height / 2
        )
    }

    intersects(other: Shape): boolean {
        if (other instanceof RectShapeComp) {
            return ! (
                this.center.x + this.width / 2 < other.center.x - other.width / 2 ||
                this.center.x - this.width / 2 > other.center.x + other.width / 2 ||
                this.center.y + this.height / 2 < other.center.y - other.height / 2 ||
                this.center.y - this.height / 2 > other.center.y + other.height / 2
            )
        }
        else if (other instanceof CircleShapeComp) {
            return other.intersects(this)
        }
        return false
    }
}

export class CircleShapeComp extends Shape {
    constructor(
        entity: Entity,
        public center: Position,
        public radius: number
    ) {
        super(entity)
    }

    contains(point: Position): boolean {
        const dx = point.x - this.center.x
        const dy = point.y - this.center.y
        return dx * dx + dy * dy <= this.radius * this.radius
    }

    intersects(other: Shape): boolean {
        if (other instanceof CircleShapeComp) {
            const dx = other.center.x - this.center.x
            const dy = other.center.y - this.center.y
            const distance = dx * dx + dy * dy
            const radiusSum = this.radius + other.radius
            return distance <= radiusSum * radiusSum
        }
        else if (other instanceof RectShapeComp) {
            const closestX = Math.max(
                other.center.x - other.width / 2,
                Math.min(this.center.x, other.center.x + other.width / 2)
            )
            const closestY = Math.max(
                other.center.y - other.height / 2,
                Math.min(this.center.y, other.center.y + other.height / 2)
            )
            const dx = this.center.x - closestX
            const dy = this.center.y - closestY
            return dx * dx + dy * dy <= this.radius * this.radius
        }
        else {
            return false
        }
    }
}
