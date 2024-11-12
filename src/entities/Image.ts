import { EntityEvents, EntityState, Entity, Game } from '@/engine'

export interface ImageConfig {
    src: string
}

export interface ImageState extends EntityState {}

export interface ImageEvents extends EntityEvents {}

export class ImageEntity<
    C extends ImageConfig = ImageConfig,
    S extends ImageState = ImageState,
    E extends ImageEvents = ImageEvents
> extends Entity<C, S, E> {
    img: HTMLImageElement | null = null

    async start(game: Game) {
        await super.start(game)
        this.img = await game.imageManager.loadImage(this.config.src)
        return this
    }

    render() {
        const { x, y } = this.state.position
        this.game.ctx.drawImage(this.img!, x, y)
    }
}