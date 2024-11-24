import { CircleShape } from '@/comps/Shape'
import { BulletEntity, BulletEvents, BulletState, defineBullet } from '@/entities/bullets/Bullet'
import { Entity } from '@/engine'

export interface PeaState extends BulletState {}
export interface PeaEvents extends BulletEvents {}

export const PeaEntity = defineBullet(class PeaEntity extends BulletEntity<PeaState, PeaEvents> {
    static readonly id = 'pea'
    static readonly damage = 20
    static readonly penetrating = false
    static readonly speed = 80 / 1000
    static readonly animes = {
        common: { fpaf: 8, frameNum: 1 },
    }
    static readonly shapeFactory = (entity: Entity) => CircleShape.create(entity, { radius: 9 })
})
