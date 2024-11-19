import { Game, getImagePixels, EntityEvents, Entity, EntityState, Position } from '@/engine'
import { ImageEntity } from '@/entities/Image'
import { AnimationEntity } from '@/entities/Animation'
import { HoverableComp, HoverableEvents } from '@/comps/Hoverable'
import { AnyShape, RectShape, ShapeComp } from '@/comps/Shape'
import { placeholder } from '@/utils'

export interface ButtonUniqueConfig {
    containingMode: 'rect' | 'strict'
    entity: ImageEntity | AnimationEntity
}
export interface ButtonConfig extends ButtonUniqueConfig {}

export interface ButtonUniqueState {
    hovering: boolean
}
export interface ButtonState extends ButtonUniqueState, EntityState {}

export interface ButtonEvents extends HoverableEvents, EntityEvents {}

export interface ButtonStatic<E extends ButtonEntity> {
    new (config: E['config'], state: E['state']): E
    initState: <S>(state: S) => S & ButtonUniqueState
}

export class ButtonEntity<
    C extends ButtonConfig = ButtonConfig,
    S extends ButtonState = ButtonState,
    E extends ButtonEvents = ButtonEvents
> extends Entity<C, S, E> {
    static initState = <S>(state: S): S & ButtonUniqueState => ({
        ...state,
        hovering: false,
    })

    contains: (point: Position) => boolean = placeholder

    constructor(config: C, state: S) {
        super(config, state)

        this
            .attach(config.entity)
            .afterStart(() => this
                .addComp(AnyShape, {
                    contains: point => this.contains(point),
                    intersects: other => this.config.entity.getComp(ShapeComp)!.intersects(other),
                    stroke: () => this.config.entity.getComp(ShapeComp)!.stroke(),
                    fill: () => this.config.entity.getComp(ShapeComp)!.fill(),
                })
                .addComp(HoverableComp)
                .withComp(HoverableComp, ({ emitter }) => {
                    this.forwardEvents(emitter, [ 'click', 'rightclick', 'mouseenter', 'mouseleave' ])
                })
            )
    }

    static from<E extends ButtonEntity = ButtonEntity>(
        this: ButtonStatic<E>,
        entity: ImageEntity | AnimationEntity,
        config: Omit<E['config'], 'entity'>
    ) {
        return new this(
            {
                entity,
                ...config,
            },
            this.initState({
                position: entity.state.position,
                zIndex: entity.state.zIndex,
            })
        )
    }

    async start(game: Game) {
        await super.start(game)

        const { entity } = this.config
        await entity.toStart()

        const isImage = entity instanceof ImageEntity
        const images = isImage ? [ entity.img ] : entity.frames
        const pixelsList = images.map(getImagePixels)
        const [ { width } ] = images

        const getCurrentPixels = () => isImage ? pixelsList[0] : pixelsList[entity.state.af]

        this.contains = point => {
            const shape = this.config.entity.getComp(RectShape)!
            const { x, y } = shape.rect

            if (! shape.contains(point)) return false
            if (this.config.containingMode === 'rect') return true

            const rx = point.x - x
            const ry = point.y - y
            const i = ry * width * 4 + rx * 4
            const [ r, g, b, a ] = getCurrentPixels().slice(i, i + 4)
            return ! (r === 0 && g === 0 && b === 0 && a === 0)
        }
    }

    update() {
        this.state.hovering = this.getComp(HoverableComp)!.hovering
    }
}
