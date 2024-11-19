import { EntityCtor, EntityState } from '@/engine'
import { AnimationEntity } from '@/entities/Animation'
import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from '@/entities/ui/Button'
import { kLevelState } from '@/entities/Level'
import { HoverableComp } from '@/comps/Hoverable'
import { FilterComp } from '@/comps/Filter'
import { PLANT_METADATA, plantAnimation, PlantId, PlantMetadata } from '@/data/plants'

export interface PlantUniqueConfig {
    i: number
    j: number
    metadata: PlantMetadata
}
export interface PlantConfig extends PlantUniqueConfig, ButtonConfig {}

export interface PlantState extends ButtonState {}

export interface PlantEvents extends ButtonEvents {}

export class PlantEntity<
    S extends PlantState = PlantState,
    E extends PlantEvents = PlantEvents
> extends ButtonEntity<PlantConfig, S, E> {
    constructor(config: PlantConfig, state: S) {
        super(config, state)

        this.afterStart(() => this
            .addComp(FilterComp)
            .withComps([ HoverableComp, FilterComp ], ({ emitter }, filterComp) => {
                emitter.on('mouseenter', () => {
                    if (this.inject(kLevelState)!.holdingObject?.type === 'shovel')
                        filterComp.filters.onShovel = 'brightness(1.5)'
                })
                emitter.on('mouseleave', () => {
                    filterComp.filters.onShovel = null
                })
            })
        )
    }

    static create<
        P extends PlantId,
        C extends Omit<PlantUniqueConfig, 'metadata'>,
        S extends EntityState
    >(plantId: P, config: C, state: S) {
        const metadata = PLANT_METADATA[plantId]
        return metadata.from<PlantEntity>(
            AnimationEntity.create(
                plantAnimation.getAnimationConfig(plantId),
                state
            ),
            {
                metadata,
                containingMode: 'strict',
                ...config,
            },
        )
    }
}

export const definePlant = (metadata: PlantMetadata & EntityCtor<PlantEntity>) => metadata
