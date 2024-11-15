import { AnimationSetData, useAnimation } from '@/entities/Animation.ts'

export interface ZombieMetadata {
    name: string
    hp: number
    state: ZombieState
    animations: AnimationSetData
}

export const ZOMBIE_MOVES = [ 'normal', 'frozen', 'cold', 'hypnotised' ] as const
export const ZOMBIE_PLACES = [ 'land', 'sky', 'ground', 'float', 'dive' ] as const
type ZombieMove = typeof ZOMBIE_MOVES[number]
type ZombiePlace = typeof ZOMBIE_PLACES[number]
export type ZombieState = { move: ZombieMove, place: ZombiePlace }

export const ZOMBIE_NAMES = [ 'normal_zombie' ] as const
export type ZombieId = typeof ZOMBIE_NAMES[number]

export const ZOMBIE_METADATA: Record<ZombieId, ZombieMetadata> = {
    normal_zombie: {
        name: 'Zombie',
        hp: 100,
        state: { move: 'normal', place: 'land' },
        animations: {
            common: { fpaf: 8, frameNum: 12 },
        },
    },
}

export const zombieAnimation = useAnimation('zombies', ZOMBIE_METADATA)
