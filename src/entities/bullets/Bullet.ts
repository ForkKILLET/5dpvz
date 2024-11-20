import { BULLET_METADATA, bulletAnimation, BulletId, BulletMetadata } from '@/data/bullets'
import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from '@/entities/ui/Button'
import { FilterComp } from '@/comps/Filter'
import { AnimationEntity } from '@/entities/Animation'
import { Entity, EntityCtor, EntityState, Position } from '@/engine'
import { ZombieEntity } from '@/entities/zombies/Zombie'
import { CollidableComp } from '@/comps/Collidable'
import { ShapeComp } from '@/comps/Shape'

export interface BulletUniqueConfig {
    metadata: BulletMetadata
}

export interface BulletConfig extends BulletUniqueConfig, ButtonConfig {}

export interface BulletState extends ButtonState {}

export interface BulletEvents extends ButtonEvents {}

export class BulletEntity<
    S extends BulletState = BulletState,
    E extends BulletEvents = BulletEvents
> extends ButtonEntity<BulletConfig, S, E> {
    constructor(config: BulletConfig, state: S) {
        super(config, state)

        const { shapeFactory } = this.config.metadata
        if (shapeFactory) this
            .removeComp(ShapeComp)
            .addCompRaw(shapeFactory(this))

        this
            .addComp(CollidableComp, {
                groups: new Set([ 'bullets' ] as const),
                targetGroups: new Set([ 'zombies' ] as const),
                onCollide: (target: Entity) => {
                    if (target instanceof ZombieEntity) this.attack(target)
                },
            })
            .addComp(FilterComp)
    }

    static create<
        B extends BulletId,
        C extends Omit<BulletUniqueConfig, 'metadata'>,
        S extends EntityState
    >(bulletId: B, config: C, state: S) {
        const metadata = BULLET_METADATA[bulletId]
        return metadata.from<BulletEntity>(
            AnimationEntity.create(
                {
                    ...bulletAnimation.getAnimationConfig(bulletId, 'common'),
                    origin: 'center',
                },
                state
            ),
            {
                metadata,
                containingMode: 'strict',
                ...config,
            }
        )
    }

    attack(zombie: ZombieEntity) {
        zombie.damage(this.config.metadata.damage)
        if (! this.config.metadata.penetrating) this.dispose()
    }

    nextMove(): Position {
        return {
            x: this.config.metadata.speed * this.game.mspf,
            y: 0,
        }
    }

    update() {
        super.update()
        this.updatePosition(this.nextMove())
    }
}

export const defineBullet = <E extends BulletEntity>(metadata: BulletMetadata & EntityCtor<E>) => metadata
