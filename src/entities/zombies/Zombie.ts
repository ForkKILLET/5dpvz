import { FilterComp } from '@/comps/Filter'
import { ZOMBIE_METADATA, zombieAnimation, ZombieId, ZombieMetadata } from '@/data/zombies'
import { EntityCtor, EntityState } from '@/engine'
import { AnimationEntity } from '@/entities/Animation'
import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from '@/entities/Button'

export interface ZombieUniqueConfig {
    metadata: ZombieMetadata
}
export interface ZombieConfig extends ZombieUniqueConfig, ButtonConfig {}

export interface ZombieState extends ButtonState {}

export interface ZombieEvents extends ButtonEvents {}

export class ZombieEntity<
    S extends ZombieState = ZombieState,
    E extends ZombieEvents = ZombieEvents
> extends ButtonEntity<ZombieConfig, S, E> {
    constructor(config: ZombieConfig, state: S) {
        super(config, state)
        this.afterStart(() => this.addComp(FilterComp))
    }

    static create<
        Z extends ZombieId,
        C extends Omit<ZombieUniqueConfig, 'metadata'>,
        S extends EntityState
    >(zombieId: Z, config: C, state: S) {
        const metadata = ZOMBIE_METADATA[zombieId]
        return metadata.from<ZombieEntity>(
            AnimationEntity.create(
                zombieAnimation.getAnimationConfig(zombieId, 'zombies'),
                state
            ),
            {
                metadata,
                containingMode: 'strict',
                ...config,
            }
        )
    }

    nextMove(): number {
        return - this.config.metadata.speed * this.game.mspf
    }
}

export const defineZombie = (metadata: ZombieMetadata & EntityCtor<ZombieEntity>) =>
    metadata as ZombieMetadata & typeof ZombieEntity
