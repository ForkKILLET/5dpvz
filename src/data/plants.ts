import { AnimationSetData, useAnimation } from '@/entities/Animation'

import { PeaShooterEntity } from '@/entities/plants/PeaShooter'

export interface PlantMetadata {
    id: PlantId
    name: string
    cost: number
    cd: number
    hp: number
    isPlantableAtStart: boolean
    animations: AnimationSetData
}

export const PLANT_NAMES = [ 'pea_shooter' ] as const

export type PlantId = typeof PLANT_NAMES[number]

export const PLANT_METADATA = {
    pea_shooter: PeaShooterEntity,
} satisfies Record<PlantId, PlantMetadata>

export const plantAnimation = useAnimation('plants', PLANT_METADATA)
