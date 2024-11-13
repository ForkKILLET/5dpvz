import { AnimationData, useAnimation } from '@/entities/Animation'

export interface ShovelMetadata {
    name: string
    recycle: boolean
    animations: {
        common: AnimationData
        [name: string]: AnimationData
    }
}

export const SHOVEL_NAMES = [ 'iron_shovel' ] as const

export type ShovelId = typeof SHOVEL_NAMES[number]

export const SHOVEL_METADATA: Record<ShovelId, ShovelMetadata> = {
    iron_shovel: {
        name: 'Iron Shovel',
        recycle: false,
        animations: {
            common: { fpsf: 8, frameNum: 1}
        }
    }
}

export const shovelAnimation = useAnimation('shovels', SHOVEL_METADATA)
