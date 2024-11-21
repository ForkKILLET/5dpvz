import { ButtonEvents } from '@/comps/Button'
import { FilterComp } from '@/comps/Filter'
import { HoverableComp } from '@/comps/Hoverable'
import { PLANTS, PlantId, PlantMetadata, plantTextures } from '@/data/plants'
import { EntityCtor, EntityState } from '@/engine'
import { kLevelState } from '@/entities/Level'
import { TextureConfig, TextureEntity, TextureEvents, TextureState } from '@/entities/Texture'
import { PartialBy, StrictOmit } from '@/utils'

export interface PlantUniqueConfig {
    metadata: PlantMetadata
}
export interface PlantConfig extends PlantUniqueConfig, TextureConfig {}

export interface PlantUniqueState {
    hp: number
    i: number
    j: number
}
export interface PlantState extends PlantUniqueState, TextureState {}

export interface PlantEvents extends TextureEvents, ButtonEvents {}

export class PlantEntity<
    S extends PlantState = PlantState,
    V extends PlantEvents = PlantEvents
> extends TextureEntity<PlantConfig, S, V> {
    constructor(config: PlantConfig, state: S) {
        super(config, state)

        this
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
    }

    static createPlant<
        I extends PlantId,
        C extends StrictOmit<PlantUniqueConfig, 'metadata'>,
        S extends PlantUniqueState & EntityState
    >(plantId: I, config: C, state: PartialBy<S, 'hp'>) {
        const Plant = PLANTS[plantId]
        return Plant.createTexture(
            {
                metadata: Plant,
                textures: plantTextures.getAnimeTextureSet(plantId),
                ...config,
            },
            {
                hp: Plant.hp,
                ...state,
            },
        )
    }
}

export const definePlant = <E extends PlantEntity>(metadata: PlantMetadata & EntityCtor<E>) => metadata
