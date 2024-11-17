import { EntityState } from '@/engine'
import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from '@/entities/Button'
import { ImageEntity } from '@/entities/Image'
import { kLevelState } from '@/entities/Level'
import { CursorComp } from '@/comps/Cursor'
import { LifeComp } from '@/comps/Life'

interface SunUniqueConfig {
    life: number
    sun: number
}
interface SunConfig extends SunUniqueConfig, ButtonConfig {}

interface SunUniqueState {}
interface SunState extends SunUniqueState, ButtonState {}

interface SunEvents extends ButtonEvents {}

export class SunEntity extends ButtonEntity<SunConfig, SunState, SunEvents> {
    constructor(config: SunConfig, state: SunState) {
        super(config, state)
        this
            .addComp(LifeComp, config.life)
            .addComp(CursorComp, 'pointer')
            .on('attached', () => {
                const levelState = this.inject(kLevelState)!
                this
                    .on('click', () => {
                        levelState.sun += this.config.sun
                        this.dispose()
                    })
                    .on('before-render', () => {
                        this.withComp(LifeComp, ({ life }) => {
                            this.game.ctx.globalAlpha = life < 3000
                                ? 0.5 + 0.25 * Math.cos(2 * Math.PI * life / 1000)
                                : 0.75
                        })
                    })
            })
    }

    static create(config: SunUniqueConfig, state: EntityState) {
        return SunEntity.from(
            ImageEntity.create(
                {
                    src: './assets/sun.png',
                    center: true,
                },
                state,
            ),
            {
                containingMode: 'rect',
                ...config,
            },
        )
    }
}
