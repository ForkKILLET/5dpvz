import { PLANT_METADATA, PlantMetadata } from '@/data/plants'
import { Entity, EntityEvents, EntityState, injectKey } from '@/engine'
import { LawnConfig, LawnEntity } from '@/entities/lawn'
import { PlantSlotsConfig, UIEntity } from '@/entities/ui'

export interface LevelConfig {
    plantSlots: PlantSlotsConfig
    lawn: LawnConfig
}

export interface PlantSlot {
    cd: number
    isPlantable: boolean
}

export interface LevelUniqueState {
    sun: number
    plantSlots: PlantSlot[]
}
export interface LevelState extends LevelUniqueState, EntityState {}

export interface LevelEvents extends EntityEvents {}

export const kLevelState = injectKey<LevelUniqueState>()

export class LevelEntity extends Entity<LevelConfig, LevelState, LevelEvents> {
    static initState = <S>(state: S): S & LevelUniqueState => ({
        ...state,
        sun: 100,
        plantSlots: []
    })

    ui: UIEntity
    lawn: LawnEntity

    plantMetadatas: PlantMetadata[] = []

    constructor(config: LevelConfig, state: LevelState) {
        super(config, state)

        this.state.plantSlots = this.config.plantSlots.plantNames.map((plantName, i) => {
            const metadata = this.plantMetadatas[i] = PLANT_METADATA[plantName]
            return {
                cd: 0,
                isPlantable: metadata.isPlantableAtStart
            }
        })

        this.provide(kLevelState, this.state)

        this.ui = new UIEntity(
            config.plantSlots,
            {
                position: { x: 5, y: 5 },
                zIndex: 1
            }
        )
            .enableAutoRender()
            .on('choose-plant', (_, slotId) => {
                const slot = this.state.plantSlots[slotId]
                if (! slot.isPlantable) return
                // const metadata = this.plantMetadatas[slotId]
                // alert(`You chose ${metadata.name} with CD ${(slot.cd / 1000).toFixed(2)}s at slot ${slotId}.`)
                slot.isPlantable = false
                slot.cd = 0
            })

        this.lawn = new LawnEntity(
            config.lawn,
            {
                position: { x: 5, y: 150 },
                zIndex: 0
            }
        ).enableAutoRender()

        this.delegate([ this.ui, this.lawn ])
    }

    update() {
        this.state.plantSlots.forEach((slot, i) => {
            let { cd, isPlantable } = slot
            if (isPlantable) return

            const { coolDown: maxCd } = this.plantMetadatas[i]
            cd += this.game.mspf
            if (cd > maxCd) {
                cd = maxCd
                isPlantable = true
            }

            slot.cd = cd
            slot.isPlantable = isPlantable
        })
        return this.state
    }
}