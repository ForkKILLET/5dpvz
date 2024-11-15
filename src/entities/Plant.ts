import { plantAnimation, PlantId } from '@/data/plants'
import { AnimationEntity } from '@/entities/Animation'
import { HoverableComp } from '@/comps/Hoverable'
import { kLevelState } from '@/entities/Level'
import { HighlightableComp } from '@/comps/Highlightable'
import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from '@/entities/Button'
import { EntityState } from '@/engine'

export interface PlantUniqueConfig {
    i: number
    j: number
    plantId: PlantId
}
export interface PlantConfig extends PlantUniqueConfig, ButtonConfig {}

export interface PlantState extends ButtonState {}

export interface PlantEvents extends ButtonEvents {}

export class PlantEntity extends ButtonEntity<PlantConfig, PlantState, PlantEvents> {
    constructor(config: PlantConfig, state: PlantState) {
        super(config, state)

        this.afterStart(() => this
            .addComp(HighlightableComp, 'brightness(1.2)')
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
        )
    }

    static create(config: PlantUniqueConfig, state: EntityState) {
        return PlantEntity.from(
            new AnimationEntity(
                plantAnimation.getAnimationConfig(config.plantId),
                AnimationEntity.initState(state)
            ),
            {
                containingMode: 'rect',
                ...config,
            },
        )
    }
}
