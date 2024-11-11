import { EntityState, Entity, EntityEvents } from '@/engine'
import { ImageEntity } from './image'
import { matrix } from '@/utils'

export interface LawnConfig {
    height: number
    width: number
}

export interface LawnUniqueState {}
export interface LawnState extends LawnUniqueState, EntityState {}

export interface LawnEvents extends EntityEvents {}

export class LawnEntity extends Entity<LawnConfig, LawnState, LawnEvents> {
    lawnImages: ImageEntity[][] = null as any

    constructor(config: LawnConfig, state: LawnState) {
        super(config, state)

        const { position: { x, y }, zIndex } = this.state
        this.lawnImages = matrix(this.config.width, this.config.height, (i, j) => new ImageEntity(
            {
                src: `./assets/lawn/${ (i + j) % 2 ? 'light' : 'dark' }.png`,
            },
            {
                position: { x: x + i * 80, y: y + j * 80 },
                zIndex: zIndex + 1
            }
        ).enableAutoRender())
        this.delegate(this.lawnImages.flat())
    }
}