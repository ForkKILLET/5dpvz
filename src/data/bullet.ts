import { AnimationSetData, useAnimation } from '@/entities/Animation'
import { BulletEntity } from '@/entities/bullets/Bullet'
// import { PeaEntity } from '@/entities/bullets/Pea'
import { CollidableComp } from '@/comps/Collidable'

export interface BulletMetadata {
    id: BulletId
    attack: number
    collisionShape: (entity: BulletEntity) => CollidableComp
    animations: AnimationSetData
    move: (target: any) => void
    onCollide: (other: any) => void
}

export const BULLET_NAMES = [ 'pea' ] as const
export type BulletId = typeof BULLET_NAMES[number]

export const BULLET_METADATA = {
    // pea: PeaEntity,
} as Record<BulletId, BulletMetadata & typeof BulletEntity>

export const bulletAnimation = useAnimation('bullets', BULLET_METADATA)
