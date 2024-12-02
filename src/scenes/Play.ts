import { AudioPlayback, Scene } from '@/engine'
import { ProcessEntity } from '@/entities/Process'
import { Stage1_1 } from '@/data/stages'
import { CursorComp } from '@/comps/Cursor'
import { TextureEntity } from '@/entities/Texture'
import { placeholder } from '@/utils'

export class PlayScene extends Scene {
    bgmPlayBack: AudioPlayback = placeholder

    constructor() {
        super()

        const getProcessById = (processId: number) => processes.find(process => process.config.processId === processId)

        const switchProcess = (currentProcessId: number) => {
            const nextProcess = getProcessById(currentProcessId + 1) ?? (currentProcessId === 0 ? undefined : process0)
            if (! nextProcess) return
            getProcessById(currentProcessId)!.deactivate()
            currentProcess = nextProcess.activate()
        }

        const process0 = ProcessEntity
            .createProcess(
                {
                    processId: 0,
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
                        sunDroppingSpeed: 30 / 1000,
                        sunLife: 8000,
                        sunAtStart: 200,
                    },
                    shovelSlot: {
                        shovelId: 'iron_shovel',
                    },
                    stage: Stage1_1,
                },
                {
                    pos: { x: 0, y: 0 },
                    zIndex: 0,
                }
            )
            .on('switch-process', switchProcess)
            .attachTo(this)

        const processes = [ process0 ]
        let currentProcess = process0

        this.afterStart(() => {
            this.bgmPlayBack = this.game.audioManager.playAudio(`./assets/audio/${ Stage1_1.bgm }.mp3`) // TODO: better
        })

        const pause = () => {
            processes.forEach(process => process.state.paused = true)
            this.bgmPlayBack?.toggleEffect()
            pauseButton.deactivate()
            resumeButton.activate()
        }

        const resume = () => {
            processes.forEach(process => process.state.paused = false)
            this.bgmPlayBack?.toggleEffect()
            resumeButton.deactivate()
            pauseButton.activate()
        }

        this.game.on('keydown', (ev: KeyboardEvent) => {
            if (ev.key === 'Escape') {
                if (currentProcess.state.paused) resume()
                else pause()
            }
        })

        const pauseButton = TextureEntity
            .createButtonFromImage(
                './assets/ui/pause_button.png',
                {},
                {
                    pos: { x: ProcessEntity.width - 32, y: 5 },
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
                    pos: { x: ProcessEntity.width - 32, y: 5 },
                    zIndex: this.state.zIndex + 11,
                },
            )
            .addComp(CursorComp, 'pointer')
            .deactivate()
            .attachTo(this)
            .on('click', resume)

        TextureEntity
            .createButtonFromImage(
                './assets/ui/fork_button.png',
                {},
                {
                    pos: { x: ProcessEntity.width - 64 - 5, y: 5 },
                    zIndex: this.state.zIndex + 11,
                },
            )
            .addComp(CursorComp, 'pointer')
            .attachTo(this)
            .on('click', () => {
                const processIds = processes.map(process => process.config.processId).filter(id => id >= 0)
                const newProcessId = Math.max(...processIds) + 1
                currentProcess.deactivate()
                currentProcess = currentProcess.cloneEntity().on('switch-process', switchProcess)
                currentProcess.config.processId = newProcessId
                processes.push(currentProcess.attachTo(this))
            })
    }

    async start() {
        await super.start()
        await this.game.audioManager.loadAudio(`./assets/audio/${ Stage1_1.bgm }.mp3`) // TODO: better
    }
}
