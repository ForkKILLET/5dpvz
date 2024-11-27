import { RngComp } from '@/comps/Rng'
import { RectShape } from '@/comps/Shape'
import { UpdaterComp } from '@/comps/Updater'
import { BulletId } from '@/data/bullets'
import { PlantId, PLANTS, plantTextures } from '@/data/plants'
import { ShovelId, shovelTextures } from '@/data/shovels'
import { StageData } from '@/data/stages'
import { ZombieId } from '@/data/zombies'
import { Entity, EntityConfig, EntityEvents, EntityState, injectKey } from '@/engine'
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
import { eq, matrix, Nullable, pick, placeholder, random, remove, replicateBy, sum } from '@/utils'
import { BrightnessNode, GaussianBlurNode, ScalingNode } from '@/engine/imageNode'

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
    sunDroppingVelocity: number
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
    position: { i: number, j: number }
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

export interface ProcessEvents extends EntityEvents {}

export const kProcess = injectKey<ProcessEntity>('kProcess')

export const getProcessId = (entity: Entity): number => entity.inject(kProcess)!.config.processId

export class ProcessEntity extends Entity<ProcessConfig, ProcessState, ProcessEvents> {
    static createProcess<C extends ProcessConfig, S extends EntityState>(config: C, state: S) {
        return new this(config, {
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

    ui: UIEntity = placeholder
    lawn: LawnEntity = placeholder
    phantomImage: Nullable<TextureEntity> = null
    holdingImage: Nullable<TextureEntity> = null

    static width = 730
    static height = 550

    getPlantIdBySlotId(slotId: number) {
        return this.config.plantSlots.plantIds[slotId]
    }

    constructor(config: ProcessConfig, state: ProcessState) {
        super(config, state)

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

        this.addComp(RectShape, { ...pick(ProcessEntity, [ 'width', 'height' ]), origin: 'top-left' })
        this.addComp(RngComp, random(2 ** 32))

        this.provide(kProcess, this)

        new ProcessLabelEntity(
            { processId: config.processId },
            {
                position: { x: ProcessEntity.width - 64 - 5, y: 5 + 32 + 5 },
                zIndex: this.state.zIndex + 11,
            }
        ).attachTo(this)

        // FIXME: safe global listener
        this.game.emitter.on('hoverTargetChange', target => {
            if (this.state.holdingObject === null) return

            const { holdingObject } = this.state
            if (holdingObject?.type === 'plant') {
                if (target instanceof LawnBlockEntity) {
                    const { i, j } = target.config
                    if (this.isOccupied(i, j)) {
                        this.phantomImage!.deactivate()
                        return
                    }

                    const { x, y } = target.state.position
                    this.phantomImage!.activate().state.position = { x, y }
                }
                else this.phantomImage!.deactivate()
            }
        })

        this.game.emitter.on('click', target => {
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
                    this.kill(target.state.i, target.state.j)
                    this.cancelHolding()
                }
            }
            else this.cancelHolding()
        })

        this.game.emitter.on('rightclick', () => {
            if (this.state.holdingObject !== null) this.cancelHolding()
        })
    }

    build() {
        this.ui = this
            .useBuilder('UI', () => new UIEntity(
                this.config.plantSlots,
                {
                    position: { x: 5, y: 5 },
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
                            position: { x: 5, y: 5 },
                            zIndex: this.lawn.state.zIndex + 3,
                        },
                    )
                    .attachTo(this)

                this.phantomImage = TextureEntity
                    .createTextureFromImage(
                        plantTextures.getImageSrc(plantId),
                        {},
                        {
                            position: { x: 0, y: 0 },
                            zIndex: this.state.zIndex + 3,
                        },
                    )
                    .on('before-render', () => {
                        this.game.ctx.globalAlpha = 0.5
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
                            position: { x: 5, y: 5 },
                            zIndex: this.state.zIndex + 4,
                        },
                    )
                    .attachTo(this)
            })

        this.lawn = this
            .useBuilder('Lawn', () => new LawnEntity(
                this.config.lawn,
                {
                    position: { x: 5, y: 150 },
                    zIndex: this.state.zIndex + 1,
                },
            ))
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

        const newPlant = PlantEntity.createPlant(
            plantId,
            {},
            {
                i, j,
                position: this.getLawnBlockPosition(i, j),
                zIndex: this.state.zIndex + 3,
            }
        ).attachTo(this)

        const newPlantData: PlantData = {
            id: plantId,
            position: { i, j },
            entity: newPlant,
        }
        this.state.plantsData.push(newPlantData)
        this.state.plantsOnBlocks[i][j] = newPlantData

        newPlant.afterStart(() => {
            newPlant.processingPipeline
                .appendNode(new GaussianBlurNode(2))
                .appendNode(new BrightnessNode(0.5))
                .appendNode(new ScalingNode(2))
        })

        this.cancelHolding()
    }

    kill(i: number, j: number) {
        const plantData = this.state.plantsOnBlocks[i][j]
        if (! plantData) return
        this.state.plantsOnBlocks[i][j] = null

        const { entity } = plantData
        entity.dispose()

        remove(this.state.plantsData, eq(plantData))
    }

    isOccupied(i: number, j: number) {
        return this.state.plantsOnBlocks[i][j] !== null
    }

    getLawnBlockPosition(i: number, j: number) {
        return { ...this.lawn.lawnBlocks[i][j].state.position }
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
        const { x: x0, y: y0 } = this.lawn.state.position
        const rng = this.getComp(RngComp)!
        const x = x0 + rng.random((this.config.lawn.width - 1) * 80)
        const y = y0 + rng.random(1 * 80)
        const deltaY = rng.random(1 * 80, (this.config.lawn.height - 2) * 80)
        const targetY = y + deltaY
        const life = deltaY / this.config.sun.sunDroppingVelocity + 4000

        SunEntity.createSun(
            {
                life,
                sun: 25,
            },
            {
                position: { x, y },
                zIndex: this.state.zIndex + 4,
            }
        )
            .addComp(UpdaterComp, entity => {
                if (entity.state.position.y < targetY) entity.updatePosition({
                    x: 0,
                    y: this.config.sun.sunDroppingVelocity * this.game.mspf,
                })
            })
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
        const { x, y } = this.getLawnBlockPosition(this.lawn.config.width - 1, row)

        const zombie = ZombieEntity.createZombie(
            zombieId,
            {},
            {
                j: row,
                position: { x: x + 80, y: y - 40 },
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
                cd += this.game.mspf
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

    win() {
        alert('win')
    }
    lose() {
        alert('lose')
    }

    updateWhenPaused() {
        if (this.holdingImage) {
            const { x, y } = this.game.mouse.position
            this.holdingImage.updatePositionTo({ x: x - 40, y: y - 40 })
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

    postUpdate() {
        if (this.state.paused) return
        super.postUpdate()
    }

    preRender() {
        if (this.state.paused) this.addRenderJob(() => {
            const { ctx } = this.game
            const { x, y } = this.state.position
            ctx.fillStyle = 'rgba(0, 32, 255, .3)'
            ctx.fillRect(x, y, ProcessEntity.width, ProcessEntity.height)
        }, 10)

        super.preRender()
    }
}
