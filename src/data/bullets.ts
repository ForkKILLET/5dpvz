import { ShapeComp } from '@/comps/Shape'
import { BulletEntity } from '@/entities/bullets/Bullet'
import { PeaEntity } from '@/entities/bullets/Pea'
import { AnimeDefSet, useTextures } from '@/data/textures'

export interface BulletMetadata {
    id: BulletId
    damage: number
    penetrating: boolean
    speed: number
    shapeFactory?: (entity: BulletEntity) => ShapeComp
    animes: AnimeDefSet
}

export const BULLET_NAMES = [ 'pea' ] as const
export type BulletId = typeof BULLET_NAMES[number]

export const BULLETS = {
    pea: PeaEntity,
} as Record<BulletId, BulletMetadata & typeof BulletEntity>

export const bulletTextures = useTextures('bullets', BULLETS)
