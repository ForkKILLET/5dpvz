import { CursorComp } from '@/comps/Cursor'
import { Scene } from '@/engine'
import { TextureEntity } from '@/entities/Texture'
import { PlayScene } from '@/scenes/Play'

export class StartScene extends Scene {
    constructor() {
        const background = TextureEntity.createTextureFromImage(
            './assets/start.png',
            {},
            { position: { x: 0, y: 0 }, zIndex: 0 },
        )

        const startButton = TextureEntity
            .createButtonFromImage(
                './assets/start_button_start.png',
                {},
                {
                    position: { x: 450, y: 140 },
                    zIndex: 1,
                }
            )
            .addComp(CursorComp, 'pointer')
            .on('before-render', () => {
                this.game.ctx.filter = startButton.state.hovering ? 'brightness(1.2)' : ''
            })
            .on('click', () => {
                this.deactivate()
                this.game.addScene(new PlayScene())
            })

        const githubButton = TextureEntity
            .createButtonFromImage(
                './assets/github.png',
                {},
                {
                    position: { x: 10, y: 10 },
                    zIndex: 1,
                },
            )
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
