import { CollidableComp } from '@/comps/Collidable'
import { FilterComp } from '@/comps/Filter'
import {
    ZOMBIES, ZombieMetadata, zombieTextures,
    ZombieId, ZombieMovingState, ZombiePlace
} from '@/data/zombies'
import { Entity, EntityCtor, EntityState, Position } from '@/engine'
import { TextureConfig, TextureEntity, TextureEvents, TextureState } from '@/entities/Texture'
import { PartialBy } from '@/utils'
import { HealthAtkComp, HealthComp } from '@/comps/Health'

export interface ZombieUniqueConfig {
    metadata: ZombieMetadata
}
export interface ZombieConfig extends ZombieUniqueConfig, TextureConfig {}

export interface ZombieUniqueState {
    j: number
    // hp: number
    movingState: ZombieMovingState
    place: ZombiePlace
    damageFilterTimer: number
}
export interface ZombieState extends ZombieUniqueState, TextureState {}

export interface ZombieEvents extends TextureEvents {
    // 'damage': [ number ]
}

export class ZombieEntity<
    S extends ZombieState = ZombieState,
    V extends ZombieEvents = ZombieEvents
> extends TextureEntity<ZombieConfig, S, V> {
    currentAttacking: Entity | null = null

    constructor(config: ZombieConfig, state: S) {
        super(config, state)

        const { shapeFactory } = this.config.metadata
        if (shapeFactory) this.addCompRaw(shapeFactory(this).setTag('hitbox'))

        this
            .addComp(FilterComp)
            .addComp(HealthAtkComp, {
                hp: this.config.metadata.hp,
                atk: this.config.metadata.atk,
                canInstantAttack: true,
                instantAttackTimer: 0,
                attackInterval: 500,
            })
            .addComp(CollidableComp, {
                groups: new Set([ 'zombies' ] as const),
                targetGroups: new Set([ 'bullets', 'plants' ] as const),
                onCollide: (target: Entity) => {
                    // TODO: type check here!!!!!
                    console.log(target)
                    if (! this.currentAttacking) {
                        this.currentAttacking = target
                        target.on('dispose', () => this.currentAttacking = null)
                    }
                    // if (target instanceof PlantEntity) this.getComp(HealthAtkComp)!.attack(target)
                    this.getComp(HealthAtkComp)!.attack(target)
                },
            })
            .withComp(FilterComp, filter => {
                this.getComp(HealthComp)!.emitter.on('takeDamage', () => {
                    filter.filters.damage = 'brightness(1.2)'
                    this.state.damageFilterTimer = 500
                })
            })
    }

    static createZombie<
        Z extends ZombieId,
        C extends Omit<ZombieUniqueConfig, 'metadata'>,
        S extends ZombieUniqueState & EntityState
    >(zombieId: Z, config: C, state: PartialBy<S, 'movingState' | 'place' | 'damageFilterTimer'>) {
        const Zombie = ZOMBIES[zombieId]
        return Zombie.createTexture(
            {
                textures: zombieTextures.getAnimeTextureSet(zombieId),
                metadata: Zombie,
                ...config,
            },
            {
                // hp: Zombie.hp,
                movingState: 'moving',
                place: 'front',
                damageFilterTimer: 0,
                ...state,
            }
        )
    }

    nextMove(): Position {
        return {
            x: this.currentAttacking ? 0 : - this.config.metadata.speed * this.game.mspf,
            y: 0,
        }
    }

    update() {
        super.update()
        this.updatePosition(this.nextMove())
        this.updateTimer('damageFilterTimer', { interval: 500 }, () => {
            this.getComp(FilterComp)!.filters.damage = null
        })
    }
}

export const defineZombie = <E extends ZombieEntity>(metadata: ZombieMetadata & EntityCtor<E>) => metadata
