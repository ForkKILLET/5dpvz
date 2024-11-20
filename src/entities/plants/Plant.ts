import { EntityCtor, EntityState } from '@/engine'
import { AnimationEntity } from '@/entities/Animation'
import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from '@/entities/ui/Button'
import { kAttachToLevel, kLevelState } from '@/entities/Level'
import { HoverableComp } from '@/comps/Hoverable'
import { FilterComp } from '@/comps/Filter'
import { PLANT_METADATA, plantAnimation, PlantId, PlantMetadata } from '@/data/plants'
import { BulletEntity } from '@/entities/bullets/Bullet'
import { MakeOptional, remove } from '@/utils'

export interface PlantUniqueConfig {
    metadata: PlantMetadata
}
export interface PlantConfig extends PlantUniqueConfig, ButtonConfig {}

export interface PlantUniqueState {
    hp: number
    i: number
    j: number
}
export interface PlantState extends PlantUniqueState, ButtonState {}

export interface PlantEvents extends ButtonEvents {}

export class PlantEntity<
    S extends PlantState = PlantState,
    E extends PlantEvents = PlantEvents
> extends ButtonEntity<PlantConfig, S, E> {
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

    static create<
        P extends PlantId,
        C extends Omit<PlantUniqueConfig, 'metadata'>,
        S extends PlantUniqueState & EntityState
    >(plantId: P, config: C, state: MakeOptional<S, 'hp'>) {
        const metadata = PLANT_METADATA[plantId]
        return metadata.from<PlantEntity>(
            AnimationEntity.create(
                plantAnimation.getAnimationConfig(plantId),
                {
                    position: state.position,
                    zIndex: state.zIndex,
                }
            ),
            {
                metadata,
                containingMode: 'strict',
                ...config,
            },
            {
                hp: metadata.hp,
                ...state,
            }
        )
    }

    seekZombies(rows: number[], direction: 'front' | 'back') {
        const { zombiesData } = this.inject(kLevelState)!
        const { x } = this.state.position

        return zombiesData.filter(({ entity: { state } }) => (
            rows.includes(state.j) &&
            (state.position.x >= x === (direction === 'front'))
        )).length > 0
    }

    shootBullet(bullet: BulletEntity) {
        const { bulletsData } = this.inject(kLevelState)!
        const attachToLevel = this.inject(kAttachToLevel)!

        bullet.on('dispose', () => {
            remove(bulletsData, ({ entity }) => bullet.id === entity.id)
        })

        bulletsData.push({ id: bullet.config.metadata.id, entity: bullet })
        attachToLevel(bullet)
    }
}

export const definePlant = <E extends PlantEntity>(metadata: PlantMetadata & EntityCtor<E>) => metadata
