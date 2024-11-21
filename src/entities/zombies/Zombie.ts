import { CollidableComp } from '@/comps/Collidable'
import { FilterComp } from '@/comps/Filter'
import {
    ZOMBIES, ZombieMetadata, zombieTextures,
    ZombieId, ZombieMovingState, ZombiePlace
} from '@/data/zombies'
import { EntityCtor, EntityState, Position } from '@/engine'
import { TextureConfig, TextureEntity, TextureEvents, TextureState } from '@/entities/Texture'
import { PartialBy } from '@/utils'

export interface ZombieUniqueConfig {
    metadata: ZombieMetadata
}
export interface ZombieConfig extends ZombieUniqueConfig, TextureConfig {}

export interface ZombieUniqueState {
    j: number
    hp: number
    movingState: ZombieMovingState
    place: ZombiePlace
    damageFilterTimer: number
}
export interface ZombieState extends ZombieUniqueState, TextureState {}

export interface ZombieEvents extends TextureEvents {
    'damage': [ number ]
}

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
            .addComp(CollidableComp, {
                groups: new Set([ 'zombies' ] as const),
                targetGroups: new Set([ 'bullets' ] as const),
            })
            .withComp(FilterComp, filter => {
                this.on('damage', () => {
                    filter.filters.damage = 'brightness(1.2)'
                    this.state.damageFilterTimer = 1000
                })
            })
    }

    static createZombie<
        Z extends ZombieId,
        C extends Omit<ZombieUniqueConfig, 'metadata'>,
        S extends ZombieUniqueState & EntityState
    >(zombieId: Z, config: C, state: PartialBy<S, 'hp' | 'movingState' | 'place' | 'damageFilterTimer'>) {
        const Zombie = ZOMBIES[zombieId]
        return Zombie.createTexture(
            {
                textures: zombieTextures.getAnimeTextureSet(zombieId),
                metadata: Zombie,
                containingMode: 'strict',
                ...config,
            },
            {
                hp: Zombie.hp,
                movingState: 'moving',
                place: 'front',
                damageFilterTimer: 0,
                ...state,
            }
        )
    }

    nextMove(): Position {
        return {
            x: - this.config.metadata.speed * this.game.mspf,
            y: 0,
        }
    }

    update() {
        super.update()
        this.updatePosition(this.nextMove())
        this.updateTimer('damageFilterTimer', { interval: 500 }, () => {
            this.getComp(FilterComp)!.filters.damage = null
        })
        if (this.state.hp <= 0) this.dispose()
    }

    damage(damage: number) {
        this.state.hp -= damage
        this.emit('damage', damage)
    }
}

export const defineZombie = <E extends ZombieEntity>(metadata: ZombieMetadata & EntityCtor<E>) => metadata
