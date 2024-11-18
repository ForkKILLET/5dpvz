import { BulletEntity, BulletEvents, BulletState, defineBullet } from '@/entities/bullets/Bullet'
import { CollidableComp } from '@/comps/Collidable'
import { CircleShapeComp } from '@/comps/Shape'
import { Entity } from '@/engine'

export interface PeaState extends BulletState {}
export interface PeaEvents extends BulletEvents {}

export const PeaEntity = defineBullet(
    class PeaEntity extends BulletEntity<PeaState, PeaEvents> {
        static readonly id = 'pea'
        static readonly attack = 8
        static readonly collisionShape = (entity: PeaEntity) => new CollidableComp(
            entity,
            new CircleShapeComp(
                entity,
                { x: 0, y: 0 },
                8
            ),
            [ 'bullets' ],
            [ 'zombies' ],
            (other: Entity) => PeaEntity.onCollide(other)
        )
        static readonly animations = {
            common: { fpaf: 8, frameNum: 1 },
        }
        static readonly move = () => {} // TODO
        static readonly onCollide = (other: Entity) => {
            console.log(other)
        } // TODO
    }
)
