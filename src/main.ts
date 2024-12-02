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
    const $about = document.querySelector<HTMLDivElement>('#about')!
    const buildTime = import.meta.env.VITE_BUILD_TIME ?? 'now'
    const buildEnv = import.meta.env.VITE_BUILD_ENV ?? 'local'
    const [ commitHash, commitMsg ] = import.meta.env.VITE_LAST_COMMIT?.split(/(?<! .*) /) ?? []
    const repoUrl = 'https://github.com/ForkKILLET/5dPvZ'
    $about.innerHTML = `
        <b>5DPvZ</b> built at <b>${ buildTime }</b> on <b>${ buildEnv }</b>
        by <a href="https://github.com/ForkKILLET/" target="_blank">ForkKILLET</a>
        &amp; <a href="https://github.com/Luna5akura" target="_blank">Luna5akura</a> with &lt;3 <br />
        ${ commitHash
                ? `<a href="${ repoUrl }/commit/${ commitHash }" target="_blank">${ commitHash }</a>: ${ commitMsg }`
                : ''
        }
    `

    const canvas = document.querySelector<HTMLCanvasElement>('#game')!
    const ctx = canvas.getContext('2d')!

    const searchParams = new URLSearchParams(location.search)
    const isDebug = searchParams.has('debug')

    const game = new Game({
        ctx,
        fps: 60,
        isDefault: true,
        isDebug,
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

    const preloadAudioSrcs: string[] = [
        './assets/audio/day.mp3',
    ]

    preloadImgSrcs.forEach(game.imageManager.loadImage)
    preloadAudioSrcs.forEach(game.audioManager.loadAudio)

    game.addScene(new LoadingScene())

    game.start()

    Object.assign(window, { game })
}()
