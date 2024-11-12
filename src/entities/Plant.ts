import { getPlantAnimationConfig, PlantId } from '@/data/plants'
import { AnimationConfig, AnimationEntity, AnimationEvents, AnimationState } from '@/entities/Animation'

export interface PlantUniqueConfig {
    plantId: PlantId
}
export interface PlantConfig extends PlantUniqueConfig, AnimationConfig {}

export interface PlantState extends AnimationState {
}

export interface PlantEvents extends AnimationEvents {}

export class PlantEntity extends AnimationEntity<PlantConfig, PlantState, PlantEvents> {
    constructor(config: PlantUniqueConfig, state: PlantState) {
        super({
            ...config,
            ...getPlantAnimationConfig(config.plantId),
        }, state)
    }
}