import { EntityState, positionAdd } from '@/engine'
import { kProcess } from '@/entities/Process'
import { CursorComp } from '@/comps/Cursor'
import { LifeComp } from '@/comps/Life'
import { FilterComp } from '@/comps/Filter'
import { ButtonLikeEvents } from '@/comps/Button'
import { TextureConfig, TextureEntity, TextureEvents, TextureState } from '@/entities/Texture'
import { HoverableComp } from '@/comps/Hoverable'
import { MotionComp } from '@/comps/Motion'
import { TransitionComp } from '@/comps/Transition'

interface SunUniqueConfig {
    sun: number
}
interface SunConfig extends SunUniqueConfig, TextureConfig {}

interface SunUniqueState {}
interface SunState extends SunUniqueState, TextureState {
    collected: boolean
}

interface SunEvents extends TextureEvents, ButtonLikeEvents {}

export class SunEntity extends TextureEntity<SunConfig, SunState, SunEvents> {
    static sunLife = 8000
    static sunDangerousLife = 3000

    constructor(config: SunConfig, state: SunState) {
        super(config, state)
        this
            .addComp(HoverableComp)
            .addComp(CursorComp, 'pointer')
            .addComp(FilterComp)
            .on('attach', () => this
                .on('click', () => this.collect())
                .on('mouseenter', () => {
                    if (this.state.collected) return
                    this.withComp(FilterComp, (({ state: { filters } }) => {
                        filters.hover = 'brightness(1.2)'
                    }))
                })
                .on('mouseleave', () => {
                    if (this.state.collected) return
                    this.withComp(FilterComp, (({ state: { filters } }) => {
                        filters.hover = null
                    }))
                })
                .on('before-render', () => {
                    const life = this.getComp(LifeComp)
                    this.game.ctx.globalAlpha = life && life.state.life < SunEntity.sunDangerousLife
                        ? 0.5 + 0.25 * Math.cos(2 * Math.PI * life.state.life / 1000)
                        : 0.75
                })
            )
    }

    static createSun(config: SunUniqueConfig, state: EntityState) {
        return SunEntity.createButtonFromImage(
            './assets/sun.png',
            {
                origin: 'center',
                ...config,
            },
            {
                ...state,
                collected: false,
            }
        )
    }

    collect() {
        if (this.state.collected) return
        this.state.collected = true

        const process = this.inject(kProcess)!
        process.state.sun += this.config.sun
        process.updatePlantSlot(false)

        const sunSlotPosition = positionAdd(
            this.inject(kProcess)!.state.position,
            { x: 6 + 40, y: 6 + 40 }
        )
        const motion = this.game.motion.linearTo(
            { time: 500 },
            this.state.position,
            sunSlotPosition
        )
        this
            .removeComp(LifeComp)
            .removeComp(MotionComp)
            .addRawComp(MotionComp.create(this, { motion }, { frame: 0 }))
            .withComp(MotionComp, ({ emitter }) => emitter
                .on('motion-finish', entity => {
                    entity.dispose()
                    process
                        .ui.sunSlot.sunImage
                        .withComp(TransitionComp, transition => {
                            transition.start('pingpong', { resetDirection: true })
                        })
                })
            )
    }

    settle() {
        this.addComp(LifeComp, SunEntity.sunLife)
    }
}
