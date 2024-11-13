import { getPlantImageSrc, PLANT_METADATA, PlantId, PlantMetadata } from '@/data/plants'
import { Entity, EntityEvents, EntityState, injectKey } from '@/engine'
import { LawnConfig, LawnEntity } from '@/entities/Lawn'
import { PlantSlotsConfig, UIEntity } from '@/entities/UI'
import { ImageEntity } from '@/entities/Image'
import { matrix, Nullable, remove } from '@/utils'
import { LawnBlockEntity } from '@/entities/LawnBlock'
import { PlantEntity } from '@/entities/Plant'
import { SunEntity } from './Sun'
import { random } from '@/utils/random'
import { LifeComp } from '@/comps/Life'
import {ShovelConfig} from "@/entities/Shovel.ts";

export interface LevelConfig {
    plantSlots: PlantSlotsConfig
    shovel: ShovelConfig
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
    targetY: number
    entity: SunEntity
}

export interface LevelUniqueState {
    sun: number
    sunDropTimer: number
    plantSlotsData: PlantSlotData[]
    holdingSlotId: Nullable<number>
    plantsData: PlantData[]
    plantsOnBlocks: Nullable<PlantData>[][]
    sunsData: SunData[]
}
export interface LevelState extends LevelUniqueState, EntityState {}

export interface LevelEvents extends EntityEvents {}

export const kLevelState = injectKey<LevelUniqueState>()

export class LevelEntity extends Entity<LevelConfig, LevelState, LevelEvents> {
    static initState = <S>(state: S): S & LevelUniqueState => ({
        ...state,
        sun: 0,
        sunDropTimer: 0,
        plantSlotsData: [],
        holdingSlotId: null,
        plantsData: [],
        plantsOnBlocks: null as any,
        sunsData: [],
    })

    ui: UIEntity
    lawn: LawnEntity
    phantomPlantImage: Nullable<ImageEntity> = null
    holdingPlantImage: Nullable<ImageEntity> = null

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
                isPlantable: metadata.isPlantableAtStart
            }
        })
        this.state.plantsOnBlocks = matrix(config.lawn.width, config.lawn.height, () => null)

        this.state.sun = config.sun.sunAtStart
        this.state.sunDropTimer = config.sun.sunDroppingInterval - config.sun.firstSunDroppingTime

        this.provide(kLevelState, this.state)

        this.ui = new UIEntity(
            config.plantSlots,
            {
                position: { x: 5, y: 5 },
                zIndex: 1
            }
        )
            .on('choose-plant', (slotId) => {
                const slot = this.state.plantSlotsData[slotId]
                if (! slot.isPlantable) return

                this.state.holdingSlotId = slotId
                const plantId = this.getPlantIdBySlotId(slotId)

                this.holdingPlantImage?.dispose()
                this.holdingPlantImage = new ImageEntity(
                    { src: getPlantImageSrc(plantId) },
                    {
                        position: { x: 5, y: 5 },
                        zIndex: this.lawn.state.zIndex + 3
                    }
                )
                    .attachTo(this)

                this.phantomPlantImage = new ImageEntity(
                    { src: getPlantImageSrc(plantId) },
                    {
                        position: { x: 0, y: 0 },
                        zIndex: this.lawn.state.zIndex + 2
                    }
                )
                    .on('before-render', () => {
                        this.game.ctx.globalAlpha = 0.5
                    })
                    .deactivate()
                    .attachTo(this)
            })

        this.lawn = new LawnEntity(
            config.lawn,
            {
                position: { x: 5, y: 150 },
                zIndex: this.state.zIndex + 1
            }
        )

        this.attach(this.ui, this.lawn)

        this.afterStart(() => {
            this.game.emitter.on('hoverTargetChange', target => {
                if (this.state.holdingSlotId === null) return

                if (! target) this.phantomPlantImage!.deactivate()
                else if (target instanceof LawnBlockEntity) {
                    const { i, j } = target.config
                    if (this.isOccupied(i, j)) {
                        this.phantomPlantImage!.deactivate()
                        return
                    }

                    const { x, y } = target.state.position
                    this.phantomPlantImage!.activate().state.position = { x, y }
                }
            })

            this.game.emitter.on('click', target => {
                if (this.state.holdingSlotId !== null && target instanceof LawnBlockEntity) {
                    const { i, j } = target.config
                    this.plant(this.state.holdingSlotId, i, j)
                }
            })

            this.game.emitter.on('rightclick', () => {
                if (this.state.holdingSlotId !== null) {
                    this.cancelHolding()
                }
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

        const newPlant = new PlantEntity(
            { plantId },
            PlantEntity.initState({
                position: this.getLawnBlockPosition(i, j),
                zIndex: this.lawn.state.zIndex + 2
            })
        )
        const newPlantData: PlantData = {
            id: plantId,
            hp: metadata.hp,
            position: { i, j },
            entity: newPlant
        }
        this.attach(newPlant)
        this.state.plantsData.push(newPlantData)
        this.state.plantsOnBlocks[i][j] = newPlantData

        this.cancelHolding()
    }

    isOccupied(i: number, j: number) {
        return this.state.plantsOnBlocks[i][j] !== null
    }

    getLawnBlockPosition(i: number, j: number) {
        return this.lawn.lawnBlocks[i][j].state.position
    }

    cancelHolding() {
        this.state.holdingSlotId = null
        this.holdingPlantImage!.dispose()
        this.holdingPlantImage = null
        this.phantomPlantImage!.dispose()
        this.phantomPlantImage = null
    }

    dropSun() {
        const { x: x0, y: y0 } = this.lawn.state.position
        const x = x0 + random((this.config.lawn.width - 1) * 80)
        const y = y0 + random(1 * 80)
        const targetY = y + random((this.config.lawn.height - 1) * 80)

        const sun = new SunEntity(
            {
                life: this.config.sun.sunLife,
                targetY
            },
            SunEntity.initState({
                position: { x, y },
                zIndex: this.lawn.state.zIndex + 2
            })
        )
            .attachTo(this)
            .on('click', () => {
                this.state.sun += 25
                sun.dispose()
            })
            .on('before-render', () => {
                const lifeComp = sun.getComp(LifeComp)!
                if (lifeComp.life < 3000) this.game.ctx.globalAlpha = 0.5
            })
            .on('dispose', () => {
                remove(this.state.sunsData, sunData => sunData.entity === sun)
            })
        this.state.sunsData.push({
            targetY,
            entity: sun
        })
    }

    update() {
        if (this.holdingPlantImage) {
            const { x, y } = this.game.mouse.position
            this.holdingPlantImage.state.position = { x: x - 40, y: y - 40 }
        }

        this.state.plantSlotsData.forEach((slot, i) => {
            let { cd, isCooledDown } = slot

            if (! isCooledDown) {
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

        this.state.sunsData.forEach(({ entity, targetY }) => {
            if (entity.state.position.y < targetY) {
                entity.state.position.y += this.config.sun.sunDroppingVelocity * this.game.mspf / 1000
            }
        })

        this.useTimer('sunDropTimer', this.config.sun.sunDroppingInterval, () => this.dropSun())

        return this.state
    }
}
