import { EntityState, Entity, EntityEvents } from '@/engine'
import { matrix } from '@/utils'
import { LawnBlockEntity } from '@/entities/LawnBlock'

export interface LawnConfig {
    height: number
    width: number
}

export interface LawnUniqueState {}
export interface LawnState extends LawnUniqueState, EntityState {}

export interface LawnEvents extends EntityEvents {}

export class LawnEntity extends Entity<LawnConfig, LawnState, LawnEvents> {
    lawnBlocks: LawnBlockEntity[][]

    constructor(config: LawnConfig, state: LawnState) {
        super(config, state)

        const { position: { x, y }, zIndex } = this.state
        this.lawnBlocks = matrix(
            this.config.width, this.config.height,
            (i, j) => LawnBlockEntity.create(
                {
                    i, j,
                    type: (i + j) % 2 === 0 ? 'light' : 'dark',
                },
                {
                    position: { x: x + i * 80, y: y + j * 80 },
                    zIndex: zIndex + 1,
                },
            )
        )
        this.attach(...this.lawnBlocks.flat())
    }
}
