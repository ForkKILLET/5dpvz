import { ClickableEvents, EntityEvents, EntityState, Entity, Game, inRect } from '@/engine'
import { ImageEntity } from '@/entities/image'
import { PLANT_METADATA, PlantMetadata, PlantName } from '@/data/plants'
import { kPlantSlots } from './level'

export interface PlantSlotConfig {
    slotId: number
    plantName: PlantName
}

export interface PlantSlotState extends EntityState {}

export interface PlantSlotEvents extends ClickableEvents, EntityEvents {}

export class PlantSlotEntity extends Entity<PlantSlotConfig, PlantSlotState, PlantSlotEvents> {
    plantMetadata: PlantMetadata
    plantImage: ImageEntity = null as any

    readonly width = 80 + 2
    readonly height = 80 + 20 + 2

    constructor(config: PlantSlotConfig, state: PlantSlotState) {
        super(config, state)

        this.plantMetadata = PLANT_METADATA[this.config.plantName]

        const { position: { x, y }, zIndex } = this.state

        this.delegatedEntities.push(this.plantImage = new ImageEntity(
            {
                src: `./assets/plants/${this.config.plantName}/01.png`
            },
            {
                position: { x: x + 1, y: y + 1 },
                zIndex: zIndex + 1
            }
        ))
    }

    async start(game: Game) {
        await super.start(game)

        // TODO: use mixin
        this.disposers.push(game.mouse.emitter.on('click', () => {
            if (this.isHovering) this.emitter.emit('click', this)
        }))
    }

    get isHovering() {
        const { x, y } = this.state.position
        const { mouse } = this.game

        return inRect(mouse.position, { x, y, width: 80 + 2, height: 80 + 20 + 2 })
    }

    render() {
        const slot = this.inject(kPlantSlots)![this.config.slotId]

        const { ctx } = this.game
        const { position: { x, y } } = this.state
    
        ctx.strokeStyle = 'brown'
        ctx.strokeRect(x, y, this.width, this.height)

        this.plantImage.runRender()

        if (! slot.isPlantable) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
            ctx.fillRect(x, y, this.width, this.height)
            const cdPercent = slot.cd / this.plantMetadata.coolDown
            ctx.fillRect(x, y, this.width, (1 - cdPercent) * this.height)
        }

        ctx.fillStyle = 'black'
        ctx.font = '20px Sans'
        const costString = String(this.plantMetadata.cost)
        const { width } = ctx.measureText(costString)
        ctx.fillText(costString, x + 1 + (80 - width) / 2, y + 1 + 80 + 20 - 2)
    }
}