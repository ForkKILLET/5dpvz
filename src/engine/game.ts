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
        activeScenes.forEach(scene => {
            scene.runUpdate()
            scene.runRender()
        })
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
    selectScene<E extends Scene>(SceneCtor: new () => E): E | undefined {
        return this.scenes.find((entity): entity is E => entity instanceof SceneCtor)
    }
    selectScenes<E extends Scene>(SceneCtor: new () => E): E[] {
        return this.scenes.filter((entity): entity is E => entity instanceof SceneCtor)
    }
}