import { BULLET_METADATA, bulletAnimation, BulletId, BulletMetadata } from '@/data/bullet'
import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from '@/entities/ui/Button'
import { FilterComp } from '@/comps/Filter'
import { AnimationEntity } from '@/entities/Animation'
import { EntityCtor, EntityState } from '@/engine'

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
        this.afterStart(() => this.addComp(FilterComp))
    }

    static create<
        B extends BulletId,
        C extends Omit<BulletUniqueConfig, 'metadata'>,
        S extends EntityState
    >(bulletId: B, config: C, state: S) {
        const metadata = BULLET_METADATA[bulletId]
        return metadata.from<BulletEntity>(
            AnimationEntity.create(
                bulletAnimation.getAnimationConfig(bulletId, 'bullets'),
                state
            ),
            {
                metadata,
                containingMode: 'strict',
                ...config,
            }
        )
    }
}

export const defineBullet = (
    metadata: BulletMetadata & EntityCtor<BulletEntity>,
) => {
    return metadata as BulletMetadata & typeof BulletEntity
}
