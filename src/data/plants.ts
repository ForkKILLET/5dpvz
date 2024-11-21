import { PlantEntity } from '@/entities/plants/Plant'
import { PeaShooterEntity } from '@/entities/plants/PeaShooter'
import { SunflowerEntity } from '@/entities/plants/Sunflower'
import { AnimeDefSet, useTextures } from '@/data/textures'
import { ShapeComp } from '@/comps/Shape'

export interface PlantMetadata {
    id: PlantId
    name: string
    cost: number
    cd: number
    hp: number
    isPlantableAtStart: boolean
    shapeFactory?: (entity: PlantEntity) => ShapeComp
    animes: AnimeDefSet
}

export const PLANT_NAMES = [ 'pea_shooter', 'sunflower' ] as const
export type PlantId = typeof PLANT_NAMES[number]

export const PLANTS = {
    pea_shooter: PeaShooterEntity,
    sunflower: SunflowerEntity,
} as Record<PlantId, typeof PlantEntity & PlantMetadata>

export const plantTextures = useTextures('plants', PLANTS)
