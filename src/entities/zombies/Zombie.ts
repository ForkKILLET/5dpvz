import { CollidableComp } from '@/comps/Collidable'
import { FilterComp } from '@/comps/Filter'
import { ContinuousDamagingComp, DamageEffectComp, HealthComp } from '@/comps/Health'
import { RectShape } from '@/comps/Shape'
import { PLANTS } from '@/data/plants'
import { ZombieId, ZombieMetadata, ZombieMovingState, ZombiePlace, ZOMBIES, zombieTextures } from '@/data/zombies'
import { Entity, EntityCtor, EntityState, Position } from '@/engine'
import { PlantEntity } from '@/entities/plants/Plant'
import { TextureConfig, TextureEntity, TextureEvents, TextureState } from '@/entities/Texture'
import { PartialBy } from '@/utils'

void PLANTS

export interface ZombieUniqueConfig {
    metadata: ZombieMetadata
}
export interface ZombieConfig extends ZombieUniqueConfig, TextureConfig {}

export interface ZombieAutoState {
    movingState: ZombieMovingState
    place: ZombiePlace
    damageFilterTimer: number
    eatingPlant: PlantEntity | null
    enteredHouse: boolean
}
export interface ZombieUniqueState extends ZombieAutoState {
    j: number
}
export interface ZombieState extends ZombieUniqueState, TextureState {}

export interface ZombieEvents extends TextureEvents {}

export class ZombieEntity<
    S extends ZombieState = ZombieState,
    V extends ZombieEvents = ZombieEvents
> extends TextureEntity<ZombieConfig, S, V> {

    constructor(config: ZombieConfig, state: S) {
        super(config, state)

        const { shapeFactory } = this.config.metadata
        if (shapeFactory) this.addCompRaw(shapeFactory(this).setTag('hitbox'))

        this
            .addComp(FilterComp)
            .addComp(HealthComp, this.config.metadata.hp)
            .addComp(DamageEffectComp)
            .addComp(ContinuousDamagingComp, 1)
            .addComp(CollidableComp, {
                groups: new Set([ 'zombies' ] as const),
                targetGroups: new Set([ 'bullets', 'plants' ] as const),
                onCollide: (target: Entity) => {
                    if (! PlantEntity.isPlant(target)) return
                    if (! this.state.eatingPlant) {
                        this.withComp(ContinuousDamagingComp, ({ state: { targets } }) => {
                            targets.add(target)
                            this.state.eatingPlant = target
                            target.on('dispose', () => {
                                targets.delete(target)
                                this.state.eatingPlant = null
                            })
                        })
                    }
                },
            })
    }

    static createZombie<
        I extends ZombieId,
        C extends Omit<ZombieUniqueConfig, 'metadata'>,
        S extends ZombieUniqueState & EntityState
    >(zombieId: I, config: C, state: PartialBy<S, keyof ZombieAutoState>) {
        const Zombie = ZOMBIES[zombieId]
        return Zombie
            .createTexture(
                {
                    textures: zombieTextures.getAnimeTextureSet(zombieId),
                    metadata: Zombie,
                    ...config,
                },
                {
                    movingState: 'moving',
                    place: 'front',
                    damageFilterTimer: 0,
                    eatingPlant: null,
                    enteredHouse: false,
                    ...state,
                }
            )
    }

    nextMove(): Position {
        const x = this.state.eatingPlant
            ? 0
            : - this.config.metadata.speed * this.game.mspf
        return { x, y: 0 }
    }

    update() {
        super.update()
        if (! this.state.enteredHouse && this.state.position.x < 0) {
            this.state.enteredHouse = true
        }
        if (this.state.position.x > - this.getComp(RectShape)!.rect.width) {
            this.updatePosition(this.nextMove())
        }
    }
}

export const defineZombie = <E extends ZombieEntity>(metadata: ZombieMetadata & EntityCtor<E>) => metadata
