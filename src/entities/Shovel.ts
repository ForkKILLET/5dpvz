import { shovelAnimation, ShovelId } from '@/data/shovel'
import { AnimationConfig, AnimationEntity, AnimationEvents, AnimationState } from '@/entities/Animation'

export interface ShovelUniqueConfig {
    shovelId: ShovelId
}
export interface ShovelConfig extends ShovelUniqueConfig, AnimationConfig {}

export interface ShovelState extends AnimationState {}

export interface ShovelEvents extends AnimationEvents {}

export class ShovelEntity extends AnimationEntity<ShovelConfig, ShovelState, ShovelEvents> {
    constructor(config: ShovelUniqueConfig, state: ShovelState) {
        super({
            ...config,
            ...shovelAnimation.getAnimationConfig(config.shovelId, 'shovels'),
        }, state)
    }
}
