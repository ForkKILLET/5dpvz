import { AnimeDefSet, useTextures } from '@/data/textures'

export interface ShovelMetadata {
    name: string
    recycle: boolean
    animes: AnimeDefSet
}

export const SHOVEL_NAMES = [ 'iron_shovel' ] as const

export type ShovelId = typeof SHOVEL_NAMES[number]

export const SHOVELS: Record<ShovelId, ShovelMetadata> = {
    iron_shovel: {
        name: 'Iron Shovel',
        recycle: false,
        animes: {
            common: { fpaf: 8, frameNum: 1 },
        },
    },
}

export const shovelTextures = useTextures('shovels', SHOVELS)
