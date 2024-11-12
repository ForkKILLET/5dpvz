import { Scene } from '@/engine'
import { ButtonEntity } from '@/entities/Button'
import { ImageEntity } from '@/entities/Image'
import { PlayScene } from '@/scenes/Play'

export class StartScene extends Scene {
    constructor() {
        const background = new ImageEntity(
            { src: './assets/start.png' },
            { position: { x: 0, y: 0 }, zIndex: 0 }
        )

        const buttonStart = new ButtonEntity(
            {
                src: './assets/start_button_start.png',
                containingMode: 'strict'
            },
            ButtonEntity.initState({
                position: { x: 450, y: 140 },
                zIndex: 1
            })
        )
        buttonStart.on('before-render', () => {
            this.game.ctx.filter = buttonStart.state.hovering ? 'brightness(1.2)' : ''
        })
        buttonStart.on('click', () => {
            this.deactivate()
            this.game.selectScene(PlayScene)!.activate()
        })

        super([
            background,
            buttonStart,
        ])
    }
}