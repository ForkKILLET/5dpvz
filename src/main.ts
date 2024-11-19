import { Game } from '@/engine'

import { ZOMBIE_METADATA, zombieAnimation } from '@/data/zombies'
import { PLANT_METADATA, plantAnimation } from '@/data/plants'
import { shovelAnimation } from '@/data/shovels'

import { LoadingScene } from '@/scenes/Loading'

void ZOMBIE_METADATA
void PLANT_METADATA

void async function() {
    const canvas = document.querySelector<HTMLCanvasElement>('#game')!
    const ctx = canvas.getContext('2d')!

    const game = new Game({
        ctx,
        fps: 60,
    })

    const preloadImgSrcs: string[] = [
        './assets/start.png',
        './assets/start_button_start.png',
        './assets/github.png',

        './assets/ui/pause_button.png',
        './assets/ui/resume_button.png',

        './assets/sun.png',

        './assets/lawn/light.png',
        './assets/lawn/dark.png',

        ...zombieAnimation.getAllSrcs(),
        ...plantAnimation.getAllSrcs(),
        ...shovelAnimation.getAllSrcs(),
    ]

    const preloadAudioSrcs: string[] = [
        './assets/audio/day.mp3',
    ]

    preloadImgSrcs.forEach(game.imageManager.loadImage)
    preloadAudioSrcs.forEach(game.audioManager.loadAudio)

    game.addScene(new LoadingScene())

    game.start()

    Object.assign(window, { game })
}()
