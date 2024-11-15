import { PLANT_METADATA, plantAnimation, PlantId, PlantMetadata } from '@/data/plants'
import { AnimationEntity } from '@/entities/Animation'
import { HoverableComp } from '@/comps/Hoverable'
import { kLevelState } from '@/entities/Level'
import { FilterComp } from '@/comps/Filter'
import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from '@/entities/Button'
import { EntityCtor, EntityState } from '@/engine'

export interface PlantUniqueConfig {
    i: number
    j: number
}
export interface PlantConfig extends PlantUniqueConfig, ButtonConfig {}

export interface PlantState extends ButtonState {}

export interface PlantEvents extends ButtonEvents {}

export abstract class PlantEntity<
    C extends PlantConfig = PlantConfig,
    S extends PlantState = PlantState,
    E extends PlantEvents = PlantEvents
> extends ButtonEntity<C, S, E> {
    constructor(config: C, state: S) {
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

    static create<P extends PlantId, C, S extends EntityState>(plantId: P, config: C, state: S) {
        return PLANT_METADATA[plantId].from(
            new AnimationEntity(
                plantAnimation.getAnimationConfig(plantId, 'plants'),
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
