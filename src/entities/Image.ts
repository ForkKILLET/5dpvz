import { BoundaryComp } from '@/comps/Boundary'
import { EntityEvents, EntityState, Entity, Game } from '@/engine'
import { placeholder } from '@/utils'

export interface ImageConfig {
    src: string
    center?: boolean
}

export interface ImageState extends EntityState {}

export interface ImageEvents extends EntityEvents {}

export class ImageEntity<
    C extends ImageConfig = ImageConfig,
    S extends ImageState = ImageState,
    E extends ImageEvents = ImageEvents
> extends Entity<C, S, E> {
    img: HTMLImageElement = placeholder

    private _scale = 1
    get scale() {
        return this._scale
    }
    set scale(value) {
        if (! this.config.center)
            throw new Error('Cannot set scale when centerMode is false.')
        this._scale = value
        this.updateBoundary()
    }

    private updateBoundary() {
        if (! this.config.center) return
        this.withComp(BoundaryComp, boundaryComp => {
            const { x, y } = this.state.position
            const width = boundaryComp.width = this.img.width * this.scale
            const height = boundaryComp.height = this.img.height * this.scale
            boundaryComp.x = x - width / 2
            boundaryComp.y = y - height / 2
        })
    }

    async start(game: Game) {
        await super.start(game)
        this.img = await game.imageManager.loadImage(this.config.src)
        this.addComp(BoundaryComp, this.img.width, this.img.height)
        this.updateBoundary()
        this.on('position-update', () => this.updateBoundary())
    }

    render() {
        let { x, y } = this.state.position
        if (this.config.center) {
            x -= this.img.width / 2
            y -= this.img.height / 2
        }
        this.game.ctx.drawImage(this.img, x, y)
    }
}
