import { Game } from '@/engine'
import { StartScene } from '@/scenes/Start'
import { PlayScene } from '@/scenes/Play'

void async function() {
    const canvas = document.querySelector<HTMLCanvasElement>('#game')!
    const ctx = canvas.getContext('2d')!

    const game = new Game({
        ctx,
        fps: 60
    })

    await Promise.all([
        game.addScene(new StartScene()),
        game.addScene(new PlayScene().deactivate())
    ])

    game.start()

    Object.assign(window, { game })
}()