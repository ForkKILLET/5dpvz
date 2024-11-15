import { CursorComp } from '@/comps/Cursor'
import { HoverableComp } from '@/comps/Hoverable'
import { ShapeComp } from '@/comps/Shape'
import { Emitter, Entity, Events, ImageManager, Mouse, Scene, useImageManager, useMouse } from '@/engine'
import { by, remove } from '@/utils'
import { loadDebugWindow } from '@/debug'
import { Keyboard, KeyboardEvents, useKeyboard } from '@/engine/keyboard'

export interface GameConfig {
    ctx: CanvasRenderingContext2D
    fps: number
}

export interface RenderJob {
    zIndex: number
    renderer: () => void
}

export interface GameEvents extends KeyboardEvents, Events {
    hoverTargetChange: [ Entity | null ]
    click: [ Entity | null, MouseEvent ]
    rightclick: [ Entity | null, MouseEvent ]

    entityStart: [ Entity ]
    entityDispose: [ Entity ]
    entityAttach: [ Entity ]
    entityActivate: [ Entity ]
    entityDeactivate: [ Entity ]
}

export class Game {
    readonly ctx: CanvasRenderingContext2D
    readonly imageManager: ImageManager
    readonly mouse: Mouse
    readonly keyboard: Keyboard

    mspf: number

    allEntities: Entity[] = []
    scenes: Scene[] = []

    emitter = new Emitter<GameEvents>()

    private renderJobs: RenderJob[] = []
    addRenderJob(job: RenderJob) {
        this.renderJobs.push(job)
    }

    hoveringEntity: Entity | null = null

    private loopTimerId: number | null = null
    get running() {
        return this.loopTimerId !== null
    }

    loop() {
        const activeScenes = this.scenes.filter(scene => scene.active)

        activeScenes.forEach(scene => scene.runUpdate())

        const oldHoveringEntity = this.hoveringEntity
        this.hoveringEntity = null

        const hoverableEntities = this.allEntities
            .filter(entity => entity.started && entity.deepActive && entity.hasComp(HoverableComp))
            .sort(by(entity => - entity.state.zIndex))

        let isCursorSet = false
        for (const entity of hoverableEntities) {
            const shapeComp = entity.getComp(ShapeComp)!
            const hoverableComp = entity.getComp(HoverableComp)!

            const hovering = ! this.hoveringEntity && shapeComp.contains(this.mouse.position)
            if (hovering) {
                this.hoveringEntity = entity
                entity.withComp(CursorComp, cursorComp => {
                    this.ctx.canvas.style.cursor = cursorComp.cursor
                    isCursorSet = true
                })
            }

            if (hoverableComp.hovering !== hovering) {
                hoverableComp.emitter.emit(hovering ? 'mouseenter' : 'mouseleave')
                hoverableComp.hovering = hovering
            }
        }

        if (! isCursorSet) this.ctx.canvas.style.cursor = ''

        if (oldHoveringEntity !== this.hoveringEntity)
            this.emitter.emit('hoverTargetChange', this.hoveringEntity)

        this.renderJobs = []
        activeScenes.forEach(scene => scene.runRender())
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
        this.renderJobs
            .sort(by(job => job.zIndex))
            .forEach(job => {
                this.ctx.save()
                job.renderer()
                this.ctx.restore()
            })
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
        this.keyboard = useKeyboard()
        this.mspf = 1000 / fps

        const floor = new class Floor extends Scene {
            constructor() {
                super([])
                this.addComp(ShapeComp, () => true)
                    .addComp(HoverableComp)
            }
        }
        this.addScene(floor)

        this.mouse.emitter.onSome([ 'click', 'rightclick' ], (event, ev) => {
            if (! this.running) return

            const target = this.hoveringEntity
            if (! target) return

            let stopped = false
            target.getComp(HoverableComp)!.emitter.emit(event, {
                stop: () => {
                    stopped = true
                },
            })
            if (! stopped) this.emitter.emit(event, target, ev)
        })

        this.emitter.forward(this.keyboard.emitter, [ 'keydown', 'keyup', 'keypress' ])

        if (new URLSearchParams(location.search).has('debug')) {
            loadDebugWindow(this)
        }
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

    getEntityById(id: number) {
        return this.allEntities.find(entity => entity.id === id)
    }
}
