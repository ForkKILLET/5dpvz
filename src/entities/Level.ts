import { getPlantImageSrc, PLANT_METADATA, PlantId, PlantMetadata } from '@/data/plants'
import { Entity, EntityEvents, EntityState, Game, injectKey } from '@/engine'
import { LawnConfig, LawnEntity } from '@/entities/Lawn'
import { PlantSlotsConfig, UIEntity } from '@/entities/UI'
import { ImageEntity } from '@/entities/Image'
import { includes, matrix } from '@/utils'
import { LawnBlockEntity } from './LawnBlock'
import { PlantEntity } from './Plant'

export interface LevelConfig {
    plantSlots: PlantSlotsConfig
    lawn: LawnConfig
}

export interface PlantSlot {
    cd: number
    isCooledDown: boolean
    isSunEnough: boolean
    isPlantable: boolean
}

export interface Plant {
    id: PlantId
    hp: number
    position: { i: number, j: number }
    entity: PlantEntity
}

export interface LevelUniqueState {
    sun: number
    plantSlots: PlantSlot[]
    holdingSlotId: number | null
    plants: Plant[]
    plantsOnBlocks: (Plant | null)[][]
}
export interface LevelState extends LevelUniqueState, EntityState {}

export interface LevelEvents extends EntityEvents {}

export const kLevelState = injectKey<LevelUniqueState>()

export class LevelEntity extends Entity<LevelConfig, LevelState, LevelEvents> {
    static initState = <S>(state: S): S & LevelUniqueState => ({
        ...state,
        sun: 500,
        plantSlots: [],
        plants: [],
        plantsOnBlocks: null as any,
        holdingSlotId: null
    })

    ui: UIEntity
    lawn: LawnEntity

    phantomPlantImage: ImageEntity | null = null
    holdingPlantImage: ImageEntity | null = null

    plantMetadatas: PlantMetadata[] = []

    getPlantIdBySlotId(slotId: number) {
        return this.config.plantSlots.plantIds[slotId]
    }

    constructor(config: LevelConfig, state: LevelState) {
        super(config, state)

        this.state.plantSlots = this.config.plantSlots.plantIds.map((plantName, i) => {
            const metadata = this.plantMetadatas[i] = PLANT_METADATA[plantName]
            return {
                cd: 0,
                isSunEnough: metadata.cost <= this.state.sun,
                isCooledDown: true,
                isPlantable: metadata.isPlantableAtStart
            }
        })
        this.state.plantsOnBlocks = matrix(config.lawn.width, config.lawn.height, () => null)

        this.provide(kLevelState, this.state)

        this.ui = new UIEntity(
            config.plantSlots,
            {
                position: { x: 5, y: 5 },
                zIndex: 1
            }
        )
            .enableAutoRender()
            .on('choose-plant', (slotId) => {
                const slot = this.state.plantSlots[slotId]
                if (! slot.isPlantable) return

                this.state.holdingSlotId = slotId
                const plantId = this.getPlantIdBySlotId(slotId)

                this.holdingPlantImage?.dispose()
                const holdingPlantImage = new ImageEntity(
                    { src: getPlantImageSrc(plantId) },
                    {
                        position: { x: 5, y: 5 },
                        zIndex: this.lawn.state.zIndex + 3
                    }
                )
                holdingPlantImage.start(this.game).then(() => {
                    this.holdingPlantImage = holdingPlantImage
                })

                const phantomPlantImage = new ImageEntity(
                    { src: getPlantImageSrc(plantId) },
                    {
                        position: { x: 0, y: 0 },
                        zIndex: this.lawn.state.zIndex + 2
                    }
                )
                    .deactivate()
                    .on('before-render', () => {
                        this.game.ctx.globalAlpha = 0.5
                    })
                    .startThen(this.game, () => {
                        this.phantomPlantImage = phantomPlantImage
                    })
            })

        this.lawn = new LawnEntity(
            config.lawn,
            {
                position: { x: 5, y: 150 },
                zIndex: this.state.zIndex + 1
            }
        ).enableAutoRender()

        this.delegate(this.ui, this.lawn)
    }

    async plant(slotId: number, i: number, j: number) {
        const slot = this.state.plantSlots[slotId]
        if (! slot.isPlantable || this.isOccupied(i, j)) return

        const plantId = this.getPlantIdBySlotId(slotId)
        const metadata = PLANT_METADATA[plantId]
        const cost = metadata.cost

        slot.cd = 0
        slot.isCooledDown = false
        this.state.sun -= cost

        const newPlant: Plant = {
            id: plantId,
            hp: metadata.hp,
            position: { i, j },
            entity: await new PlantEntity(
                { plantId },
                PlantEntity.initState({
                    position: this.getLawnBlockPosition(i, j),
                    zIndex: this.lawn.state.zIndex + 2
                })
            ).start(this.game)
        }
        this.state.plants.push(newPlant)
        this.state.plantsOnBlocks[i][j] = newPlant
        
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

    async start(game: Game) {
        await super.start(game)

        game.emitter.on('hoverTargetChange', target => {
            if (this.state.holdingSlotId === null) return

            if (! target) this.phantomPlantImage!.deactivate()
            else if (target instanceof LawnBlockEntity) {
                const { i, j } = target.state
                if (this.isOccupied(i, j)) {
                    this.phantomPlantImage!.deactivate()
                    return
                }

                const { x, y } = target.state.position
                this.phantomPlantImage!.activate().state.position = { x, y }
            }
        })

        game.emitter.on('click', target => {
            if (this.state.holdingSlotId !== null && target instanceof LawnBlockEntity) {
                const { i, j } = target.state
                this.plant(this.state.holdingSlotId, i, j)
            }
        })

        game.emitter.on('rightclick', () => {
            if (this.state.holdingSlotId !== null) {
                this.cancelHolding()
            }
        })

        return this
    }

    preRunder() {
        super.preRunder()

        this.state.plants.forEach(plant => plant.entity.runRender())

        this.holdingPlantImage?.runRender()
        this.phantomPlantImage?.runRender()
    }

    update() {
        this.state.plants.forEach(plant => plant.entity.runUpdate())

        if (this.holdingPlantImage) {
            const { x, y } = this.game.mouse.position
            this.holdingPlantImage.state.position = { x: x - 40, y: y - 40 }
        }

        this.state.plantSlots.forEach((slot, i) => {
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
        return this.state
    }
}