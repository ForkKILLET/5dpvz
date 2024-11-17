import { ZOMBIE_METADATA, zombieAnimation, ZombieId, ZombieMetadata } from '@/data/zombies.ts'
import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from '@/entities/Button.ts'
import { EntityCtor, EntityState } from '@/engine'
import { AnimationEntity } from '@/entities/Animation.ts'
import { HighlightableComp } from '@/comps/Highlightable.ts'
// import { HoverableComp } from '@/comps/Hoverable.ts'
// import { kLevelState } from '@/entities/Level.ts'

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
            .addComp(HighlightableComp, 'brightness(1.2)')
            // .withComps([ HoverableComp, HighlightableComp ], ({ emitter }, highlightableComp) => {
            //     emitter.on('mouseenter', () => {
            //         if (this.inject(kLevelState)!.holdingObject?.type === 'shovel')
            //             highlightableComp.highlighting = true
            //     })
            //     emitter.on('mouseleave', () => {
            //         highlightableComp.highlighting = false
            //     })
            // })
            // .on('before-render', () => {
            //     if (this.getComp(HighlightableComp)!.highlighting) this.game.ctx.filter = 'brightness(1.5)'
            // })
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
            },
        )
    }
}

export const defineZombie = <
    E extends ZombieEntity, Ec extends EntityCtor<E> & ZombieMetadata
>(ZombieCtor: Ec) => ZombieCtor
