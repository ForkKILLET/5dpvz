export interface PlantMetadata {
    name: string
    cost: number
    coolDown: number
    isPlantableAtStart: boolean
}

export const PLANT_NAMES = [ 'pea_shooter' ] as const

export type PlantName = typeof PLANT_NAMES[number]

export const PLANT_METADATA: Record<PlantName, PlantMetadata> = {
    pea_shooter: {
        name: 'Pea Shooter',
        cost: 100,
        coolDown: 7500,
        isPlantableAtStart: true
    }
}