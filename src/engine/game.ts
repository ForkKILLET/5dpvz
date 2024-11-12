import { HoverableComp } from '@/comps/Hoverable'
import { ShapeComp } from '@/comps/Shape'
import { Emitter, Entity, Events, ImageManager, Mouse, Scene, useImageManager, useMouse } from '@/engine'
import { by } from '@/utils'

export interface GameConfig {
    ctx: CanvasRenderingContext2D
    fps: number
}

export interface RenderJob {
    zIndex: number
    render: () => void
}

export interface GameEvents extends Events {
    hoverTargetChange: [ Entity | null ]
    click: [ Entity | null ]
    rightclick: [ Entity | null ]
}

export class Game {
    readonly ctx: CanvasRenderingContext2D
    readonly imageManager: ImageManager
    readonly mouse: Mouse
    readonly mspf: number

    allEntities: Entity[] = []
    scenes: Scene[] = []

    emitter = new Emitter<GameEvents>()

    private renderJobs: RenderJob[] = []
    addRenderJob(job: RenderJob) {
        this.renderJobs.push(job)
    }

    hoveringEntity: Entity | null = null

    private get isRunning() {
        return this.loopTimerId !== null
    }

    private loopTimerId: number | null = null
    private loop() {
        const activeScenes = this.scenes.filter(scene => scene.active)

        activeScenes.forEach(scene => scene.runUpdate())

        let oldHoveringEntity = this.hoveringEntity
        this.hoveringEntity = null
        const hoverableEntities = this.allEntities
            .filter(entity => entity.deepActive && entity.hasComp(HoverableComp))
            .sort(by(entity => - entity.state.zIndex))

        for (const entity of hoverableEntities) {
            const shapeComp = entity.getComp(ShapeComp)!
            const hoverableComp = entity.getComp(HoverableComp)!

            const hovering = ! this.hoveringEntity && shapeComp.contains(this.mouse.position)
            if (hovering) this.hoveringEntity = entity

            if (hoverableComp.hovering !== hovering) {
                hoverableComp.emitter.emit(hovering ? 'mouseenter' : 'mouseleave')
                hoverableComp.hovering = hovering   
            }
        }

        if (oldHoveringEntity !== this.hoveringEntity)
            this.emitter.emit('hoverTargetChange', this.hoveringEntity)

        this.renderJobs = []
        activeScenes.forEach(scene => scene.runRender())
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
        this.renderJobs
            .sort(by(job => job.zIndex))
            .forEach(job => job.render())
    }

    start() {
        this.loopTimerId = setInterval(() => this.loop(), this.mspf)
    }
    pause() {
        if (this.loopTimerId !== null) clearInterval(this.loopTimerId)
    }

    constructor({ ctx, fps }: GameConfig) {
        this.ctx = ctx
        this.imageManager = useImageManager()
        this.mouse = useMouse(ctx)
        this.mspf = 1000 / fps

        this.mouse.emitter.onSome([ 'click', 'rightclick' ], (event) => {
            if (! this.isRunning) return

            const target = this.hoveringEntity
            if (! target) return

            target.getComp(HoverableComp)!.emitter.emit(event)
            this.emitter.emit(event, target)
        })
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
    selectScene<E extends Scene>(Scene: new () => E): E | undefined {
        return this.scenes.find((scene): scene is E => scene instanceof Scene)
    }
    selectScenes<E extends Scene>(Scene: new () => E): E[] {
        return this.scenes.filter((entity): entity is E => entity instanceof Scene)
    }
}