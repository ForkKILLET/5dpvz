import { CursorComp } from '@/comps/Cursor'
import { Scene } from '@/engine'
import { ButtonEntity } from '@/entities/Button'
import { ImageEntity } from '@/entities/Image'
import { PlayScene } from '@/scenes/Play'

export class StartScene extends Scene {
    constructor() {
        const background = new ImageEntity(
            { src: './assets/start.png' },
            { position: { x: 0, y: 0 }, zIndex: 0 },
        )

        const startButton = ButtonEntity.from(new ImageEntity(
            {
                src: './assets/start_button_start.png',
                containingMode: 'strict',
            },
            {
                position: { x: 450, y: 140 },
                zIndex: 1,
            },
        ))
            .addComp(CursorComp, 'pointer')
            .on('before-render', () => {
                this.game.ctx.filter = startButton.state.hovering ? 'brightness(1.2)' : ''
            })
            .on('click', () => {
                this.deactivate()
                this.game.selectScene(PlayScene)!.activate()
            })

        const githubButton = ButtonEntity.from(new ImageEntity(
            {
                src: './assets/github.png',
                containingMode: 'strict',
            },
            {
                position: { x: 10, y: 10 },
                zIndex: 1,
            },
        ))
            .addComp(CursorComp, 'pointer')
            .on('click', () => {
                window.open('https://github.com/ForkKILLET/5dpvz', '_blank')
            })

        super([
            background,
            startButton,
            githubButton,
        ])
    }
}
