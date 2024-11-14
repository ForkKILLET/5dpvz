import { plantAnimation, PlantId } from '@/data/plants'
import { AnimationConfig, AnimationEntity, AnimationEvents, AnimationState } from '@/entities/Animation'
import { HoverableComp } from '@/comps/Hoverable'
import { kLevelState } from '@/entities/Level'
import { HighlightableComp } from '@/comps/Highlightable'

export interface PlantUniqueConfig {
    plantId: PlantId
}
export interface PlantConfig extends PlantUniqueConfig, AnimationConfig {}

export interface PlantState extends AnimationState {}

export interface PlantEvents extends AnimationEvents {}

export class PlantEntity extends AnimationEntity<PlantConfig, PlantState, PlantEvents> {
    constructor(config: PlantUniqueConfig, state: PlantState) {
        super({
            ...config,
            ...plantAnimation.getAnimationConfig(config.plantId, 'common'),
        }, state)

        this.afterStart(() => {
            this
                .addComp(HighlightableComp)
                .withComps([ HoverableComp, HighlightableComp ], ({ emitter }, highlightableComp) => {
                    emitter.on('mouseenter', () => {
                        if (this.inject(kLevelState)!.holdingObject?.type === 'shovel')
                            highlightableComp.highlighting = true
                    })
                    emitter.on('mouseleave', () => {
                        highlightableComp.highlighting = false
                    })
                })
                .on('before-render', () => {
                    if (this.getComp(HighlightableComp)!.highlighting) this.game.ctx.filter = 'brightness(1.5)'
                })
        })
    }
}
