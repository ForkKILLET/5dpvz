import { plantTextures, PLANTS, PlantMetadata, PlantId } from '@/data/plants'
import { kProcess } from '@/entities/Process'
import { SlotConfig, SlotEntity, SlotEvents, SlotState } from '@/entities/ui/Slot'
import { CursorComp } from '@/comps/Cursor'
import { TextureEntity } from '@/entities/Texture'
import { StrictOmit } from '@/utils'

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

        const { pos: { x, y }, zIndex } = this.state

        this.plantMetadata = PLANTS[this.config.plantId]

        this
            .attach(TextureEntity.createTextureFromImage(
                plantTextures.getImageSrc(this.config.plantId),
                {},
                {
                    pos: { x: x + 1, y: y + 1 },
                    zIndex: zIndex + 2,
                },
            ))
            .addComp(CursorComp, 'pointer')
    }

    static createPlantSlot(config: PlantSlotConfig, state: StrictOmit<SlotState, 'size'>) {
        return PlantSlotEntity.createSlot(config, state)
    }

    preRender() {
        super.preRender()

        const { plantSlotsData } = this.inject(kProcess)!.state
        const slot = plantSlotsData[this.config.slotId]

        const { ctx } = this

        this.addRenderJob(() => {
            ctx.fillStyle = slot.isSunEnough ? 'black' : 'red'
            ctx.textAlign = 'center'
            ctx.font = '20px Sans'
            const costString = String(this.plantMetadata.cost)
            ctx.fillText(costString, 1 + 80 / 2, 1 + 80 + 20 - 2)
        }, 0)

        if (! slot.isPlantable) {
            this.addRenderJob(() => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
                const { width, height } = this.state.size
                ctx.fillRect(0, 0, width, height)
                if (! slot.isCooledDown) {
                    const cdPercent = slot.cd / this.plantMetadata.cd
                    ctx.fillRect(0, 0, width, (1 - cdPercent) * height)
                }
            }, 2)
        }
    }
}
