import { definePlant, PlantConfig, PlantEntity, PlantState } from '@/entities/plants/Plant'
import { kLevelState } from '@/entities/Level'
import { ButtonUniqueState } from '@/entities/Button'

export interface SunflowerConfig extends PlantConfig {}

export interface SunflowerUniqueState {
    sunProduceTimer: number
}
export interface SunflowerState extends SunflowerUniqueState, PlantState {}

export const SunflowerEntity = definePlant(class SunflowerEntity extends PlantEntity<
    SunflowerConfig, SunflowerState
> {
    static readonly id = 'sunflower'
    static readonly name = 'Sunflower'
    static readonly cost = 50
    static readonly cd = 7500
    static readonly hp = 300
    static readonly isPlantableAtStart = true
    static readonly animations = {
        common: { fpaf: 8, frameNum: 12 },
    }

    static initState: <S>(state: S) => S & SunflowerUniqueState & ButtonUniqueState = state => ({
        ...super.initState(state),
        sunProduceTimer: 0,
    })

    constructor(config: SunflowerConfig, state: SunflowerState) {
        super(config, state)
    }

    update() {
        this.useTimer('sunProduceTimer', 15000, () => {
            const levelState = this.inject(kLevelState)!
            levelState.sun += 25 // TODO: add sun entity
        })
        return this.state
    }
})

