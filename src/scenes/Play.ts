import { CursorComp } from '@/comps/Cursor'
import { Stage1_1 } from '@/data/stages'
import { Scene } from '@/engine'
import { ProcessEntity } from '@/entities/Process'
import { SpacetimeEntity } from '@/entities/Spacetime'
import { TextureEntity } from '@/entities/Texture'

export class PlayScene extends Scene {

    constructor() {
        super()

        const spacetime = SpacetimeEntity
            .createSpacetime({ stage: Stage1_1 }, { pos: { x: 0, y: 0 }, zIndex: 0 })
            .attachTo(this)

        const pause = () => {
            spacetime.processes.forEach(process => process.state.paused = true)
            spacetime.bgmPlayBack?.toggleEffect()
            pauseButton.deactivate()
            resumeButton.activate()
        }

        const resume = () => {
            spacetime.processes.forEach(process => process.state.paused = false)
            spacetime.bgmPlayBack?.toggleEffect()
            resumeButton.deactivate()
            pauseButton.activate()
        }

        this.game.on('keydown', (ev: KeyboardEvent) => {
            if (ev.key === 'Escape') {
                if (spacetime.currentProcess.state.paused) resume()
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
            .on('click', () => spacetime.forkProcess())
    }
}
