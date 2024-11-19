import { BoundaryComp } from '@/comps/Boundary'
import { CursorComp } from '@/comps/Cursor'
import { UpdaterComp } from '@/comps/Updater'
import { PLANT_METADATA, plantAnimation, PlantId, PlantMetadata } from '@/data/plants'
import { shovelAnimation, ShovelId } from '@/data/shovels'
import { StageData } from '@/data/stages'
import { ZombieId } from '@/data/zombies'
import { Entity, EntityEvents, EntityState, injectKey } from '@/engine'
import { ButtonEntity } from '@/entities/Button'
import { ImageEntity } from '@/entities/Image'
import { LawnConfig, LawnEntity } from '@/entities/Lawn'
import { LawnBlockEntity } from '@/entities/LawnBlock'
import { PlantEntity } from '@/entities/plants/Plant'
import { ShovelSlotConfig } from '@/entities/ShovelSlot'
import { SunEntity } from '@/entities/Sun'
import { PlantSlotsConfig, UIEntity } from '@/entities/UI'
import { ZombieEntity } from '@/entities/zombies/Zombie'
import { eq, matrix, Nullable, placeholder, random, remove, replicateBy, sum } from '@/utils'

export interface LevelConfig {
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

export type HoldingObject =
    | { type: 'plant', slotId: number }
    | { type: 'shovel', shovelId: ShovelId }

export interface LevelUniqueState {
    sun: number
    sunDropTimer: number

    plantSlotsData: PlantSlotData[]
    holdingObject: Nullable<HoldingObject>

    plantsData: PlantData[]
    plantsOnBlocks: Nullable<PlantData>[][]
    sunsData: SunData[]
    zombiesData: ZombieData[]

    waveTimer: number
    wave: number
    waveZombieInitHP: number
}
export interface LevelState extends LevelUniqueState, EntityState {}

export interface LevelEvents extends EntityEvents {}

export const kLevelState = injectKey<LevelState>('kLevelState')
export const kAttachToLevel = injectKey<(entity: Entity) => void>('kAttachToLevel')

export class LevelEntity extends Entity<LevelConfig, LevelState, LevelEvents> {
    static initState = <S>(state: S): S & LevelUniqueState => ({
        ...state,
        sun: 0,
        sunDropTimer: 0,
        plantSlotsData: [],
        holdingObject: null,
        plantsData: [],
        plantsOnBlocks: placeholder,
        sunsData: [],
        zombiesData: [],
        waveTimer: 0,
        wave: 0,
        waveZombieInitHP: 0,
    })

    static create<C extends LevelConfig, S extends EntityState>(config: C, state: S) {
        return new this(config, this.initState(state))
    }

    ui: UIEntity
    lawn: LawnEntity
    phantomImage: Nullable<ImageEntity> = null
    holdingImage: Nullable<ImageEntity> = null

    width: number
    height: number

    plantMetadatas: PlantMetadata[] = []

    getPlantIdBySlotId(slotId: number) {
        return this.config.plantSlots.plantIds[slotId]
    }

    constructor(config: LevelConfig, state: LevelState) {
        super(config, state)

        this.state.plantSlotsData = this.config.plantSlots.plantIds.map((plantName, i) => {
            const metadata = this.plantMetadatas[i] = PLANT_METADATA[plantName]
            return {
                cd: 0,
                isSunEnough: metadata.cost <= this.state.sun,
                isCooledDown: true,
                isPlantable: metadata.isPlantableAtStart,
            }
        })
        this.state.plantsOnBlocks = matrix(config.lawn.width, config.lawn.height, () => null)

        this.state.sun = config.sun.sunAtStart
        this.state.sunDropTimer = config.sun.sunDroppingInterval - config.sun.firstSunDroppingTime

        this.state.waveTimer = 30_000

        this.width = 10 + config.lawn.width * 80
        this.height = 150 + config.lawn.height * 80
        this.addComp(BoundaryComp, () => this)

        this
            .provide(kLevelState, this.state)
            .provide(kAttachToLevel, entity => entity.attachTo(this))

        this.ui = new UIEntity(
            config.plantSlots,
            {
                position: { x: 5, y: 5 },
                zIndex: 1,
            },
        )
            .on('choose-plant', slotId => {
                const slot = this.state.plantSlotsData[slotId]
                if (! slot.isPlantable) return

                const plantId = this.getPlantIdBySlotId(slotId)
                this.state.holdingObject = { type: 'plant', slotId }

                this.holdingImage?.dispose()
                this.holdingImage = ImageEntity.create(
                    plantAnimation.getImageConfig(plantId),
                    {
                        position: { x: 5, y: 5 },
                        zIndex: this.lawn.state.zIndex + 3,
                    },
                )
                    .attachTo(this)

                this.phantomImage = ImageEntity.create(
                    plantAnimation.getImageConfig(plantId),
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
                this.holdingImage = ImageEntity.create(
                    shovelAnimation.getImageConfig(shovelId),
                    {
                        position: { x: 5, y: 5 },
                        zIndex: this.state.zIndex + 4,
                    },
                )
                    .attachTo(this)
            })

        this.lawn = new LawnEntity(
            config.lawn,
            {
                position: { x: 5, y: 150 },
                zIndex: this.state.zIndex + 1,
            },
        )

        this.attach(this.ui, this.lawn)

        this.afterStart(() => {
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
                        this.kill(target.config.i, target.config.j)
                        this.cancelHolding()
                    }
                }
                else this.cancelHolding()
            })

            this.game.emitter.on('rightclick', () => {
                if (this.state.holdingObject !== null) this.cancelHolding()
            })

            const pause = () => {
                this.freeze()
                pauseButton.deactivate()
                resumeButton.activate()
            }

            const resume = () => {
                this.unfreeze()
                resumeButton.deactivate()
                pauseButton.activate()
            }

            this.game.emitter.on('keydown', (ev: KeyboardEvent) => {
                if (ev.key === 'Escape') {
                    if (this.frozen) resume()
                    else pause()
                }
            })

            const pauseButton = ButtonEntity.from(
                ImageEntity.create(
                    {
                        src: './assets/ui/pause_button.png',
                    },
                    {
                        position: { x: this.width - 32, y: 5 },
                        zIndex: this.state.zIndex + 5,
                    },
                ),
                { containingMode: 'rect' }
            )
                .addComp(CursorComp, 'pointer')
                .attachTo(this)
                .on('click', pause)

            const resumeButton = ButtonEntity.from(
                ImageEntity.create(
                    {
                        src: './assets/ui/resume_button.png',
                    },
                    {
                        position: { x: this.width - 32, y: 5 },
                        zIndex: this.state.zIndex + 5,
                    },
                ),
                { containingMode: 'rect' }
            )
                .addComp(CursorComp, 'pointer')
                .deactivate()
                .attachTo(this)
                .on('click', resume)
        })
    }

    plant(slotId: number, i: number, j: number) {
        const slot = this.state.plantSlotsData[slotId]
        if (! slot.isPlantable || this.isOccupied(i, j)) return

        const plantId = this.getPlantIdBySlotId(slotId)
        const metadata = PLANT_METADATA[plantId]
        const cost = metadata.cost

        slot.cd = 0
        slot.isCooledDown = false
        this.state.sun -= cost

        this.updatePlantSlot(false)

        const newPlant = PlantEntity.create(
            plantId,
            { i, j },
            {
                position: this.getLawnBlockPosition(i, j),
                zIndex: this.state.zIndex + 3,
            }
        )

        const newPlantData: PlantData = {
            id: plantId,
            position: { i, j },
            entity: newPlant,
        }
        this.attach(newPlant)
        this.state.plantsData.push(newPlantData)
        this.state.plantsOnBlocks[i][j] = newPlantData

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
        const x = x0 + random((this.config.lawn.width - 1) * 80)
        const y = y0 + random(1 * 80)
        const deltaY = random(1 * 80, (this.config.lawn.height - 2) * 80)
        const targetY = y + deltaY
        const life = deltaY / this.config.sun.sunDroppingVelocity + 4000

        SunEntity.create(
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
        return random(this.lawn.config.height)
    }

    nextWave() {
        if (this.state.wave === this.wavesData.waveCount) return
        const currentWave = this.wavesData.waves[this.state.wave ++]
        const zombieList: ZombieId[] = replicateBy(currentWave.zombieCount, () => {
            const probs = currentWave.zombieProbs
            const total = sum(Object.values(probs))
            const rand = random(total)
            let acc = 0
            for (const [ zombieId, prob ] of Object.entries(probs)) {
                acc += prob
                if (rand < acc) return zombieId as ZombieId
            }
            return zombieList[0]
        })

        zombieList.forEach(zombieId => {
            const row = this.getZombieSpawningRow(zombieId)
            const { x, y } = this.getLawnBlockPosition(this.lawn.config.width - 1, row)

            const newZombie = ZombieEntity.create(
                zombieId,
                {},
                {
                    position: { x, y: y - 40 },
                    zIndex: this.lawn.state.zIndex + 2 + row * 0.1,
                }
            )
                .attachTo(this)

            this.state.zombiesData.push({
                id: zombieId,
                entity: newZombie,
            })
        })
    }

    updatePlantSlot(runCoolDown = true) {
        this.state.plantSlotsData.forEach((slot, i) => {
            let { cd, isCooledDown } = slot

            if (runCoolDown && ! isCooledDown) {
                const { cd: maxCd } = this.plantMetadatas[i]
                cd += this.game.mspf
                if (cd > maxCd) {
                    cd = maxCd
                    slot.isCooledDown = true
                }
                slot.cd = cd
            }

            slot.isSunEnough = this.state.sun >= this.plantMetadatas[i].cost

            slot.isPlantable = slot.isCooledDown && slot.isSunEnough
        })
    }

    updateZombie() {
        if (this.state.waveTimer <= 0
            || this.state.waveTimer <= 25000 && this.currentZombiesHP <= this.state.waveZombieInitHP
        ) this.nextWave()

        this.state.zombiesData.forEach(({ entity }) => {
            entity.updatePosition({
                x: entity.nextMove(),
                y: 0,
            })
            if (entity.state.position.x < 0) {
                entity.dispose() // TODO
            }
        })
    }

    frozenUpdate() {
        if (this.holdingImage) {
            const { x, y } = this.game.mouse.position
            this.holdingImage.updatePositionTo({ x: x - 40, y: y - 40 })
        }
    }

    update() {
        this.updatePlantSlot()

        this.updateZombie()

        this.updateTimer(
            'sunDropTimer',
            { interval: this.config.sun.sunDroppingInterval },
            () => this.dropSun()
        )
        this.state.waveTimer -= this.game.mspf

        return this.state
    }

    preRender() {
        if (this.frozen) this.addRenderJob(() => {
            const { ctx } = this.game
            const { x, y } = this.state.position
            ctx.fillStyle = 'rgba(0, 32, 255, .3)'
            ctx.fillRect(x, y, this.width, this.height)
        }, 4)

        super.preRender()
    }
}
