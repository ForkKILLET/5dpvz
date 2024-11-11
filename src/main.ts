import { Game } from '@/engine'
import { StartScene } from '@/scenes/start'
import { PlayScene } from './scenes/play'

const canvas = document.querySelector<HTMLCanvasElement>('#game')!
const ctx = canvas.getContext('2d')!

const game = new Game({
    ctx,
    fps: 60
})

await Promise.all([
    game.addScene(new StartScene().activate()),
    game.addScene(new PlayScene())
])

game.start()