import { AnimationConfig } from '@/entities/Animation'

export interface AnimationData {
    fpsf: number
    frameNum: number
}

export interface PlantMetadata {
    name: string
    cost: number
    cd: number
    hp: number
    isPlantableAtStart: boolean
    animations: {
        common: AnimationData
        [name: string]: AnimationData
    }
}

export const PLANT_NAMES = [ 'pea_shooter' ] as const

export type PlantId = typeof PLANT_NAMES[number]

export const PLANT_METADATA: Record<PlantId, PlantMetadata> = {
    pea_shooter: {
        name: 'Pea Shooter',
        cost: 100,
        cd: 7500,
        hp: 300,
        isPlantableAtStart: true,
        animations: {
            common: { fpsf: 8, frameNum: 12 }
        }
    }
}

export const getPlantImageSrc = (id: PlantId) => `./assets/plants/${id}/common/01.png`
export const getPlantAnimationConfig = (id: PlantId, name = 'common'): AnimationConfig => {
    const metadata = PLANT_METADATA[id]
    const { frameNum, fpsf } = metadata.animations.common
    const srcs = Array.from(
        { length: frameNum },
        (_, i) => `./assets/plants/${id}/${name}/${String(i + 1).padStart(2, '0')}.png`
    )
    return { srcs, fpsf }
}