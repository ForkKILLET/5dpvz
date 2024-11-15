import { Game, getImagePixels, EntityEvents, Entity, EntityState, Position, isInRect } from '@/engine'
import { ImageEntity } from '@/entities/Image'
import { HoverableComp, HoverableEvents } from '@/comps/Hoverable'
import { ShapeComp } from '@/comps/Shape'
import { AnimationEntity } from './Animation'
import { placeholder } from '@/utils'

export interface ContainingModeConfig {
    containingMode: 'rect' | 'strict'
}
export interface ButtonConfig extends ContainingModeConfig {
    entity: ImageEntity | AnimationEntity
}

export interface ButtonUniqueState {
    hovering: boolean
}
export interface ButtonState extends ButtonUniqueState, EntityState {}

export interface ButtonEvents extends HoverableEvents, EntityEvents {}

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
                .addComp(ShapeComp, this.contains)
                .addComp(HoverableComp)
                .withComp(HoverableComp, ({ emitter }) => {
                    this.forwardEvents(emitter, [ 'click', 'rightclick' ])
                })
            )
    }

    static from<C extends ContainingModeConfig>(
        entity: ImageEntity | AnimationEntity,
        config: C = { containingMode: 'strict' } as C
    ) {
        return new this(
            { entity, ...config },
            ButtonEntity.initState({
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
        const [ { width, height } ] = images

        const getCurrentPixels = () => isImage ? pixelsList[0] : pixelsList[entity.state.af]

        this.contains = point => {
            const { x, y } = this.state.position

            if (! isInRect(point, { x, y, width, height })) return false
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
        return this.state
    }
}
