import { AudioPlayback, Scene } from '@/engine'
import { ProcessEntity } from '@/entities/Process'
import { Stage1_1 } from '@/data/stages'
import { CursorComp } from '@/comps/Cursor'
import { TextureEntity } from '@/entities/Texture'
import { placeholder } from '@/utils'

// TODO: BGM config
const BGM = 'day'

export class PlayScene extends Scene {
    bgmPlayBack: AudioPlayback = placeholder

    constructor() {
        const process = ProcessEntity.create(
            {
                plantSlots: {
                    slotNum: 2,
                    plantIds: [ 'pea_shooter', 'sunflower' ],
                },
                lawn: {
                    width: 9,
                    height: 5,
                },
                sun: {
                    sunDroppingInterval: 10000,
                    firstSunDroppingTime: 6000,
                    sunDroppingVelocity: 30 / 1000,
                    sunLife: 8000,
                    sunAtStart: 200,
                },
                shovelSlot: {
                    shovelId: 'iron_shovel',
                },
                stage: Stage1_1,
            },
            {
                position: { x: 0, y: 0 },
                zIndex: 0,
            }
        )

        super([
            process,
        ])

        if (! this.game.config.noAudio) this.afterStart(() => {
            this.bgmPlayBack = this.game.audioManager.playAudio(`./assets/audio/${ BGM }.mp3`)
        })

        const pause = () => {
            process.state.paused = true
            this.bgmPlayBack?.toggleEffect()
            pauseButton.deactivate()
            resumeButton.activate()
        }

        const resume = () => {
            process.state.paused = false
            this.bgmPlayBack?.toggleEffect()
            resumeButton.deactivate()
            pauseButton.activate()
        }

        this.game.emitter.on('keydown', (ev: KeyboardEvent) => {
            if (ev.key === 'Escape') {
                if (process.state.paused) resume()
                else pause()
            }
        })

        const pauseButton = TextureEntity
            .createButtonFromImage(
                './assets/ui/pause_button.png',
                {},
                {
                    position: { x: process.width - 32, y: 5 },
                    zIndex: this.state.zIndex + 11,
                },
            )
            .addComp(CursorComp, 'pointer')
            .attachTo(this)
            .on('click', pause)

        const resumeButton = TextureEntity
            .createButtonFromImage(
                './assets/ui/resume_button.png',
                {},
                {
                    position: { x: process.width - 32, y: 5 },
                    zIndex: this.state.zIndex + 11,
                },
            )
            .addComp(CursorComp, 'pointer')
            .deactivate()
            .attachTo(this)
            .on('click', resume)
    }

    async start() {
        await super.start()
        if (! this.game.config.noAudio)
            await this.game.audioManager.loadAudio(`./assets/audio/${ BGM }.mp3`)
    }
}
