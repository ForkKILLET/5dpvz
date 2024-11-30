import { EntityState, Entity, EntityEvents, EntityConfig } from '@/engine'
import { matrix, placeholder, StrictOmit } from '@/utils'
import { LawnBlockEntity } from '@/entities/LawnBlock'
import { RectShape, Size } from '@/comps/Shape'
import { kDebugFold } from '@/debug'

export interface LawnConfig extends Size, EntityConfig {}

export interface LawnState extends EntityState {}

export interface LawnEvents extends EntityEvents {}

export class LawnEntity extends Entity<LawnConfig, LawnState, LawnEvents> {
    [kDebugFold] = true

    lawnBlocks: LawnBlockEntity[][] = placeholder

    constructor(config: LawnConfig, state: LawnState) {
        super(config, state)

        this.state.size = {
            width: this.config.width * 80,
            height: this.config.height * 80,
        }
    }

    static createLawn(config: LawnConfig, state: StrictOmit<LawnState, 'size'>) {
        return new this(config, { ...state, size: placeholder })
    }

    build() {
        const { pos: { x, y }, zIndex } = this.state
        this.lawnBlocks = matrix(
            this.config.width, this.config.height,
            (i, j) => this.useBuilder(`LawnBlock_${ i }_${ j }`, () => LawnBlockEntity.createLawnBlock(
                {
                    i, j,
                    variant: (i + j) % 2 === 0 ? 'light' : 'dark',
                },
                {
                    pos: { x: x + i * 80, y: y + j * 80 },
                    zIndex: zIndex + 1,
                }
            ))
        )
        this.addComp(RectShape, {
            width: this.config.width * 80,
            height: this.config.height * 80,
        })
    }
}
