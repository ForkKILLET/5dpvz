import { EntityState } from '@/engine'
import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from '@/entities/ui/Button'
import { ImageEntity } from '@/entities/Image'

export interface LawnBlockUniqueConfig {
    type: 'light' | 'dark'
    i: number
    j: number
}

export interface LawnBlockConfig extends ButtonConfig, LawnBlockUniqueConfig {}

export interface LawnBlockState extends ButtonState {}

export interface LawnBlockEvents extends ButtonEvents {}

export class LawnBlockEntity extends ButtonEntity<LawnBlockConfig, LawnBlockState, LawnBlockEvents> {
    static create(config: LawnBlockUniqueConfig, state: EntityState) {
        return LawnBlockEntity.from(
            ImageEntity.create(
                {
                    src: `./assets/lawn/${ config.type }.png`,
                },
                state,
            ),
            {
                containingMode: 'rect',
                ...config,
            }
        )
    }
}
