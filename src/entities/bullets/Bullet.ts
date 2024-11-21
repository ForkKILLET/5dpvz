import { BULLETS, bulletTextures, BulletId, BulletMetadata } from '@/data/bullets'
import { FilterComp } from '@/comps/Filter'
import { Entity, EntityCtor, EntityState, Position } from '@/engine'
import { ZombieEntity } from '@/entities/zombies/Zombie'
import { CollidableComp } from '@/comps/Collidable'
import { TextureConfig, TextureState, TextureEvents, TextureEntity } from '@/entities/Texture'

export interface BulletUniqueConfig {
    metadata: BulletMetadata
}

export interface BulletConfig extends BulletUniqueConfig, TextureConfig {}

export interface BulletState extends TextureState {}

export interface BulletEvents extends TextureEvents {}

export class BulletEntity<
    S extends BulletState = BulletState,
    V extends BulletEvents = BulletEvents
> extends TextureEntity<BulletConfig, S, V> {
    constructor(config: BulletConfig, state: S) {
        super(config, state)

        const { shapeFactory } = this.config.metadata
        if (shapeFactory) this.addCompRaw(shapeFactory(this).setTag('hitbox'))

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

    static createBullet<
        B extends BulletId,
        C extends Omit<BulletUniqueConfig, 'metadata'>,
        S extends EntityState
    >(bulletId: B, config: C, state: S) {
        const Bullet = BULLETS[bulletId]
        return Bullet.createTexture(
            {
                metadata: Bullet,
                textures: bulletTextures.getAnimeTextureSet(bulletId),
                origin: 'center',
                ...config,
            },
            {
                ...state,
            },
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
