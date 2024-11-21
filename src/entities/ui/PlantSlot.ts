import { plantTextures, PLANTS, PlantMetadata, PlantId } from '@/data/plants'
import { kLevel } from '@/entities/Level'
import { SlotConfig, SlotEntity, SlotEvents, SlotState } from '@/entities/ui/Slot'
import { CursorComp } from '@/comps/Cursor'
import { TextureEntity } from '../Texture'

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

        this.plantMetadata = PLANTS[this.config.plantId]

        this
            .attach(TextureEntity.createTextureFromImage(
                plantTextures.getImageSrc(this.config.plantId),
                {},
                {
                    position: { x: x + 1, y: y + 1 },
                    zIndex: zIndex + 2,
                },
            ))
            .addComp(CursorComp, 'pointer')
    }

    preRender() {
        super.preRender()

        const { plantSlotsData } = this.inject(kLevel)!.state
        const slot = plantSlotsData[this.config.slotId]

        const { ctx } = this.game
        const { position: { x, y } } = this.state

        this.addRenderJob(() => {
            ctx.fillStyle = slot.isSunEnough ? 'black' : 'red'
            ctx.textAlign = 'center'
            ctx.font = '20px Sans'
            const costString = String(this.plantMetadata.cost)
            ctx.fillText(costString, x + 1 + 80 / 2, y + 1 + 80 + 20 - 2)
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
