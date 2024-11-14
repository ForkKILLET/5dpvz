import { plantAnimation, PlantId } from '@/data/plants'
import { AnimationConfig, AnimationEntity, AnimationEvents, AnimationState } from '@/entities/Animation'
import { HoverableComp } from '@/comps/Hoverable.ts'
import { kLevelState } from '@/entities/Level.ts'

export interface PlantUniqueConfig {
    plantId: PlantId
}
export interface PlantConfig extends PlantUniqueConfig, AnimationConfig {}

export interface PlantState extends AnimationState {
    isHighlight: boolean
}

export interface PlantEvents extends AnimationEvents {}

export class PlantEntity extends AnimationEntity<PlantConfig, PlantState, PlantEvents> {

    constructor(config: PlantUniqueConfig, state: PlantState) {
        super({
            ...config,
            ...plantAnimation.getAnimationConfig(config.plantId, 'common'),
        }, state)

        this.afterStart(() => {
            this.withComp(HoverableComp, ({ emitter }) => {
                emitter.on('mouseenter', () => {
                    console.log('mouseenter')
                    if (this.inject(kLevelState)!.holdingObject?.type === 'shovel') {
                        this.state.isHighlight = true
                    }
                })
                emitter.on('mouseleave', () => {
                    this.state.isHighlight = false
                })
            })
        })
    }
}
