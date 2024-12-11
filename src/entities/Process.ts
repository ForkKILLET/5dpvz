import { MotionComp } from '@/comps/Motion'
import { RngComp } from '@/comps/Rng'
import { RectShape } from '@/comps/Shape'
import { BulletId } from '@/data/bullets'
import { PlantId, PLANTS, plantTextures } from '@/data/plants'
import { ShovelId, shovelTextures } from '@/data/shovels'
import { StageData } from '@/data/stages'
import { ZombieId } from '@/data/zombies'
import { kDebugAttr } from '@/debug'
import { Entity, EntityConfig, EntityEvents, EntityState, injectKey, Vector2D } from '@/engine'
import { BulletEntity } from '@/entities/bullets/Bullet'
import { LawnConfig, LawnEntity } from '@/entities/Lawn'
import { LawnBlockEntity } from '@/entities/LawnBlock'
import { PlantEntity } from '@/entities/plants/Plant'
import { SunEntity } from '@/entities/Sun'
import { TextureEntity } from '@/entities/Texture'
import { ProcessLabelEntity } from '@/entities/ui/ProcessLabel'
import { ShovelSlotConfig } from '@/entities/ui/ShovelSlot'
import { PlantSlotsConfig, UIEntity } from '@/entities/ui/UI'
import { ZombieEntity } from '@/entities/zombies/Zombie'
import { eq, matrix, Nullable, pick, placeholder, random, remove, replicateBy, StrictOmit, sum } from '@/utils'

export interface ProcessConfig extends EntityConfig {
    processId: number
    plantSlots: PlantSlotsConfig
    shovelSlot: ShovelSlotConfig
    lawn: LawnConfig
    sun: SunGlobalConfig
    stage: StageData
}

export interface SunGlobalConfig {
    sunDroppingInterval: number
    firstSunDroppingTime: number
    sunDroppingSpeed: number
    sunLife: number
    sunAtStart: number
}

export interface PlantSlotData {
    id: PlantId
    cd: number
    isCooledDown: boolean
    isSunEnough: boolean
    isPlantable: boolean
}

export interface PlantData {
    id: PlantId
    pos: { i: number, j: number }
    entity: PlantEntity
}

export interface SunData {
    entity: SunEntity
}

export interface ZombieData {
    id: ZombieId
    entity: ZombieEntity
}

export interface BulletData {
    id: BulletId
    entity: BulletEntity
}

export type HoldingObject =
    | { type: 'plant', slotId: number }
    | { type: 'shovel', shovelId: ShovelId }

export interface ProcessUniqueState {
    sun: number
    sunDropTimer: number

    plantSlotsData: PlantSlotData[]
    holdingObject: Nullable<HoldingObject>

    plantsData: PlantData[]
    plantsOnBlocks: Nullable<PlantData>[][]
    sunsData: SunData[]
    zombiesData: ZombieData[]
    bulletsData: BulletData[]

    waveTimer: number
    wave: number
    waveZombieInitHp: number
    waveZombieList: ZombieId[]
    zombieSpawnTimer: number

    paused: boolean
    finished: boolean
}
export interface ProcessState extends ProcessUniqueState, EntityState {}

export interface ProcessEvents extends EntityEvents {
    'switch-process': []
}

export const kProcess = injectKey<ProcessEntity>('kProcess')

export const getProcessId = (entity: Entity): number => entity.inject(kProcess)!.config.processId

export class ProcessEntity extends Entity<ProcessConfig, ProcessState, ProcessEvents> {
    static createProcess<C extends ProcessConfig, S extends EntityState>(config: C, state: StrictOmit<S, 'size'>) {
        return new this(config, {
            size: placeholder,

            sun: config.sun.sunAtStart,
            sunDropTimer: config.sun.sunDroppingInterval - config.sun.firstSunDroppingTime,

            plantSlotsData: placeholder,
            holdingObject: null,

            plantsData: [],
            plantsOnBlocks: placeholder,
            sunsData: [],
            zombiesData: [],
            bulletsData: [],

            waveTimer: 30000,
            wave: 0,
            waveZombieInitHp: 0,
            waveZombieList: [],
            zombieSpawnTimer: 0,

            paused: false,
            finished: false,

            ...state,
        })
    }

    public [kDebugAttr] = [
        () => `pid: ${ this.config.processId }`,
    ]

    ui: UIEntity = placeholder
    lawn: LawnEntity = placeholder
    label: ProcessLabelEntity = placeholder
    phantomImage: Nullable<TextureEntity> = null
    holdingImage: Nullable<TextureEntity> = null

    static width = 770
    static height = 550

    getPlantIdBySlotId(slotId: number) {
        return this.config.plantSlots.plantIds[slotId]
    }

    constructor(config: ProcessConfig, state: ProcessState) {
        super(config, state)

        this.state.size = pick(ProcessEntity, [ 'width', 'height' ])

        this.afterStart(() => {
            this.updatePosTo({
                x: this.config.processId * (ProcessEntity.width + 30),
                y: 0,
            })
        })

        this.state.plantSlotsData ??= config.plantSlots.plantIds.map((plantId): PlantSlotData => {
            const Plant = PLANTS[plantId]
            return {
                id: plantId,
                cd: 0,
                isSunEnough: Plant.cost <= this.state.sun,
                isCooledDown: true,
                isPlantable: Plant.isPlantableAtStart,
            }
        })

        this.state.plantsOnBlocks ??= matrix(config.lawn.width, config.lawn.height, () => null)

        this.addComp(RectShape, pick(ProcessEntity, [ 'width', 'height' ]))
        this.addComp(RngComp, random(2 ** 32))

        this.provide(kProcess, this)

        // FIXME: safe global listener
        this.game.on('hoverTargetChange', target => {
            if (this.state.holdingObject === null) return

            const { holdingObject } = this.state
            if (holdingObject?.type === 'plant') {
                if (target instanceof LawnBlockEntity) {
                    const { i, j } = target.config
                    if (this.isOccupied(i, j)) {
                        this.phantomImage!.deactivate()
                        return
                    }

                    const { x, y } = target.state.pos
                    this.phantomImage!.activate().state.pos = { x, y }
                }
                else this.phantomImage!.deactivate()
            }
        })

        this.game.on('click', target => {
            if (! this.active) return

            if (this.state.holdingObject === null) return

            const { holdingObject } = this.state
            if (target instanceof LawnBlockEntity) {
                if (holdingObject?.type === 'plant') {
                    const { i, j } = target.config
                    this.plant(holdingObject.slotId, i, j)
                }
            }
            else if (target instanceof PlantEntity) {
                if (holdingObject?.type === 'shovel') {
                    target.dispose()
                    this.cancelHolding()
                }
            }
            else this.cancelHolding()
        })

        this.game.on('rightclick', () => {
            if (this.state.holdingObject !== null) this.cancelHolding()
        })
    }

    build() {
        this.ui = this
            .useBuilder('UI', () => UIEntity.createUI(
                this.config.plantSlots,
                {
                    pos: { x: 5, y: 5 },
                    zIndex: 1,
                },
            ))
            .on('choose-plant', slotId => {
                const slot = this.state.plantSlotsData[slotId]
                if (! slot.isPlantable) return

                const plantId = this.getPlantIdBySlotId(slotId)
                this.state.holdingObject = { type: 'plant', slotId }

                this.holdingImage?.dispose()
                this.holdingImage = TextureEntity
                    .createTextureFromImage(
                        plantTextures.getImageSrc(plantId),
                        {},
                        {
                            pos: { x: 5, y: 5 },
                            zIndex: this.lawn.state.zIndex + 3,
                        },
                    )
                    .attachTo(this)

                this.phantomImage = TextureEntity
                    .createTextureFromImage(
                        plantTextures.getImageSrc(plantId),
                        {},
                        {
                            pos: { x: 0, y: 0 },
                            zIndex: this.state.zIndex + 3,
                        },
                    )
                    .on('before-render', () => {
                        this.ctx.globalAlpha = 0.5
                    })
                    .deactivate()
                    .attachTo(this)
            })
            .on('choose-shovel', shovelId => {
                if (this.state.holdingObject?.type === 'shovel') {
                    this.cancelHolding()
                    return
                }

                this.state.holdingObject = { type: 'shovel', shovelId }
                this.holdingImage?.dispose()
                this.holdingImage = TextureEntity
                    .createTextureFromImage(
                        shovelTextures.getImageSrc(shovelId),
                        {},
                        {
                            pos: { x: 5, y: 5 },
                            zIndex: this.state.zIndex + 4,
                        },
                    )
                    .attachTo(this)
            })

        this.lawn = this
            .useBuilder('Lawn', () => LawnEntity.createLawn(
                this.config.lawn,
                {
                    pos: { x: 5, y: 150 },
                    zIndex: this.state.zIndex + 1,
                },
            ))

        this.label = this
            .useBuilder('ProcessLabel', () => ProcessLabelEntity.createProcessLabel({
                pos: { x: ProcessEntity.width - 64 - 5, y: 5 + 32 + 5 },
                zIndex: this.state.zIndex + 11,
            }))
            .on('click', () => this.emit('switch-process'))
    }

    plant(slotId: number, i: number, j: number) {
        const slot = this.state.plantSlotsData[slotId]
        if (! slot.isPlantable || this.isOccupied(i, j)) return

        const plantId = this.getPlantIdBySlotId(slotId)
        const Plant = PLANTS[plantId]
        const cost = Plant.cost

        slot.cd = 0
        slot.isCooledDown = false
        this.state.sun -= cost

        this.updatePlantSlot(false)

        const plant = PlantEntity
            .createPlant(
                plantId,
                {},
                {
                    i, j,
                    pos: this.getLawnBlockPos(i, j),
                    zIndex: this.state.zIndex + 3,
                }
            )
            .attachTo(this)

        const plantData: PlantData = {
            id: plantId,
            pos: { i, j },
            entity: plant,
        }
        this.state.plantsData.push(plantData)
        this.state.plantsOnBlocks[i][j] = plantData
        plant.on('dispose', () => {
            this.state.plantsOnBlocks[i][j] = null
            remove(this.state.plantsData, eq(plantData))
        })

        this.cancelHolding()
    }

    isOccupied(i: number, j: number) {
        return this.state.plantsOnBlocks[i][j] !== null
    }

    getLawnBlockPos(i: number, j: number) {
        return { ...this.lawn.lawnBlocks[i][j].state.pos }
    }

    cancelHolding() {
        if (this.state.holdingObject?.type === 'shovel') {
            this.ui.shovelSlot.shovelImage?.activate()
        }
        this.state.holdingObject = null
        this.holdingImage?.dispose()
        this.holdingImage = null
        this.phantomImage?.dispose()
        this.phantomImage = null
    }

    dropSun() {
        const { x: x0, y: y0 } = this.lawn.state.pos
        const rng = this.getComp(RngComp)!
        const x = x0 + rng.random((this.config.lawn.width - 1) * 80)
        const y = y0 + rng.random(1 * 80)
        const deltaY = rng.random(1 * 80, (this.config.lawn.height - 2) * 80)

        SunEntity.createSun(
            {
                sun: 25,
            },
            {
                pos: { x, y },
                zIndex: this.state.zIndex + 4,
            }
        )
            .addLazyComp(sun => MotionComp.create(
                sun,
                {
                    motion: this.game.motion.linearTo(
                        { speed: this.config.sun.sunDroppingSpeed },
                        { x, y },
                        { x, y: y + deltaY }
                    ),
                },
                { frame: 0 }
            ))
            .withComp(MotionComp, ({ emitter }) => emitter
                .on('motion-finish', entity => entity.as<SunEntity>().settle())
            )
            .attachTo(this)
    }

    get currentZombiesHP(): number {
        return sum(this.state.zombiesData.map(data => data.entity.config.metadata.hp))
    }

    get wavesData() {
        return this.config.stage.wavesData
    }

    getZombieSpawningRow(zombieId: ZombieId) {
        void zombieId
        return this.getComp(RngComp)!.random(this.lawn.config.height)
    }

    spawnZombieGroup() {
        const groupSize = 1
        const group = this.state.waveZombieList.splice(0, groupSize)

        group.forEach(zombieId => this.spawnZombie(zombieId))

        if (! this.state.waveZombieList.length) this.state.zombieSpawnTimer = 0
    }

    spawnZombie(zombieId: ZombieId) {
        const row = this.getZombieSpawningRow(zombieId)
        const { x, y } = this.getLawnBlockPos(this.lawn.config.width - 1, row)

        const zombie = ZombieEntity.createZombie(
            zombieId,
            {},
            {
                j: row,
                pos: { x: x + 80, y: y - 40 },
                zIndex: this.lawn.state.zIndex + 2 + row * 0.1,
                speedRatio: this.getComp(RngComp)!.random(95, 105) / 100,
            }
        )
            .attachTo(this)
            .on('dispose', () => {
                remove(this.state.zombiesData, ({ entity }) => entity.id === zombie.id)
            })

        this.state.zombiesData.push({
            id: zombieId,
            entity: zombie,
        })
    }

    nextWave() {
        if (this.state.wave === this.wavesData.waveCount) return
        const currentWave = this.wavesData.waves[this.state.wave ++]
        const zombieList: ZombieId[] = replicateBy(currentWave.zombieCount, () => {
            const probs = currentWave.zombieProbs
            const total = sum(Object.values(probs))
            const rand = this.getComp(RngComp)!.random(total)
            let acc = 0
            for (const [ zombieId, prob ] of Object.entries(probs)) {
                acc += prob
                if (rand < acc) return zombieId as ZombieId
            }
            return zombieList[0]
        })

        this.state.waveZombieList = zombieList
        if (this.wavesData.bigWaveIndex.includes(this.state.wave)) {
            this.bigWave()
            this.state.zombieSpawnTimer = - 5000
        }
        else {
            this.state.zombieSpawnTimer = 0
        }
    }

    bigWave() {
        console.log('big wave')
    }

    updatePlantSlot(runCoolDown = true) {
        this.state.plantSlotsData.forEach(slot => {
            let { cd, isCooledDown } = slot

            const Plant = PLANTS[slot.id]

            if (runCoolDown && ! isCooledDown) {
                const { cd: maxCd } = Plant
                cd += this.game.mspf0
                if (cd > maxCd) {
                    cd = maxCd
                    slot.isCooledDown = true
                }
                slot.cd = cd
            }

            slot.isSunEnough = this.state.sun >= Plant.cost

            slot.isPlantable = slot.isCooledDown && slot.isSunEnough
        })
    }

    // TODO
    win() {
        alert('win')
    }
    lose() {
        alert('lose')
    }

    updateWhenPaused() {
        if (this.holdingImage) {
            const { x, y } = this.game.mouse.pos
            this.holdingImage.updatePosTo({ x: x - 40, y: y - 40 })
        }
    }

    update() {
        this.updateWhenPaused()
        if (this.state.paused) return

        if (! this.state.finished) {
            if (this.config.stage.hasWon(this)) {
                this.state.finished = true
                this.win()
            }
            else if (this.config.stage.hasLost(this)) {
                this.state.finished = true
                this.lose()
            }
        }

        this.updatePlantSlot()

        this.updateTimer('waveTimer', { interval: 25000 }, () => {
            this.nextWave()
        })

        if (this.state.waveZombieList.length) {
            this.updateTimer('zombieSpawnTimer', { interval: 1000 }, () => {
                this.spawnZombieGroup()
            })
        }

        this.updateTimer(
            'sunDropTimer',
            { interval: this.config.sun.sunDroppingInterval },
            () => this.dropSun()
        )

        return this.state
    }

    isInsideLawn(pos: Vector2D) {
        return this.getComp(RectShape)!.contains(pos)
    }

    postUpdate() {
        if (this.state.paused) return
        super.postUpdate()
    }

    preRender() {
        if (this.state.paused) this.addRenderJob(() => {
            const { ctx } = this
            ctx.fillStyle = 'rgba(0, 32, 255, .3)'
            ctx.fillRect(0, 0, ProcessEntity.width, ProcessEntity.height)
        }, 10)

        super.preRender()
    }
}
