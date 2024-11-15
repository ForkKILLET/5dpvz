import { plantAnimation, PLANT_METADATA, PlantId, PlantMetadata } from '@/data/plants'
import { Entity, EntityEvents, EntityState, injectKey } from '@/engine'
import { LawnConfig, LawnEntity } from '@/entities/Lawn'
import { PlantSlotsConfig, UIEntity } from '@/entities/UI'
import { ImageEntity } from '@/entities/Image'
import { eq, matrix, Nullable, remove } from '@/utils'
import { LawnBlockEntity } from '@/entities/LawnBlock'
import { PlantEntity } from '@/entities/Plant'
import { SunEntity } from '@/entities/Sun'
import { random } from '@/utils/random'
import { LifeComp } from '@/comps/Life'
import { ShovelSlotConfig } from '@/entities/ShovelSlot'
import { shovelAnimation, ShovelId } from '@/data/shovel'
import { ButtonEntity } from '@/entities/Button'
import { CursorComp } from '@/comps/Cursor'
import { placeholder } from '@/utils/any'

export interface LevelConfig {
    plantSlots: PlantSlotsConfig
    shovelSlot: ShovelSlotConfig
    lawn: LawnConfig
    sun: SunGlobalConfig
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
    hp: number
    position: { i: number, j: number }
    entity: PlantEntity
}

export interface SunData {
    lifeLimit: number
    targetY: number
    entity: SunEntity
}

type HoldingObject =
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
}
export interface LevelState extends LevelUniqueState, EntityState {}

export interface LevelEvents extends EntityEvents {}

export const kLevelState = injectKey<LevelUniqueState>('kLevelState')

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
    })

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

        this.width = 10 + config.lawn.width * 80
        this.height = 150 + config.lawn.height * 80

        this.provide(kLevelState, this.state)

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
                this.holdingImage = new ImageEntity(
                    plantAnimation.getImageConfig(plantId),
                    {
                        position: { x: 5, y: 5 },
                        zIndex: this.lawn.state.zIndex + 3,
                    },
                )
                    .attachTo(this)

                this.phantomImage = new ImageEntity(
                    plantAnimation.getImageConfig(plantId),
                    {
                        position: { x: 0, y: 0 },
                        zIndex: this.lawn.state.zIndex + 2,
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
                this.holdingImage = new ImageEntity(
                    shovelAnimation.getImageConfig(shovelId),
                    {
                        position: { x: 5, y: 5 },
                        zIndex: this.lawn.state.zIndex + 3,
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
                    if (! target) this.phantomImage!.deactivate()
                    else if (target instanceof LawnBlockEntity) {
                        const { i, j } = target.config
                        if (this.isOccupied(i, j)) {
                            this.phantomImage!.deactivate()
                            return
                        }

                        const { x, y } = target.state.position
                        this.phantomImage!.activate().state.position = { x, y }
                    }
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

            const pauseButton = ButtonEntity.from(new ImageEntity(
                {
                    src: './assets/ui/pause_button.png',
                    containingMode: 'rect',
                },
                {
                    position: { x: this.width - 32, y: 5 },
                    zIndex: this.state.zIndex + 5,
                },
            ))
                .addComp(CursorComp, 'pointer')
                .attachTo(this)
                .on('click', () => {
                    this.freeze()
                    pauseButton.deactivate()
                    resumeButton.activate()
                })

            const resumeButton = ButtonEntity.from(new ImageEntity(
                {
                    src: './assets/ui/resume_button.png',
                    containingMode: 'rect',
                },
                {
                    position: { x: this.width - 32, y: 5 },
                    zIndex: this.state.zIndex + 5,
                },
            ))
                .addComp(CursorComp, 'pointer')
                .deactivate()
                .attachTo(this)
                .on('click', () => {
                    this.unfreeze()
                    resumeButton.deactivate()
                    pauseButton.activate()
                })
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
            { plantId, i, j },
            {
                position: this.getLawnBlockPosition(i, j),
                zIndex: this.lawn.state.zIndex + 2,
            }
        )

        const newPlantData: PlantData = {
            id: plantId,
            hp: metadata.hp,
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
        return this.lawn.lawnBlocks[i][j].state.position
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
        const deltaY = random((this.config.lawn.height - 2) * 80)
        const targetY = y + deltaY
        const life = deltaY / this.config.sun.sunDroppingVelocity + 4000

        const sun = SunEntity.create(
            {
                life,
                targetY,
            },
            {
                position: { x, y },
                zIndex: this.lawn.state.zIndex + 3,
            }
        )
            .attachTo(this)
            .on('click', () => {
                this.state.sun += 25
                sun.dispose()
            })
            .on('before-render', () => {
                const lifeComp = sun.getComp(LifeComp)!
                if (lifeComp.life < 3000) this.game.ctx.globalAlpha = 0.5 // TODO
            })
            .on('dispose', () => {
                remove(this.state.sunsData, sunData => sunData.entity === sun)
            })
        this.state.sunsData.push({
            lifeLimit: life,
            targetY,
            entity: sun,
        })
    }

    preUpdate() {
        if (this.frozen) {
            this.state = this.update()
            return
        }
        super.preUpdate()
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

    update() {
        if (this.holdingImage) {
            const { x, y } = this.game.mouse.position
            this.holdingImage.state.position = { x: x - 40, y: y - 40 }
        }

        if (this.frozen) return this.state

        this.updatePlantSlot()

        this.state.sunsData.forEach(({ entity, targetY }) => {
            if (entity.state.position.y < targetY) entity.state.position.y += (
                this.config.sun.sunDroppingVelocity * this.game.mspf
            )
        })

        this.useTimer('sunDropTimer', this.config.sun.sunDroppingInterval, () => this.dropSun())

        return this.state
    }

    preRender() {
        if (this.frozen) this.addRenderJob(() => {
            const { ctx } = this.game
            ctx.fillStyle = 'rgba(0, 32, 255, .3)'

            ctx.fillRect(0, 0, 10 + this.width, this.height)
        }, 4)

        super.preRender()
    }
}
