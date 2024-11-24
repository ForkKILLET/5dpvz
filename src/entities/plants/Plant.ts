import { ButtonEvents } from '@/comps/Button'
import { CollidableComp } from '@/comps/Collidable'
import { FilterComp } from '@/comps/Filter'
import { DamageEffectComp, HealthComp } from '@/comps/Health'
import { HoverableComp } from '@/comps/Hoverable'
import { PlantId, PlantMetadata, PLANTS, plantTextures } from '@/data/plants'
import { Entity, EntityCtor, EntityState } from '@/engine'
import { kLevel } from '@/entities/Level'
import { TextureConfig, TextureEntity, TextureEvents, TextureState } from '@/entities/Texture'
import { StrictOmit } from '@/utils'

export interface PlantUniqueConfig {
    metadata: PlantMetadata
}
export interface PlantConfig extends PlantUniqueConfig, TextureConfig {}

export interface PlantUniqueState {
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

        const { shapeFactory } = this.config.metadata
        if (shapeFactory) this
            .addCompRaw(shapeFactory(this).setTag('hitbox'))

        this
            .addComp(CollidableComp, {
                groups: new Set([ 'plants' ] as const),
                targetGroups: new Set([ 'zombies' ] as const),
            })
            .addComp(HoverableComp)
            .addComp(FilterComp)
            .addComp(HealthComp, this.config.metadata.hp)
            .addComp(DamageEffectComp)
            .withComps([ HoverableComp, FilterComp ], ({ emitter }, { state: { filters } }) => {
                emitter.on('mouseenter', () => {
                    if (this.inject(kLevel)!.state.holdingObject?.type === 'shovel')
                        filters.onShovel = 'brightness(1.2)'
                })
                emitter.on('mouseleave', () => {
                    filters.onShovel = null
                })
            })
    }

    static isPlant(entity: Entity): entity is PlantEntity {
        return entity instanceof PlantEntity
    }

    static createPlant<
        I extends PlantId,
        C extends StrictOmit<PlantUniqueConfig, 'metadata'>,
        S extends PlantUniqueState & EntityState
    >(plantId: I, config: C, state: S) {
        const Plant = PLANTS[plantId]
        return Plant.createTexture(
            {
                metadata: Plant,
                textures: plantTextures.getAnimeTextureSet(plantId),
                strictShape: true,
                ...config,
            },
            state,
        )
    }
}

export const definePlant = <E extends PlantEntity>(metadata: PlantMetadata & EntityCtor<E>) => metadata
