import { EntityState } from '@/engine'
import { kLevel } from '@/entities/Level'
import { CursorComp } from '@/comps/Cursor'
import { LifeComp } from '@/comps/Life'
import { FilterComp } from '@/comps/Filter'
import { ButtonEvents } from '@/comps/Button'
import { TextureConfig, TextureEntity, TextureEvents, TextureState } from '@/entities/Texture'
import { HoverableComp } from '@/comps/Hoverable'

interface SunUniqueConfig {
    life: number
    sun: number
}
interface SunConfig extends SunUniqueConfig, TextureConfig {}

interface SunUniqueState {}
interface SunState extends SunUniqueState, TextureState {}

interface SunEvents extends TextureEvents, ButtonEvents {}

export class SunEntity extends TextureEntity<SunConfig, SunState, SunEvents> {
    constructor(config: SunConfig, state: SunState) {
        super(config, state)
        this
            .addComp(LifeComp, config.life)
            .addComp(HoverableComp)
            .addComp(CursorComp, 'pointer')
            .addComp(FilterComp)
            .on('attach', () => {
                const level = this.inject(kLevel)!
                this
                    .on('click', () => {
                        level.state.sun += this.config.sun
                        level.updatePlantSlot(false)
                        // TODO: animation
                        this.dispose()
                    })
                    .on('mouseenter', () => {
                        this.withComp(FilterComp, (({ state: { filters } }) => {
                            filters.hover = 'brightness(1.2)'
                        }))
                    })
                    .on('mouseleave', () => {
                        this.withComp(FilterComp, (({ state: { filters } }) => {
                            filters.hover = null
                        }))
                    })
                    .on('before-render', () => {
                        this.withComp(LifeComp, ({ state: { life } }) => {
                            this.game.ctx.globalAlpha = life < 3000
                                ? 0.5 + 0.25 * Math.cos(2 * Math.PI * life / 1000)
                                : 0.75
                        })
                    })
            })
    }

    static createSun(config: SunUniqueConfig, state: EntityState) {
        return SunEntity.createButtonFromImage(
            './assets/sun.png',
            {
                origin: 'center',
                ...config,
            },
            state
        )
    }
}
