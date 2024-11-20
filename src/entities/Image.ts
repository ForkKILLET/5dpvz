import { OriginConfig, RectShape } from '@/comps/Shape'
import { EntityEvents, EntityState, Entity } from '@/engine'
import { MakeOptional, placeholder } from '@/utils'

export interface ImageConfig extends OriginConfig {
    src: string
}

export interface ImageState extends EntityState {}

export interface ImageEvents extends EntityEvents {}

export class ImageEntity<
    C extends ImageConfig = ImageConfig,
    S extends ImageState = ImageState,
    E extends ImageEvents = ImageEvents
> extends Entity<C, S, E> {
    img: HTMLImageElement = placeholder

    static create(config: MakeOptional<ImageConfig, 'origin'>, state: EntityState) {
        return new ImageEntity(
            { origin: 'top-left', ...config },
            state
        )
    }

    async start() {
        await super.start()
        this.img = await this.game.imageManager.loadImage(this.config.src)
        const { width, height } = this.img
        this.addComp(RectShape, { width, height, origin: this.config.origin })
    }

    render() {
        const { x, y, width, height } = this.getComp(RectShape)!.rect
        this.game.ctx.drawImage(this.img, x, y, width, height)
    }
}
