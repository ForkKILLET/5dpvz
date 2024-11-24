import { easeOutExpo } from '@/engine'
import { definePlant, PlantConfig, PlantEntity, PlantEvents, PlantState } from '@/entities/plants/Plant'
import { kProcess } from '@/entities/Process'
import { SunEntity } from '@/entities/Sun'
import { FilterComp } from '@/comps/Filter'
import { UpdaterComp } from '@/comps/Updater'
import { StrictOmit } from '@/utils'
import { PLANTS } from '@/data/plants'
import { RngComp } from '@/utils/rng'

void PLANTS

export interface SunflowerUniqueState {
    sunProduceTimer: number
}
export interface SunflowerState extends SunflowerUniqueState, PlantState {}

export interface SunflowerEvents extends PlantEvents {}

export const SunflowerEntity = definePlant(class SunflowerEntity extends PlantEntity<SunflowerState> {
    static readonly id = 'sunflower'
    static readonly desc = 'Sunflower'
    static readonly cost = 50
    static readonly cd = 7500
    static readonly hp = 300
    static readonly isPlantableAtStart = true
    static readonly animes = {
        common: { fpaf: 8, frameNum: 12 },
    }
    static readonly sunProduceInterval = 15000

    constructor(config: PlantConfig, state: StrictOmit<SunflowerState, 'sunProduceTimer'>) {
        super(config, {
            sunProduceTimer: 0,
            ...state,
        })
    }

    update() {
        super.update()

        const sunProduceEta = this.updateTimer(
            'sunProduceTimer',
            { interval: SunflowerEntity.sunProduceInterval },
            () => {
                const process = this.inject(kProcess)!

                const rng = process.getComp(RngComp)!
                const { x: x0, y: y0 } = this.state.position
                const startOffsetX = rng.random(- 5, + 5)
                const startX = x0 + 40 + startOffsetX
                const startY = y0 + 40 + rng.random(- 5, + 5)

                const symbolX = Math.sign(startOffsetX)
                const topDeltaX = rng.random(5, 20)
                const topDeltaY = - rng.random(40, 50)
                const targetDeltaY = rng.random(5, 20)
                const a = - topDeltaY / topDeltaX ** 2
                const targetDeltaX = Math.sqrt((targetDeltaY - topDeltaY) / a)
                const deltaX = topDeltaX + targetDeltaX
                const v = 90 / 1000
                const totalT = (targetDeltaY - 2 * topDeltaY) / v
                const totalF = Math.round(totalT / this.game.mspf)
                const stepX = deltaX / totalF

                // TODO: closure to state
                let f = 0
                let x = - topDeltaX
                let y = - topDeltaY

                SunEntity
                    .createSun(
                        {
                            sun: 25,
                            life: 4000 + totalT,
                        },
                        {
                            position: { x: startX, y: startY },
                            zIndex: process.state.zIndex + 4,
                        }
                    )
                    .addComp(UpdaterComp, entity => {
                        if (f === totalF) return
                        f ++
                        const newX = x + stepX
                        const newY = a * newX ** 2
                        const delta = { x: symbolX * (newX - x), y: newY - y }
                        x = newX
                        y = newY
                        entity.updatePosition(delta)
                        entity.state.scale = easeOutExpo(f / totalF)
                    })
                    .attachTo(process)
            }
        )
        this.withComp(FilterComp, ({ state: { filters } }) => {
            filters['nearProduce'] = sunProduceEta < 1000
                ? `brightness(${ 1.5 - 0.5 * sunProduceEta / 1000 })`
                : null
        })
    }
})

