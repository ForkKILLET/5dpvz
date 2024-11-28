// import { easeOutExpo } from '@/engine'
import { definePlant, PlantConfig, PlantEntity, PlantEvents, PlantState } from '@/entities/plants/Plant'
import { kProcess } from '@/entities/Process'
import { SunEntity } from '@/entities/Sun'
import { FilterComp } from '@/comps/Filter'
import { StrictOmit } from '@/utils'
import { PLANTS } from '@/data/plants'
import { RngComp } from '@/comps/Rng'
import { MotionComp } from '@/comps/Motion'
import { UpdaterComp } from '@/comps/Updater'
import { FrameState, easeOutExpo } from '@/engine'

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

    constructor(
        config: PlantConfig,
        state: StrictOmit<SunflowerState, 'sunProduceTimer'>
    ) {
        super(config, {
            sunProduceTimer: 0,
            ...state,
        })
    }

    produceSun() {
        const process = this.inject(kProcess)!
        const rng = process.getComp(RngComp)!

        const { x: x0, y: y0 } = this.state.position
        const startOffsetX = rng.random(- 5, + 5)
        const startX = x0 + 40 + startOffsetX
        const startY = y0 + 40 + rng.random(- 5, + 5)
        const signX = startOffsetX >= 0 ? 1 : - 1
        const x1 = - signX * rng.random(10, 20)
        const x2 = signX * (5 + rng.random(10, 20))

        const { motion, totalFrame } = this.game.motion.parabola(0.1, 0.001, x1, x2)

        SunEntity
            .createSun(
                { sun: 25 },
                {
                    position: { x: startX, y: startY },
                    zIndex: process.state.zIndex + 4,
                }
            )
            .addLazyComp(sun => MotionComp.create(sun, { motion }, { frame: 0 }))
            .addComp(UpdaterComp, sun => {
                sun.withComp(MotionComp<FrameState>, ({ state }) => {
                    sun.state.scale = easeOutExpo(state.frame / totalFrame)
                })
            })
            .withComp(MotionComp, ({ emitter }) => {
                emitter.on('motion-finish', sun => sun.as<SunEntity>().settle())
            })
            .attachTo(process)
    }

    update() {
        super.update()

        const sunProduceEta = this.updateTimer(
            'sunProduceTimer',
            { interval: SunflowerEntity.sunProduceInterval },
            () => this.produceSun()
        )
        this.withComp(FilterComp, ({ state: { filters } }) => {
            filters.nearProduce = sunProduceEta < 1000
                ? `brightness(${ 1.5 - 0.5 * sunProduceEta / 1000 })`
                : null
        })
    }
})

