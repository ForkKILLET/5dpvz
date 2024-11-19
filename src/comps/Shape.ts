import { Position, Comp, Entity } from '@/engine'
import { clamp } from '@/utils'

export abstract class ShapeComp<E extends Entity = Entity> extends Comp<E> {
    public ctx: CanvasRenderingContext2D

    constructor(entity: E) {
        super(entity)
        this.ctx = entity.game.ctx
    }

    get position() {
        return this.entity.state.position
    }

    get scale() {
        return this.entity.state.scale ?? 1
    }

    abstract contains(point: Position): boolean
    abstract intersects(other: ShapeComp): boolean
    abstract stroke(): void
    abstract fill(): void
}

export interface AnyShapeConfig<E extends Entity> {
    contains: (this: E, point: Position) => boolean
    intersects: (this: E, other: ShapeComp) => boolean
    stroke: (this: E, ctx: CanvasRenderingContext2D) => void
    fill: (this: E, ctx: CanvasRenderingContext2D) => void
}

export class AnyShape<E extends Entity = Entity> extends ShapeComp<E> {
    config: AnyShapeConfig<E>

    constructor(entity: E, preConfig: Partial<AnyShapeConfig<E>>) {
        super(entity)
        preConfig.contains ??= () => false
        preConfig.intersects ??= () => false
        this.config = preConfig as AnyShapeConfig<E>
    }

    contains(point: Position) {
        return this.config.contains.call(this.entity, point)
    }
    intersects(other: ShapeComp) {
        return this.config.intersects.call(this.entity, other)
    }
    stroke() {
        this.config.stroke.call(this.entity, this.ctx)
    }
    fill() {
        this.config.fill.call(this.entity, this.ctx)
    }
}

export class PointShape extends ShapeComp {
    contains(point: Position) {
        // TOOD: ε?
        return this.position.x === point.x && this.position.y === point.y
    }

    intersects(other: ShapeComp) {
        return other.contains(this.position)
    }

    stroke() {
        this.ctx.fillRect(this.position.x, this.position.y, 1, 1)
    }

    fill() {
        this.stroke()
    }
}

export interface OriginConfig {
    origin: 'center' | 'top-left'
}

export interface Rect extends Position {
    width: number
    height: number
}

export interface RectP {
    x1: number
    y1: number
    x2: number
    y2: number
}

export interface RectShapeConfig extends OriginConfig {
    width: number
    height: number
}

export class RectShape extends ShapeComp {
    constructor(entity: Entity, public config: RectShapeConfig) {
        super(entity)
    }

    get rect(): Rect {
        let { x, y } = this.position
        let { origin, width, height } = this.config
        width *= this.scale
        height *= this.scale
        if (origin === 'center') {
            x -= width / 2
            y -= height / 2
        }
        return { x, y, width, height }
    }

    static contains = (rect: Rect) => (point: Position) => (
        point.x >= rect.x && point.x < rect.x + rect.width &&
        point.y >= rect.y && point.y < rect.y + rect.height
    )

    static toRectP = (rect: Rect): RectP => ({
        x1: rect.x,
        y1: rect.y,
        x2: rect.x + rect.width,
        y2: rect.y + rect.height,
    })

    contains(point: Position) {
        return RectShape.contains(this.rect)(point)
    }

    intersects(other: ShapeComp) {
        if (other instanceof RectShape) {
            const r1 = RectShape.toRectP(this.rect)
            const r2 = RectShape.toRectP(other.rect)
            return (
                r1.x1 < r2.x2 && r1.x2 > r2.x1 &&
                r1.y1 < r2.y2 && r1.y2 > r2.y1
            )
        }
        else if (other instanceof CircleShape) {
            return other.intersects(this)
        }
        return false
    }

    stroke() {
        const { x, y, width, height } = this.rect
        this.ctx.strokeRect(x, y, width, height)
    }

    fill() {
        const { x, y, width, height } = this.rect
        this.ctx.fillRect(x, y, width, height)
    }
}

export class FullscreenShape extends RectShape {
    constructor(entity: Entity) {
        const { width, height } = entity.game.ctx.canvas
        super(entity, { width, height, origin: 'top-left' })
    }
}

export interface Circle extends Position {
    radius: number
}

export interface CircleConfig {
    radius: number
}

export class CircleShape extends ShapeComp {
    constructor(entity: Entity, public config: CircleConfig) {
        super(entity)
    }

    get circle(): Circle {
        const { x, y } = this.position
        const { radius } = this.config
        return { x, y, radius: radius * this.scale }
    }

    static contains = (circle: Circle) => (point: Position) => {
        const dx = point.x - circle.x
        const dy = point.y - circle.y
        return dx ** 2 + dy ** 2 <= circle.radius ** 2
    }

    contains(point: Position) {
        return CircleShape.contains(this.circle)(point)
    }

    intersects(other: ShapeComp) {
        if (other instanceof CircleShape) {
            const c1 = this.circle
            const c2 = other.circle
            const dx = c2.x - c1.x
            const dy = c2.y - c1.y
            return dx ** 2 + dy ** 2 <= (c1.radius + c2.radius) ** 2
        }
        else if (other instanceof RectShape) {
            const r = RectShape.toRectP(other.rect)
            const c = this.circle
            const nx = clamp(c.x, r.x1, r.x2)
            const ny = clamp(c.y, r.y1, r.y2)
            const dx = c.x - nx
            const dy = c.y - ny
            return dx ** 2 + dy ** 2 <= c.radius ** 2
        }
        return false
    }

    path() {
        const { x, y, radius } = this.circle
        this.ctx.beginPath()
        this.ctx.arc(x, y, radius, 0, Math.PI * 2)
    }

    stroke() {
        this.path()
        this.ctx.stroke()
    }

    fill() {
        this.path()
        this.ctx.fill()
    }
}
