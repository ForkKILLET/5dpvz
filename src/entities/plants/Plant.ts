import { PLANT_METADATA, plantAnimation, PlantId, PlantMetadata } from '@/data/plants'
import { AnimationEntity } from '@/entities/Animation'
import { HoverableComp } from '@/comps/Hoverable'
import { kLevelState } from '@/entities/Level'
import { HighlightableComp } from '@/comps/Highlightable'
import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from '@/entities/Button'
import { EntityCtor, EntityState } from '@/engine'

export interface PlantUniqueConfig {
    i: number
    j: number
}
export interface PlantConfig extends PlantUniqueConfig, ButtonConfig {}

export interface PlantState extends ButtonState {}

export interface PlantEvents extends ButtonEvents {}

export abstract class PlantEntity extends ButtonEntity<PlantConfig, PlantState, PlantEvents> {
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

    static create<P extends PlantId, C, S extends EntityState>(plantId: P, config: C, state: S) {
        return PLANT_METADATA[plantId].from(
            new AnimationEntity(
                plantAnimation.getAnimationConfig(plantId),
                AnimationEntity.initState(state)
            ),
            {
                containingMode: 'rect',
                ...config,
            },
        )
    }
}

export const definePlant = <E extends PlantEntity, Ec extends EntityCtor<E> & PlantMetadata>(PlantCtor: Ec) => PlantCtor
