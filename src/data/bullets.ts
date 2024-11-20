import { ShapeComp } from '@/comps/Shape'
import { AnimationSetData, useAnimation } from '@/entities/Animation'
import { BulletEntity } from '@/entities/bullets/Bullet'
import { PeaEntity } from '@/entities/bullets/Pea'

export interface BulletMetadata {
    id: BulletId
    animations: AnimationSetData
    damage: number
    penetrating: boolean
    speed: number
    shapeFactory?: (entity: BulletEntity) => ShapeComp
}

export const BULLET_NAMES = [ 'pea' ] as const
export type BulletId = typeof BULLET_NAMES[number]

export const BULLET_METADATA = {
    pea: PeaEntity,
} as Record<BulletId, BulletMetadata & typeof BulletEntity>

export const bulletAnimation = useAnimation('bullets', BULLET_METADATA)
