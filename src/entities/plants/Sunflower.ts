import { easeOutExpo } from '@/engine'
import { definePlant, PlantConfig, PlantEntity, PlantEvents, PlantState } from '@/entities/plants/Plant'
import { kProcess } from '@/entities/Process'
import { SunEntity } from '@/entities/Sun'
import { FilterComp } from '@/comps/Filter'
import { UpdaterComp } from '@/comps/Updater'
import { placeholder, StrictOmit } from '@/utils'
import { PLANTS } from '@/data/plants'
import { RngComp } from '@/comps/Rng'

void PLANTS

export interface SunflowerUniqueState {
    sunProduceTimer: number
}
export interface SunflowerState extends SunflowerUniqueState, PlantState {
    sunProduceTransition: {
        f: number
        x: number
        y: number
    }
}

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

    constructor(
        config: PlantConfig,
        state: StrictOmit<SunflowerState, 'sunProduceTimer' | 'sunProduceTransition'>
    ) {
        super(config, {
            sunProduceTimer: 0,
            sunProduceTransition: placeholder,
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

                // TODO: extract to movement helper
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
                const totalF = Math.round(totalT / this.game.mspf0)
                const stepX = deltaX / totalF

                this.state.sunProduceTransition = {
                    f: 0,
                    x: - topDeltaX,
                    y: - topDeltaY,
                }

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
                        const trans = this.state.sunProduceTransition
                        if (trans.f === totalF) return
                        trans.f ++
                        const newX = trans.x + stepX
                        const newY = a * newX ** 2
                        const delta = { x: symbolX * (newX - trans.x), y: newY - trans.y }
                        trans.x = newX
                        trans.y = newY
                        entity.updatePosition(delta)
                        entity.state.scale = easeOutExpo(trans.f / totalF)
                    })
                    .attachTo(process)
            }
        )
        this.withComp(FilterComp, ({ state: { filters } }) => {
            filters.nearProduce = sunProduceEta < 1000
                ? `brightness(${ 1.5 - 0.5 * sunProduceEta / 1000 })`
                : null
        })
    }
})

