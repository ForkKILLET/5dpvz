import { ZOMBIE_METADATA, zombieAnimation, ZombieId, ZombieMetadata } from '@/data/zombies'
import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from '@/entities/Button'
import { EntityCtor, EntityState } from '@/engine'
import { AnimationEntity } from '@/entities/Animation'
import { FilterComp } from '@/comps/Filter'
// import { HoverableComp } from '@/comps/Hoverable'
// import { kLevelState } from '@/entities/Level'

export interface ZombieUniqueConfig {
    x: number
    y: number
}

export interface ZombieConfig extends ZombieUniqueConfig, ButtonConfig {}

export interface ZombieState extends ButtonState {}

export interface ZombieEvents extends ButtonEvents {}

export abstract class ZombieEntity<
    C extends ZombieConfig = ZombieConfig,
    S extends ZombieState = ZombieState,
    E extends ZombieEvents = ZombieEvents
> extends ButtonEntity<C, S, E> {
    constructor(config: C, state: S) {
        super(config, state)

        this.afterStart(() => this
            .addComp(FilterComp)
        )
    }

    static create<Z extends ZombieId, C, S extends EntityState>(zombieId: Z, config: C, state: S) {
        return ZOMBIE_METADATA[zombieId].from(
            new AnimationEntity(
                zombieAnimation.getAnimationConfig(zombieId, 'plants'),
                AnimationEntity.initState(state)
            ),
            {
                containingMode: 'rect',
                ...config,
            }
        )
    }
}

export const defineZombie = <
    E extends ZombieEntity, Ec extends EntityCtor<E> & ZombieMetadata
>(ZombieCtor: Ec) => ZombieCtor
