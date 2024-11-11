import { Scene } from '@/engine'
import { ButtonEntity } from '@/entities/button'
import { ImageEntity } from '@/entities/image'
import { PlayScene } from '@/scenes/play'

export class StartScene extends Scene {
    constructor() {
        const background = new ImageEntity(
            { src: './assets/start.png' },
            { position: { x: 0, y: 0 }, zIndex: 0 }
        )

        const buttonStart = new ButtonEntity(
            { src: './assets/start_button_start.png' },
            ButtonEntity.initState({
                position: { x: 450, y: 140 },
                zIndex: 1
            })
        )
        buttonStart.on('before-render', ({ game, state }) => {
            game.ctx.filter = state.hovering ? 'brightness(1.2)' : ''
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