import { AnimationSetData, useAnimation } from '@/entities/Animation'

export interface PlantMetadata {
    name: string
    cost: number
    cd: number
    hp: number
    isPlantableAtStart: boolean
    animations: AnimationSetData
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
            common: { fpsf: 8, frameNum: 12 },
        },
    },
}

export const plantAnimation = useAnimation('plants', PLANT_METADATA)
