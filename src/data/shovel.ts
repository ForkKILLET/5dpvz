import {AnimationConfig} from "@/entities/Animation.ts";
import {AnimationData} from "@/data/plants.ts";

export interface ShovelMetadata {
    name: string
    recycle: number
    animations: {
        common: AnimationData
        [name: string]: AnimationData
    }
}

export const SHOVEL_NAMES = [ 'iron_shovel' ] as const

export type ShovelId = typeof SHOVEL_NAMES[number]

export const SHOVEL_METADATA: Record<ShovelId, ShovelMetadata> = {
    iron_shovel: {
        name: "Iron Shovel",
        recycle: 0,
        animations: {
            common: { fpsf: 8, frameNum: 1}
        }
    }
}

export const getShovelImageSrc = (id: ShovelId) => `./assets/shovels/${id}.png`
export const getShovelAnimationConfig = (id: ShovelId, name = ''): AnimationConfig => {
    const metadata = SHOVEL_METADATA[id]
    const { frameNum, fpsf } = metadata.animations.common
    const srcs = Array.from(
        { length: frameNum },
        (_, i) => `${i}/${name}`
    )
    return { srcs, fpsf }
}
