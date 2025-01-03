import { CursorComp } from '@/comps/Cursor'
import { HoverableComp } from '@/comps/Hoverable'
import { AnyShape, ShapeComp } from '@/comps/Shape'
import {
    Emitter, Entity, Scene, Events,
    AudioManager, useAudioManager, ImageManager, useImageManager, Mouse, useMouse,
    useMotion,
} from '@/engine'
import { by, eq, placeholder, remove } from '@/utils'
import { Keyboard, KeyboardEvents, useKeyboard } from '@/engine/keyboard'
import { loadDebugWindow } from '@/debug'

export interface GameConfig {
    ctx: CanvasRenderingContext2D
    fps: number
    isDefault: boolean
    isDebug?: boolean
    noAudio?: boolean
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
    static defaultGame: Game = placeholder

    constructor(public config: GameConfig) {
        if (config.isDefault) Game.defaultGame = this

        this.ctx = config.ctx
        this.imageManager = useImageManager()
        this.audioManager = useAudioManager(this)
        this.mouse = useMouse(this)
        this.keyboard = useKeyboard()
        this.motion = useMotion(this)
        this.mspf0 = this.mspf = 1000 / config.fps

        const floor = new class Floor extends Scene {
            constructor() {
                super()

                this
                    .addComp(AnyShape, { contains: () => true })
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

        if (config.isDebug) loadDebugWindow(this)
    }

    readonly ctx: CanvasRenderingContext2D
    readonly imageManager: ImageManager
    readonly audioManager: AudioManager
    readonly mouse: Mouse
    readonly keyboard: Keyboard
    readonly motion: ReturnType<typeof useMotion>

    mspf: number
    mspf0: number
    unit = {
        ms2f: (ms: number) => ms / this.mspf0,
        f2ms: (f: number) => f * this.mspf0,
    }

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
            const shapeComp = entity.getComp(ShapeComp.withTag(eq('boundary')))!
            const hoverableComp = entity.getComp(HoverableComp)!

            const hovering = ! this.hoveringEntity && shapeComp.contains(this.mouse.position)
            if (hovering) {
                this.hoveringEntity = entity
                entity.withComp(CursorComp, cursor => {
                    this.ctx.canvas.style.cursor = cursor.config.cursor
                    isCursorSet = true
                })
            }

            if (hoverableComp.state.hovering !== hovering) {
                hoverableComp.emitter.emit(hovering ? 'mouseenter' : 'mouseleave')
                hoverableComp.state.hovering = hovering
            }
        }

        if (! isCursorSet) this.ctx.canvas.style.cursor = ''

        if (oldHoveringEntity !== this.hoveringEntity) {
            oldHoveringEntity?.getComp(HoverableComp)!.emitter.emit('mouseleave')
            this.hoveringEntity?.getComp(HoverableComp)!.emitter.emit('mouseenter')
            this.emitter.emit('hoverTargetChange', this.hoveringEntity)
        }

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

    loopDuration = 0

    start() {
        this.loopTimerId = setInterval(() => {
            const startTime = performance.now()
            this.loop()
            const endTime = performance.now()
            this.loopDuration = endTime - startTime
        }, this.mspf)
    }
    pause() {
        if (this.loopTimerId !== null) {
            clearInterval(this.loopTimerId)
            this.loopTimerId = null
        }
    }

    addScene(scene: Scene) {
        scene.runStart().afterStart(() => {
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
        return this.allEntities.find(entity => entity.id === id) ?? null
    }
}
