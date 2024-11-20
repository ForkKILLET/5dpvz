import { AnimationSetData, useAnimation } from '@/entities/Animation'
import { NormalZombieEntity } from '@/entities/zombies/NormalZombie'
import { ZombieEntity } from '@/entities/zombies/Zombie'
import { ShapeComp } from '@/comps/Shape'

export interface ZombieMetadata {
    id: ZombieId
    name: string
    hp: number
    speed: number
    animations: AnimationSetData
    shapeFactory?: (entity: ZombieEntity) => ShapeComp
}

export type ZombieMovingState = 'normal' | 'frozen' | 'cold' | 'hypnotised'
export type ZombiePlace = 'land' | 'sky' | 'underground' | 'swim' | 'dive'

export const ZOMBIE_NAMES = [ 'normal_zombie' ] as const
export type ZombieId = typeof ZOMBIE_NAMES[number]

export const ZOMBIE_METADATA = {
    normal_zombie: NormalZombieEntity,
} as Record<ZombieId, ZombieMetadata & typeof ZombieEntity>

export const zombieAnimation = useAnimation('zombies', ZOMBIE_METADATA)
