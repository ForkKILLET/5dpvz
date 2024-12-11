import { BULLETS, bulletTextures, BulletId, BulletMetadata } from '@/data/bullets'
import { FilterComp } from '@/comps/Filter'
import { Entity, EntityCtor, EntityState, Vector2D } from '@/engine'
import { ZombieEntity } from '@/entities/zombies/Zombie'
import { CollidableComp } from '@/comps/Collidable'
import { TextureConfig, TextureState, TextureEvents, TextureEntity } from '@/entities/Texture'
import { HealthComp } from '@/comps/Health'
import { kProcess } from '@/entities/Process'
import { StrictOmit } from '@/utils'

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
        if (shapeFactory) this
            .addRawComp(shapeFactory(this).setTag('hitbox'))

        this
            .addComp(CollidableComp, {
                groups: [ 'bullet' ],
                target: { ty: 'has', group: 'zombie' },
            })
            .addComp(FilterComp)
            .withComp(CollidableComp, colliable => {
                colliable.emitter.on('collide', (target: Entity) => {
                    if (target instanceof ZombieEntity) this.hit(target)
                })
            })
    }

    static createBullet<
        I extends BulletId,
        C extends Omit<BulletUniqueConfig, 'metadata'>,
        S extends StrictOmit<EntityState, 'size'>
    >(bulletId: I, config: C, state: S) {
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

    hit(zombie: ZombieEntity) {
        zombie.getComp(HealthComp)!.takeDamage(this.config.metadata.damage)
        if (! this.config.metadata.penetrating) this.dispose()
    }

    nextMove(): Vector2D {
        return {
            x: this.config.metadata.speed * this.game.mspf0,
            y: 0,
        }
    }

    update() {
        super.update()
        this.updatePosBy(this.nextMove())
        if (! this.inject(kProcess)!.isInsideLawn(this.state.pos)) this.dispose()
    }
}

export const defineBullet = <
    E extends BulletEntity, Ec extends BulletMetadata & EntityCtor<E>
>(Ctor: Ec) => Ctor
