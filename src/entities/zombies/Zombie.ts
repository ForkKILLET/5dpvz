import { CollidableComp } from '@/comps/Collidable'
import { FilterComp } from '@/comps/Filter'
import { ContinuousDamagingComp, DamageEffectComp, HealthComp } from '@/comps/Health'
import { RectShape } from '@/comps/Shape'
import { PLANTS } from '@/data/plants'
import { ZombieId, ZombieMetadata, ZombieMovingState, ZombiePlace, ZOMBIES, zombieTextures } from '@/data/zombies'
import { Entity, EntityCtor, EntityState, Vector2D } from '@/engine'
import { PlantEntity } from '@/entities/plants/Plant'
import { TextureConfig, TextureEntity, TextureEvents, TextureState } from '@/entities/Texture'
import { PartialBy, StrictOmit } from '@/utils'
import { HpBarEntity } from '@/entities/ui/HpBar'

void PLANTS

export interface ZombieUniqueConfig {
    metadata: ZombieMetadata
}
export interface ZombieConfig extends ZombieUniqueConfig, TextureConfig {}

export interface ZombieAutoState {
    movingState: ZombieMovingState
    place: ZombiePlace
    speedRatio: number
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
        if (shapeFactory) this.addRawComp(shapeFactory(this).setTag('hitbox'))

        this
            .addComp(FilterComp)
            .addComp(HealthComp, this.config.metadata.hp)
            .addComp(DamageEffectComp)
            .addComp(ContinuousDamagingComp, 1)
            .addComp(CollidableComp, {
                groups: [ 'zombie' ],
                target: { ty: 'has-some', groups: [ 'plant', 'bullet' ] },
            })
            .withComp(CollidableComp, collidable => {
                collidable.emitter.on('collide', (target: Entity) => {
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
                })
            })

        if (this.game.config.isDebug)
            this.useBuilder('HpBar', () => HpBarEntity.createHpBarEntity({
                pos: { ...this.state.pos },
                zIndex: this.state.zIndex,
            }))
    }

    static createZombie<
        I extends ZombieId,
        C extends Omit<ZombieUniqueConfig, 'metadata'>,
        S extends ZombieUniqueState & StrictOmit<EntityState, 'size'>
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

    nextMove(): Vector2D {
        const x = this.state.eatingPlant
            ? 0
            : - this.config.metadata.speed * this.state.speedRatio * this.game.mspf0
        return { x, y: 0 }
    }

    update() {
        super.update()
        if (! this.state.enteredHouse && this.state.pos.x < 0) {
            this.state.enteredHouse = true
        }
        if (this.state.pos.x > - this.getComp(RectShape)!.rect.width) {
            this.updatePos(this.nextMove())
        }
    }
}

export const defineZombie = <
    E extends ZombieEntity, Ec extends ZombieMetadata & EntityCtor<E>
>(Ctor: Ec) => Ctor
