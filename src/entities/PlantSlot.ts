import { ImageEntity } from '@/entities/Image'
import { plantAnimation, PLANT_METADATA, PlantMetadata, PlantId } from '@/data/plants'
import { kLevelState } from '@/entities/Level'
import { SlotConfig, SlotEntity, SlotEvents, SlotState } from '@/entities/Slot'
import { CursorComp } from '@/comps/Cursor'

export interface PlantSlotConfig extends SlotConfig {
    slotId: number
    plantId: PlantId
}

export interface PlantSlotState extends SlotState {}

export interface PlantSlotEvents extends SlotEvents {}

export class PlantSlotEntity extends SlotEntity<PlantSlotConfig, PlantSlotState, PlantSlotEvents> {
    plantMetadata: PlantMetadata

    constructor(config: PlantSlotConfig, state: PlantSlotState) {
        super(config, state)

        const { position: { x, y }, zIndex } = this.state

        this.plantMetadata = PLANT_METADATA[this.config.plantId]

        this
            .attach(ImageEntity.create(
                plantAnimation.getImageConfig(this.config.plantId),
                {
                    position: { x: x + 1, y: y + 1 },
                    zIndex: zIndex + 2,
                },
            ))
            .addComp(CursorComp, 'pointer')
    }

    preRender() {
        super.preRender()

        const { plantSlotsData: plantSlots } = this.inject(kLevelState)!
        const slot = plantSlots[this.config.slotId]

        const { ctx } = this.game
        const { position: { x, y } } = this.state

        this.addRenderJob(() => {
            ctx.fillStyle = slot.isSunEnough ? 'black' : 'red'
            ctx.font = '20px Sans'
            const costString = String(this.plantMetadata.cost)
            const { width } = ctx.measureText(costString)
            ctx.fillText(costString, x + 1 + (80 - width) / 2, y + 1 + 80 + 20 - 2)
        }, 0)

        if (! slot.isPlantable) {
            this.addRenderJob(() => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
                ctx.fillRect(x, y, this.width, this.height)
                if (! slot.isCooledDown) {
                    const cdPercent = slot.cd / this.plantMetadata.cd
                    ctx.fillRect(x, y, this.width, (1 - cdPercent) * this.height)
                }
            }, 2)
        }
    }
}
