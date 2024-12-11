import { ProcessEntity } from '@/entities/Process'
import { TransitionComp } from '@/comps/Transition'
import { Stage1_1, StageData } from '@/data/stages'
import {
    AudioPlayback, Entity, EntityEvents, EntityState,
    ScaleNode, TrapezoidNode, easeInSine,
} from '@/engine'
import { pick, placeholder, StrictOmit } from '@/utils'

export interface SpacetimeConfig {
    stage: StageData
}

export interface SpacetimeState extends EntityState {
    inTransition: boolean
    vx: number
    deltaVx: number
}

export interface SpacetimeEvents extends EntityEvents {}

export class SpacetimeEntity extends Entity<SpacetimeConfig, SpacetimeState, SpacetimeEvents> {
    bgmPlayBack: AudioPlayback = placeholder

    static width = 800
    static height = 600

    static createSpacetime(
        config: SpacetimeConfig,
        state: StrictOmit<SpacetimeState, 'size' | 'deltaVx' | 'vx' | 'inTransition'>
    ) {
        return new this(
            config,
            {
                ...state,
                size: pick(SpacetimeEntity, [ 'width', 'height' ]),
                vx: 0,
                deltaVx: 0,
                inTransition: false,
            }
        )
    }

    processes: ProcessEntity[] = []
    currentProcess: ProcessEntity

    constructor(config: SpacetimeConfig, state: SpacetimeState) {
        super(config, state)

        const { width, height } = SpacetimeEntity

        this
            .appendRenderNode(new TrapezoidNode({
                invSlope: 0,
                sourceBox: {
                    x: 0,
                    y: 0,
                    width,
                    height,
                },
                targetPos: {
                    x: width / 2,
                    y: height / 2,
                    origin: {
                        x: 'center',
                        y: 'center',
                    },
                },
            }))
            .appendRenderNode(new ScaleNode({ scaleX: 1, scaleY: 1, origin: { x: 'center', y: 'center' } }))
            .addComp(TransitionComp, {
                name: 'projection',
                transition: (entity, t) => {
                    const sx = 1 - easeInSine(t) * 0.2
                    const sy = 1 - easeInSine(t) * 0.4
                    const m = easeInSine(t) * 0.3
                    const { width, height } = SpacetimeEntity
                    const w = Math.round(width / sx + 2 * m * height)
                    const dx = (width - w) / 2
                    entity
                        .withRenderNode(ScaleNode, node => {
                            node.config.scaleX = sx
                            node.config.scaleY = sy
                        })
                        .withRenderNode(TrapezoidNode, node => {
                            node.config.invSlope = m
                            node.config.sourceBox.width = w
                            node.config.sourceBox.x = this.state.vx + dx
                        })
                },
                defaultTotalFrame: this.game.unit.ms2f(1600),
            })
            .addComp(TransitionComp, {
                name: 'translation',
                transition: (entity, t) => entity
                    .withRenderNode(TrapezoidNode, node => {
                        const { width, height } = SpacetimeEntity
                        const w = Math.round(width / 0.8 + 2 * 0.3 * height)
                        const dx = (width - w) / 2
                        console.log('dx: %d', dx)
                        node.config.sourceBox.x = this.state.vx + dx + this.state.deltaVx * easeInSine(t)
                    }),
                defaultTotalFrame: this.game.unit.ms2f(800),
            })

        const process0 = ProcessEntity
            .createProcess(
                {
                    processId: 0,
                    plantSlots: {
                        slotNum: 2,
                        plantIds: [ 'pea_shooter', 'sunflower' ],
                    },
                    lawn: {
                        width: 9,
                        height: 5,
                    },
                    sun: {
                        sunDroppingInterval: 10000,
                        firstSunDroppingTime: 6000,
                        sunDroppingSpeed: 30 / 1000,
                        sunLife: 8000,
                        sunAtStart: 200,
                    },
                    shovelSlot: {
                        shovelId: 'iron_shovel',
                    },
                    stage: Stage1_1,
                },
                {
                    pos: { x: 0, y: 0 },
                    zIndex: 0,
                }
            )
            .on('switch-process', () => this.enter5dView())
            .attachTo(this)

        this.currentProcess = process0
        this.processes.push(process0)

        this.afterStart(() => {
            this.bgmPlayBack = this.game.audioManager.playAudio(`./assets/audio/${ Stage1_1.bgm }.mp3`) // TODO: better
        })
    }

    getProcessById(processId: number) {
        return this.processes.find(process => process.config.processId === processId)
    }

    async enter5dView() {
        this.state.inTransition = true
        await this.getComp(TransitionComp.withName('projection'))!.start('once', {
            reset: true,
        })
        this.state.inTransition = false
    }

    async switchProcess(targetProcessId: number) {
        const targetProcess = this.getProcessById(targetProcessId)
        if (! targetProcess) return

        if (this.state.inTransition) return
        this.state.inTransition = true

        targetProcess.activate()
        const sourceProcess = this.currentProcess

        this.state.deltaVx = targetProcess.pos.x - sourceProcess.pos.x

        await this.getComp(TransitionComp.withName('translation'))!.start('once', {
            reset: true,
        })

        this.state.vx += this.state.deltaVx
        this.state.deltaVx = 0

        await this.getComp(TransitionComp.withName('projection'))!.start('once', {
            reset: true,
            direction: - 1,
        })

        this.state.inTransition = false

        sourceProcess.deactivate()
        this.currentProcess = targetProcess
    }

    async forkProcess() {
        this.updateSizeBy({ width: ProcessEntity.width + 30, height: 0 })

        const processIds = this.processes.map(process => process.config.processId).filter(id => id >= 0)
        const newProcessId = Math.max(...processIds) + 1
        const newProcess = this.currentProcess.cloneEntity()
        newProcess.config.processId = newProcessId
        newProcess.on('switch-process', () => this.enter5dView())
        this.processes.push(newProcess.attachTo(this))
        await this.enter5dView()
        await this.switchProcess(newProcessId)
    }

    async start() {
        await super.start()
        await this.game.audioManager.loadAudio(`./assets/audio/${ Stage1_1.bgm }.mp3`) // TODO: better
    }
}
