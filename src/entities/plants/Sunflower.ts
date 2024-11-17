import { definePlant, PlantConfig, PlantEntity, PlantState } from '@/entities/plants/Plant'
import { kAttachToLevel, kLevelState } from '@/entities/Level'
import { ButtonUniqueState } from '@/entities/Button'
import { FilterComp } from '@/comps/Filter'
import { SunEntity } from '../Sun'
import { random } from '@/utils'
import { UpdaterComp } from '@/comps/Updater'

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
    static readonly sunProduceInterval = 15000

    static initState: <S>(state: S) => S & SunflowerUniqueState & ButtonUniqueState = state => ({
        ...super.initState(state),
        sunProduceTimer: 0,
    })

    constructor(config: SunflowerConfig, state: SunflowerState) {
        super(config, state)
    }

    update() {
        const sunProduceEta = this.updateTimer(
            'sunProduceTimer',
            { interval: SunflowerEntity.sunProduceInterval },
            () => {
                const levelState = this.inject(kLevelState)!
                const attachToLevel = this.inject(kAttachToLevel)!

                const { x: x0, y: y0 } = this.state.position
                const startOffsetX = random(- 5, + 5)
                const startX = x0 + 40 + startOffsetX
                const startY = y0 + 40 + random(- 5, + 5)

                const symbolX = Math.sign(startOffsetX)
                const topDeltaX = random(5, 20)
                const topDeltaY = - random(40, 50)
                const targetDeltaY = random(5, 20)
                const a = - topDeltaY / topDeltaX ** 2
                const targetDeltaX = Math.sqrt((targetDeltaY - topDeltaY) / a)
                const deltaX = topDeltaX + targetDeltaX
                const v = 90 / 1000
                const totalT = (targetDeltaY - 2 * topDeltaY) / v
                const totalF = Math.round(totalT / this.game.mspf)
                const stepX = deltaX / totalF

                let f = 0
                let x = - topDeltaX
                let y = - topDeltaY

                attachToLevel(SunEntity
                    .create(
                        {
                            sun: 25,
                            life: 4000 + totalT,
                        },
                        {
                            position: { x: startX, y: startY },
                            zIndex: levelState.zIndex + 4,
                        }
                    )
                    .addComp(UpdaterComp, entity => {
                        if (f === totalF) return
                        f ++
                        const newX = x + stepX
                        const newY = a * newX ** 2
                        const delta = { x: symbolX * (newX - x), y: newY - y }
                        console.log(x, y)
                        x = newX
                        y = newY
                        entity.updatePosition(delta)
                    })
                )
            }
        )
        this.withComp(FilterComp, filterComp => {
            filterComp.filters['nearProduce'] = sunProduceEta < 1000
                ? `brightness(${ 1.5 - 0.5 * sunProduceEta / 1000 })`
                : null
        })
    }
})

