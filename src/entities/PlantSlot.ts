import { EntityEvents, EntityState, Entity, inRect } from '@/engine'
import { ImageEntity } from '@/entities/Image'
import { PLANT_METADATA, PlantMetadata, PlantId, getPlantImageSrc } from '@/data/plants'
import { kLevelState } from '@/entities/Level'
import { HoverableComp, HoverableEvents } from '@/comps/Hoverable'
import { ShapeComp } from '@/comps/Shape'

export interface PlantSlotConfig {
    slotId: number
    plantId: PlantId
}

export interface PlantSlotState extends EntityState {}

export interface PlantSlotEvents extends HoverableEvents, EntityEvents {}

export class PlantSlotEntity extends Entity<PlantSlotConfig, PlantSlotState, PlantSlotEvents> {
    plantMetadata: PlantMetadata

    readonly width = 80 + 2
    readonly height = 80 + 20 + 2

    constructor(config: PlantSlotConfig, state: PlantSlotState) {
        super(config, state)

        const { position: { x, y }, zIndex } = this.state

        this
            .addComp(new ShapeComp(point => 
                inRect(point, { x, y, width: 80 + 2, height: 80 + 20 + 2 })
            ))
            .addComp(new HoverableComp())

        this.plantMetadata = PLANT_METADATA[this.config.plantId]

        this.afterStart(() => {
            this.attach(new ImageEntity(
                {
                    src: getPlantImageSrc(this.config.plantId),
                },
                {
                    position: { x: x + 1, y: y + 1 },
                    zIndex: zIndex + 2
                }
            ))
        })
    }

    preRender() {
        super.preRender()

        const { plantSlotsData: plantSlots } = this.inject(kLevelState)!
        const slot = plantSlots[this.config.slotId]

        const { ctx } = this.game
        const { position: { x, y } } = this.state
    
        this.addRenderJob(() => {
            ctx.strokeStyle = 'brown'
            ctx.strokeRect(x, y, this.width, this.height)

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
