import { CollidableComp } from '@/comps/Collidable'
import { FilterComp } from '@/comps/Filter'
import { AnyShape } from '@/comps/Shape'
import {
    ZOMBIE_METADATA, ZombieMetadata, zombieAnimation,
    ZombieId, ZombieMovingState, ZombiePlace
} from '@/data/zombies'
import { EntityCtor, EntityState, Position } from '@/engine'
import { AnimationEntity } from '@/entities/Animation'
import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from '@/entities/ui/Button'
import { MakeOptional } from '@/utils'

export interface ZombieUniqueConfig {
    metadata: ZombieMetadata
}
export interface ZombieConfig extends ZombieUniqueConfig, ButtonConfig {}

export interface ZombieUniqueState {
    j: number
    hp: number
    movingState: ZombieMovingState
    place: ZombiePlace
    damageFilterTimer: number
}
export interface ZombieState extends ZombieUniqueState, ButtonState {}

export interface ZombieEvents extends ButtonEvents {
    'damage': [ number ]
}

export class ZombieEntity<
    S extends ZombieState = ZombieState,
    E extends ZombieEvents = ZombieEvents
> extends ButtonEntity<ZombieConfig, S, E> {
    constructor(config: ZombieConfig, state: S) {
        super(config, state)

        const { shapeFactory } = this.config.metadata
        if (shapeFactory) this
            .removeComp(AnyShape)
            .addCompRaw(shapeFactory(this))

        this
            .addComp(FilterComp)
            .addComp(CollidableComp, {
                groups: new Set([ 'zombies' ] as const),
                targetGroups: new Set([ 'bullets' ] as const),
            })
            .withComp(FilterComp, filter => {
                this.on('damage', () => {
                    filter.filters.damage = 'brightness(1.2)'
                    this.state.damageFilterTimer = 1_000
                })
            })
    }

    static create<
        Z extends ZombieId,
        C extends Omit<ZombieUniqueConfig, 'metadata'>,
        S extends ZombieUniqueState & EntityState
    >(zombieId: Z, config: C, state: MakeOptional<S, 'hp' | 'movingState' | 'place' | 'damageFilterTimer'>) {
        const metadata = ZOMBIE_METADATA[zombieId]
        return metadata.from<ZombieEntity>(
            AnimationEntity.create(
                zombieAnimation.getAnimationConfig(zombieId),
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
