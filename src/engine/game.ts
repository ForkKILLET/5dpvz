import { HoverableComp } from '@/comps/Hoverable'
import { ShapeComp } from '@/comps/Shape'
import { Emitter, Entity, Events, ImageManager, Mouse, Scene, useImageManager, useMouse } from '@/engine'
import { by, remove } from '@/utils'

export interface GameConfig {
    ctx: CanvasRenderingContext2D
    fps: number
}

export interface RenderJob {
    zIndex: number
    renderer: () => void
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
            .filter(entity => entity.started && entity.deepActive && entity.hasComp(HoverableComp))
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
            .forEach(job => job.renderer())
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
        scene.runStart(this).afterStart(() => {
            this.scenes.push(scene)
        })
    }
    removeScene(scene: Scene) {
        remove(this.scenes, s => s === scene)
        scene.dispose()
    }
    selectScene<E extends Scene>(Scene: new () => E): E | undefined {
        return this.scenes.find((scene): scene is E => scene instanceof Scene)
    }
    selectAllScenes<E extends Scene>(Scene: new () => E): E[] {
        return this.scenes.filter((entity): entity is E => entity instanceof Scene)
    }

    _printEntityTree({ zIndex = false }: { zIndex?: boolean } = {}) {
        const showEntityTree = (entity: Entity, depth: number): string => {
            const indention = ' '.repeat(depth * 3)
            return `${indention}${entity.constructor.name} #${entity.id}${ zIndex ? ` (z=${entity.state.zIndex})` : ''}`
                + entity.attachedEntities
                    .map(entity => `\n${ showEntityTree(entity, depth + 1) }`)
                    .join('')
        }
        console.log(this.scenes.map(scene => showEntityTree(scene, 0)).join('\n'))
    }

    _getEntityById(id: number): Entity | undefined {
        return this.allEntities.find(entity => entity.id === id)
    }
}