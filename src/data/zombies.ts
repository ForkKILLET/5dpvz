import { AnimationSetData, useAnimation } from '@/entities/Animation'
import { NormalZombieEntity } from '@/entities/zombies/NormalZombie'

export interface ZombieMetadata {
    id: ZombieId
    name: string
    hp: number
    speed: number
    status: ZombieStatus
    animations: AnimationSetData
}

export const ZOMBIE_MOVES = [ 'normal', 'frozen', 'cold', 'hypnotised' ] as const
export const ZOMBIE_PLACES = [ 'land', 'sky', 'ground', 'float', 'dive' ] as const
export type ZombieMove = typeof ZOMBIE_MOVES[number]
export type ZombiePlace = typeof ZOMBIE_PLACES[number]
export type ZombieStatus = { move: ZombieMove, place: ZombiePlace }

export const ZOMBIE_NAMES = [ 'normal_zombie' ] as const
export type ZombieId = typeof ZOMBIE_NAMES[number]

export const ZOMBIE_METADATA = {
    normal_zombie: NormalZombieEntity,
} satisfies Record<ZombieId, ZombieMetadata>

export const zombieAnimation = useAnimation('zombies', ZOMBIE_METADATA)
