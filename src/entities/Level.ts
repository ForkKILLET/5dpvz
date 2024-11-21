import { CursorComp } from '@/comps/Cursor'
import { UpdaterComp } from '@/comps/Updater'
import { PLANTS, plantTextures, PlantId, PlantMetadata } from '@/data/plants'
import { shovelTextures, ShovelId } from '@/data/shovels'
import { StageData } from '@/data/stages'
import { ZombieId } from '@/data/zombies'
import { AudioPlayback, Entity, EntityEvents, EntityState, injectKey } from '@/engine'
import { LawnConfig, LawnEntity } from '@/entities/Lawn'
import { LawnBlockEntity } from '@/entities/LawnBlock'
import { PlantEntity } from '@/entities/plants/Plant'
import { ShovelSlotConfig } from '@/entities/ui/ShovelSlot'
import { SunEntity } from '@/entities/Sun'
import { PlantSlotsConfig, UIEntity } from '@/entities/ui/UI'
import { ZombieEntity } from '@/entities/zombies/Zombie'
import { eq, matrix, Nullable, placeholder, random, remove, replicateBy, sum } from '@/utils'
import { BulletId } from '@/data/bullets'
import { BulletEntity } from '@/entities/bullets/Bullet'
import { RectShape } from '@/comps/Shape'
import { TextureEntity } from './Texture'

export interface LevelConfig {
    plantSlots: PlantSlotsConfig
    shovelSlot: ShovelSlotConfig
    lawn: LawnConfig
    sun: SunGlobalConfig
    stage: StageData
    bgm: string
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

export interface BulletData {
    id: BulletId
    entity: BulletEntity
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
    bulletsData: BulletData[]

    waveTimer: number
    wave: number
    waveZombieInitHP: number
}
export interface LevelState extends LevelUniqueState, EntityState {}

export interface LevelEvents extends EntityEvents {}

export const kLevel = injectKey<LevelEntity>('kLevel')

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
        bulletsData: [],
        waveTimer: 0,
        wave: 0,
        waveZombieInitHP: 0,
    })
    private bgmPlayBack: AudioPlayback = placeholder

    static create<C extends LevelConfig, S extends EntityState>(config: C, state: S) {
        return new this(config, this.initState(state))
    }

    ui: UIEntity
    lawn: LawnEntity
    phantomImage: Nullable<TextureEntity> = null
    holdingImage: Nullable<TextureEntity> = null

    width: number
    height: number

    plantMetadatas: PlantMetadata[] = []

    getPlantIdBySlotId(slotId: number) {
        return this.config.plantSlots.plantIds[slotId]
    }

    constructor(config: LevelConfig, state: LevelState) {
        super(config, state)

        this.state.plantSlotsData = this.config.plantSlots.plantIds.map((plantName, i) => {
            const metadata = this.plantMetadatas[i] = PLANTS[plantName]
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

        this.state.waveTimer = 30000

        this.width = 10 + config.lawn.width * 80
        this.height = 150 + config.lawn.height * 80
        this.addComp(RectShape, { width: this.width, height: this.height, origin: 'top-left' })

        this.provide(kLevel, this)

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

        this.lawn = new LawnEntity(
            config.lawn,
            {
                position: { x: 5, y: 150 },
                zIndex: this.state.zIndex + 1,
            },
        )

        this.attach(this.ui, this.lawn)

        if (! this.game.config.noAudio) this.afterStart(() => {
            this.bgmPlayBack = this.game.audioManager.playAudio(`./assets/audio/${ this.config.bgm }.mp3`)
        })

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
                    this.kill(target.state.i, target.state.j)
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
            this.bgmPlayBack?.toggleEffect()
            pauseButton.deactivate()
            resumeButton.activate()
        }

        const resume = () => {
            this.unfreeze()
            this.bgmPlayBack?.toggleEffect()
            resumeButton.deactivate()
            pauseButton.activate()
        }

        this.game.emitter.on('keydown', (ev: KeyboardEvent) => {
            if (ev.key === 'Escape') {
                if (this.frozen) resume()
                else pause()
            }
        })

        const pauseButton = TextureEntity
            .createButtonFromImage(
                './assets/ui/pause_button.png',
                {},
                {
                    position: { x: this.width - 32, y: 5 },
                    zIndex: this.state.zIndex + 11,
                },
            )
            .addComp(CursorComp, 'pointer')
            .attachTo(this)
            .on('click', pause)

        const resumeButton = TextureEntity
            .createButtonFromImage(
                './assets/ui/resume_button.png',
                {},
                {
                    position: { x: this.width - 32, y: 5 },
                    zIndex: this.state.zIndex + 11,
                },
            )
            .addComp(CursorComp, 'pointer')
            .deactivate()
            .attachTo(this)
            .on('click', resume)
    }

    plant(slotId: number, i: number, j: number) {
        const slot = this.state.plantSlotsData[slotId]
        if (! slot.isPlantable || this.isOccupied(i, j)) return

        const plantId = this.getPlantIdBySlotId(slotId)
        const metadata = PLANTS[plantId]
        const cost = metadata.cost

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

    async start() {
        await super.start()
        if (! this.game.config.noAudio)
            await this.game.audioManager.loadAudio(`./assets/audio/${ this.config.bgm }.mp3`)
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

            const zombie = ZombieEntity.createZombie(
                zombieId,
                {},
                {
                    j: row,
                    position: { x, y: y - 40 },
                    zIndex: this.lawn.state.zIndex + 2 + row * 0.1,
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

    frozenUpdate() {
        if (this.holdingImage) {
            const { x, y } = this.game.mouse.position
            this.holdingImage.updatePositionTo({ x: x - 40, y: y - 40 })
        }
    }

    update() {
        this.updatePlantSlot()

        this.updateTimer('waveTimer', { interval: 25000 }, () => this.nextWave())

        this.updateTimer(
            'sunDropTimer',
            { interval: this.config.sun.sunDroppingInterval },
            () => this.dropSun()
        )

        return this.state
    }

    preRender() {
        if (this.frozen) this.addRenderJob(() => {
            const { ctx } = this.game
            const { x, y } = this.state.position
            ctx.fillStyle = 'rgba(0, 32, 255, .3)'
            ctx.fillRect(x, y, this.width, this.height)
        }, 10)

        super.preRender()
    }
}
