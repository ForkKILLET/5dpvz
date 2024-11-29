import { NormalZombieEntity } from '@/entities/zombies/NormalZombie'
import { ZombieEntity } from '@/entities/zombies/Zombie'
import { ShapeComp } from '@/comps/Shape'
import { AnimeDefSet, useTextures } from '@/data/textures'

export interface ZombieMetadata {
    id: ZombieId
    name: string
    hp: number
    atk: number
    speed: number
    damage: number
    shapeFactory?: (entity: ZombieEntity) => ShapeComp
    animes: AnimeDefSet
}

export type ZombieMovingState = 'normal' | 'frozen' | 'cold' | 'hypnotised'
export type ZombiePlace = 'land' | 'sky' | 'underground' | 'swim' | 'dive'

export const ZOMBIE_NAMES = [ 'normal_zombie' ] as const
export type ZombieId = typeof ZOMBIE_NAMES[number]

export const ZOMBIES = {
    normal_zombie: NormalZombieEntity,
} as Record<ZombieId, ZombieMetadata & typeof ZombieEntity>

export const zombieTextures = useTextures('zombies', ZOMBIES)
