import { ImageManager, Mouse, Scene, useImageManager, useMouse } from '@/engine'

export interface GameConfig {
    ctx: CanvasRenderingContext2D
    fps: number
}

export class Game {
    readonly ctx: CanvasRenderingContext2D
    readonly imageManager: ImageManager
    readonly mouse: Mouse
    readonly mspf: number

    scenes: Scene[] = []

    constructor({ ctx, fps }: GameConfig) {
        this.ctx = ctx
        this.imageManager = useImageManager()
        this.mouse = useMouse(ctx)
        this.mspf = 1000 / fps
    }

    private loopTimerId: number | null = null
    private loop() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
        const activeScenes = this.scenes.filter(scene => scene.active)
        activeScenes.forEach(scene => scene.render())
    }

    start() {
        this.loopTimerId = setInterval(() => this.loop(), this.mspf)
    }
    pause() {
        if (this.loopTimerId !== null) clearInterval(this.loopTimerId)
    }

    async addScene(scene: Scene) {
        await scene.start(this)
        this.scenes.push(scene)
    }
    removeScene(sceneId: number) {
        const sceneIndex = this.scenes.findIndex(scene => scene.id === sceneId)
        if (sceneIndex >= 0) {
            const [ removedScene ] = this.scenes.splice(sceneIndex, 1)
            removedScene.dispose()
        }
    }
    selectScene<Sc extends Scene>(SceneCtor: new () => Sc): Sc | undefined {
        return this.scenes.find((scene): scene is Sc => scene instanceof SceneCtor)
    }
    selectManyScene<Sc extends Scene>(SceneCtor: new () => Sc): Sc[] {
        return this.scenes.filter((scene): scene is Sc => scene instanceof SceneCtor)
    }
}