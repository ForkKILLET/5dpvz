import { Game } from '@/engine'
import { ZOMBIES, zombieTextures } from '@/data/zombies'
import { BULLETS, bulletTextures } from '@/data/bullets'
import { PLANTS, plantTextures } from '@/data/plants'
import { shovelTextures } from '@/data/shovels'
import { LoadingScene } from '@/scenes/Loading'

void ZOMBIES
void BULLETS
void PLANTS

void async function() {
    const canvas = document.querySelector<HTMLCanvasElement>('#game')!
    const ctx = canvas.getContext('2d')!

    const searchParams = new URLSearchParams(location.search)
    const isDebug = searchParams.has('debug')
    const noAudio = searchParams.has('noaudio')

    const game = new Game({
        ctx,
        fps: 60,
        isDefault: true,
        isDebug,
        noAudio,
    })

    const preloadImgSrcs: string[] = [
        './assets/start.png',
        './assets/start_button_start.png',
        './assets/github.png',

        './assets/ui/pause_button.png',
        './assets/ui/resume_button.png',
        './assets/ui/fork_button.png',

        './assets/sun.png',

        './assets/lawn/light.png',
        './assets/lawn/dark.png',

        ...zombieTextures.getAllSrcs(),
        ...plantTextures.getAllSrcs(),
        ...bulletTextures.getAllSrcs(),
        ...shovelTextures.getAllSrcs(),
    ]

    const preloadAudioSrcs: string[] = noAudio ? [] : [
        './assets/audio/day.mp3',
    ]

    preloadImgSrcs.forEach(game.imageManager.loadImage)
    preloadAudioSrcs.forEach(game.audioManager.loadAudio)

    game.addScene(new LoadingScene())

    game.start()

    Object.assign(window, { game })
}()
