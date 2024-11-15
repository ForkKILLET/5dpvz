import { zombieAnimation, ZombieId } from '@/data/zombies.ts'
import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from '@/entities/Button.ts'
import { EntityState } from '@/engine'
import { AnimationEntity } from '@/entities/Animation.ts'

export interface ZombieUniqueConfig {
    x: number
    y: number
    zombieId: ZombieId
}

export interface ZombieConfig extends ZombieUniqueConfig, ButtonConfig {}

export interface ZombieState extends ButtonState {}

export interface ZombieEvents extends ButtonEvents {}

export class ZombieEntity extends ButtonEntity<ZombieConfig, ZombieState, ZombieEvents> {
    constructor(config: ZombieConfig, state: ZombieState) {
        super(config, state)
    }

    static create(config: ZombieUniqueConfig, state: EntityState) {
        return ZombieEntity.from(
            new AnimationEntity(
                zombieAnimation.getAnimationConfig(config.zombieId, 'zombies'),
                AnimationEntity.initState(state)
            ),
            {
                containingMode: 'rect',
                ...config,
            }
        )
    }
}
