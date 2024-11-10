import { Game } from '@/engine'
import { StartScene } from '@/scenes/start'

const canvas = document.querySelector<HTMLCanvasElement>('#game')!
const ctx = canvas.getContext('2d')!

const game = new Game({
    ctx,
    fps: 60
})

await game.addScene(new StartScene().activate())

game.start()