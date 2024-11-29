import { Vector2D, Comp, Entity, CompSelector, CompCtor, CompEvents } from '@/engine'
import { clamp, mapk, PartialBy, Pred } from '@/utils'

export type ShapeTag = 'boundary' | 'texture' | 'hitbox'

export interface ShapeConfig {
    tag: ShapeTag
}

export interface ShapeState {}

export interface ShapeEvents extends CompEvents {}

export class ShapeComp<
    C extends ShapeConfig = ShapeConfig,
    S extends ShapeState = ShapeState,
    V extends ShapeEvents = ShapeEvents,
    E extends Entity = Entity
> extends Comp<C, S, V, E> {
    constructor(entity: E, config: C, state: S) {
        super(entity, config, state)
        this.ctx = this.game.ctx
    }

    static create<M extends Comp>(
        this: CompCtor<M>, entity: M['entity'], config: PartialBy<ShapeConfig, 'tag'>
    ) {
        return new this(entity, { tag: 'boundary', ...config }, {})
    }

    ctx: CanvasRenderingContext2D

    get tag() {
        return this.config.tag
    }
    setTag(tag: ShapeTag) {
        this.config.tag = tag
        return this
    }

    static withTag<C extends ShapeComp>(this: CompCtor<C>, tagPred: Pred<ShapeTag>): CompSelector<C> {
        return [ this, mapk('tag', tagPred) ]
    }

    get position() {
        return this.entity.state.position
    }

    get scale() {
        return this.entity.state.scale ?? 1
    }

    contains(point: Vector2D) {
        void point
        return false
    }
    intersects(other: ShapeComp) {
        void other
        return false
    }
    stroke() {}
    fill() {}
}

export interface AnyShapeConfig<E extends Entity> extends ShapeConfig {
    contains: (this: E, point: Vector2D) => boolean
    intersects: (this: E, other: ShapeComp) => boolean
    stroke: (this: E, ctx: CanvasRenderingContext2D) => void
    fill: (this: E, ctx: CanvasRenderingContext2D) => void
}

export interface AnyShapeState extends ShapeState {}

export class AnyShape<E extends Entity = Entity> extends ShapeComp<AnyShapeConfig<E>, AnyShapeState, CompEvents, E> {
    static create<E extends Entity, C extends Comp<any, any, CompEvents, E>>(
        this: CompCtor<C>,
        entity: E,
        config: PartialBy<AnyShapeConfig<E>, 'tag' | 'intersects' | 'fill' | 'stroke'>,
    ) {
        return super.create<C>(
            entity,
            {
                intersects: () => false,
                stroke: () => {},
                fill: () => {},
                ...config,
            }
        )
    }

    contains(point: Vector2D) {
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
    contains(point: Vector2D) {
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

export interface Size {
    width: number
    height: number
}

export interface Rect extends Vector2D, Size {}

export interface RectP {
    x1: number
    y1: number
    x2: number
    y2: number
}

export interface RectShapeConfig extends Size, OriginConfig, ShapeConfig {}

export class RectShape extends ShapeComp<RectShapeConfig> {
    static create<M extends Comp>(
        this: CompCtor<M>,
        entity: Entity,
        config: PartialBy<RectShapeConfig, 'tag' | 'origin'>
    ): M {
        // TODO: use `super.create`
        return new this(entity, { tag: 'boundary', origin: 'top-left', ...config }, {})
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

    static contains = (rect: Rect) => (point: Vector2D) => (
        point.x >= rect.x && point.x < rect.x + rect.width &&
        point.y >= rect.y && point.y < rect.y + rect.height
    )

    static toRectP = (rect: Rect): RectP => ({
        x1: rect.x,
        y1: rect.y,
        x2: rect.x + rect.width,
        y2: rect.y + rect.height,
    })

    contains(point: Vector2D) {
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
    static create<M extends Comp>(this: CompCtor<M>, entity: M['entity']): M {
        const { width, height } = entity.game.ctx.canvas
        return super.create<M>(entity, { width, height })
    }
}

export interface Circle extends Vector2D {
    radius: number
}

export interface CircleConfig extends ShapeConfig {
    radius: number
}

export class CircleShape extends ShapeComp<CircleConfig> {
    static create<M extends Comp>(
        this: CompCtor<M>,
        entity: Entity,
        config: PartialBy<CircleConfig, 'tag'>
    ): M {
        return new this(entity, { tag: 'boundary', ...config }, {})
    }

    get circle(): Circle {
        const { x, y } = this.position
        const { radius } = this.config
        return { x, y, radius: radius * this.scale }
    }

    static contains = (circle: Circle) => (point: Vector2D) => {
        const dx = point.x - circle.x
        const dy = point.y - circle.y
        return dx ** 2 + dy ** 2 <= circle.radius ** 2
    }

    contains(point: Vector2D) {
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
