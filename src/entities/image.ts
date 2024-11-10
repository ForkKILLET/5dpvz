import { CommonEvents, CommonState, Entity, Game } from '@/engine'

export interface ImageState extends CommonState {}

export interface ImageConfig {
    src: string
}

export class ImageEntity<
    C extends ImageConfig = ImageConfig,
    S extends ImageState = ImageState,
    E extends CommonEvents = CommonEvents
> extends Entity<C, S, E> {
    img: HTMLImageElement | null = null

    async start(game: Game) {
        super.start(game)
        this.img = await game.imageManager.loadImage(this.config.src)
    }

    render() {
        const { x, y } = this.state.position
        this.game.ctx.drawImage(this.img!, x, y)
    }

    update() {
        return this.state
    }
}