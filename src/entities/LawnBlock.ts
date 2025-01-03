import { HoverableComp } from '@/comps/Hoverable'
import { EntityState } from '@/engine'
import { TextureConfig, TextureEntity, TextureEvents, TextureState } from '@/entities/Texture'

export interface LawnBlockUniqueConfig {
    variant: 'light' | 'dark'
    i: number
    j: number
}

export interface LawnBlockConfig extends TextureConfig, LawnBlockUniqueConfig {}

export interface LawnBlockState extends TextureState {}

export interface LawnBlockEvents extends TextureEvents {}

export class LawnBlockEntity extends TextureEntity<LawnBlockConfig, LawnBlockState, LawnBlockEvents> {
    static createLawnBlock(config: LawnBlockUniqueConfig, state: EntityState) {
        return LawnBlockEntity
            .createTextureFromImage(
                `./assets/lawn/${ config.variant }.png`,
                config,
                state
            )
            .addComp(HoverableComp)
    }
}
