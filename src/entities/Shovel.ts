import { shovelTextures, ShovelId } from '@/data/shovels'
import { TextureConfig, TextureEntity, TextureEvents, TextureState } from './Texture'

export interface ShovelUniqueConfig {
    shovelId: ShovelId
}
export interface ShovelConfig extends ShovelUniqueConfig, TextureConfig {}

export interface ShovelState extends TextureState {}

export interface ShovelEvents extends TextureEvents {}

export class ShovelEntity extends TextureEntity<ShovelConfig, ShovelState, ShovelEvents> {
    static createShovel(config: ShovelUniqueConfig, state: ShovelState) {
        return ShovelEntity.createTexture(
            {
                textures: shovelTextures.getImageTextureSet(config.shovelId),
                ...config,
            },
            state
        )
    }
}
