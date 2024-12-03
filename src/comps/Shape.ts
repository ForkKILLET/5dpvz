import { Vector2D, Comp, Entity, CompSelector, CompCtor, CompEvents, CompCtorA } from '@/engine'
import { clamp, mapk, PartialBy, Pred } from '@/utils'

export type ShapeTag = 'boundary' | 'texture' | 'hitbox'

export interface ShapeConfig {
    tag: ShapeTag
}

export interface ShapeState {}

export interface ShapeEvents extends CompEvents {}

export abstract class ShapeComp<
    C extends ShapeConfig = ShapeConfig,
    S extends ShapeState = ShapeState,
    V extends ShapeEvents = ShapeEvents,
    E extends Entity = Entity
> extends Comp<C, S, V, E> {
    constructor(entity: E, config: C, state: S) {
        super(entity, config, state)
    }

    static create<M extends Comp>(
        this: CompCtor<M>, entity: M['entity'], config: PartialBy<ShapeConfig, 'tag'>
    ) {
        return new this(entity, { tag: 'boundary', ...config }, {})
    }

    get tag() {
        return this.config.tag
    }
    setTag(tag: ShapeTag) {
        this.config.tag = tag
        return this
    }

    static withTag<M extends ShapeComp>(this: CompCtorA<M>, tagPred: Pred<ShapeTag>): CompSelector<M> {
        return [ this, mapk('tag', tagPred) ]
    }

    get pos() {
        return this.entity.state.pos
    }

    get scale() {
        return this.entity.state.scale ?? 1
    }

    abstract contains(point: Vector2D): boolean
    abstract intersects(other: ShapeComp): boolean
    abstract stroke(ctx: OffscreenCanvasRenderingContext2D): void
    abstract fill(ctx: OffscreenCanvasRenderingContext2D): void
}

export interface AnyShapeConfig<E extends Entity> extends ShapeConfig {
    contains: (this: E, point: Vector2D) => boolean
    intersects: (this: E, other: ShapeComp) => boolean
    stroke: (this: E, ctx: OffscreenCanvasRenderingContext2D) => void
    fill: (this: E, ctx: OffscreenCanvasRenderingContext2D) => void
}

export interface AnyShapeState extends ShapeState {}

export class AnyShape<E extends Entity = Entity> extends ShapeComp<AnyShapeConfig<E>, AnyShapeState, CompEvents, E> {
    static create<E extends Entity, M extends Comp<any, any, CompEvents, E>>(
        this: CompCtor<M>,
        entity: E,
        config: PartialBy<AnyShapeConfig<E>, 'tag' | 'intersects' | 'fill' | 'stroke'>,
    ) {
        return super.create<M>(
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
    stroke(ctx: OffscreenCanvasRenderingContext2D) {
        this.config.stroke.call(this.entity, ctx)
    }
    fill(ctx: OffscreenCanvasRenderingContext2D) {
        this.config.fill.call(this.entity, ctx)
    }
}

export class PointShape extends ShapeComp {
    contains(point: Vector2D) {
        // TOOD: ε?
        return this.pos.x === point.x && this.pos.y === point.y
    }

    intersects(other: ShapeComp) {
        return other.contains(this.pos)
    }

    stroke(ctx: OffscreenCanvasRenderingContext2D) {
        ctx.fillRect(this.pos.x, this.pos.y, 1, 1)
    }

    fill(ctx: OffscreenCanvasRenderingContext2D) {
        ctx.stroke()
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
        let { x, y } = this.pos
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

    stroke(ctx: OffscreenCanvasRenderingContext2D) {
        const { x, y, width, height } = this.rect
        ctx.strokeRect(x, y, width, height)
    }

    fill(ctx: OffscreenCanvasRenderingContext2D) {
        const { x, y, width, height } = this.rect
        ctx.fillRect(x, y, width, height)
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
        const { x, y } = this.pos
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

    path(ctx: OffscreenCanvasRenderingContext2D) {
        const { x, y, radius } = this.circle
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
    }

    stroke(ctx: OffscreenCanvasRenderingContext2D) {
        this.path(ctx)
        ctx.stroke()
    }

    fill(ctx: OffscreenCanvasRenderingContext2D) {
        this.path(ctx)
        ctx.fill()
    }
}
