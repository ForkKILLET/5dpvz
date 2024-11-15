import { definePlant, PlantEntity } from '@/entities/plants/Plant'

export const PeaShooterEntity = definePlant(class PeaShooterEntity extends PlantEntity {
    static readonly id = 'pea_shooter'
    static readonly name = 'Pea Shooter'
    static readonly cost = 100
    static readonly cd = 7500
    static readonly hp = 300
    static readonly isPlantableAtStart = true
    static readonly animations = {
        common: { fpaf: 8, frameNum: 12 },
    }
})
