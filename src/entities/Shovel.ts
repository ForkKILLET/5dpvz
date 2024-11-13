import {ShovelId} from "@/data/shovel.ts";
import {AnimationConfig, AnimationEntity, AnimationEvents, AnimationState} from "@/entities/Animation.ts";

export interface ShovelUniqueConfig {
    shovelId: ShovelId
}

export interface ShovelConfig extends ShovelUniqueConfig, AnimationConfig {}

export interface ShovelState extends AnimationState {}

export interface ShovelEvents extends AnimationEvents {}

export class ShovelEntity extends AnimationEntity<ShovelConfig, ShovelState, ShovelEvents> {
    constructor(config: ShovelConfig, state: ShovelState) {
        super({
            ...config,
        }, state);
    }
}
