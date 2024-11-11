import { EntityEvents, EntityState, Entity, inRect } from '@/engine'
import { ImageEntity } from '@/entities/image'
import { kLevelState } from './level'

export interface SunSlotConfig {}

export interface SunSlotState extends EntityState {}

export interface SunSlotEvents extends EntityEvents {}

export class SunSlotEntity extends Entity<SunSlotConfig, SunSlotState, SunSlotEvents> {
    sumImage: ImageEntity = null as any

    readonly width = 80 + 2
    readonly height = 80 + 20 + 2

    constructor(config: SunSlotConfig, state: SunSlotState) {
        super(config, state)


        const { position: { x, y }, zIndex } = this.state

        this.delegatedEntities.push(this.sumImage = new ImageEntity(
            {
                src: './assets/sun.png'
            },
            {
                position: { x: x + 1, y: y + 1 },
                zIndex: zIndex + 1
            }
        ))
    }

    get isHovering() {
        const { x, y } = this.state.position
        const { mouse } = this.game

        return inRect(mouse.position, { x, y, width: 80 + 2, height: 80 + 20 + 2 })
    }

    render() {
        const { sun } = this.inject(kLevelState)!

        const { ctx } = this.game
        const { position: { x, y } } = this.state
    
        ctx.strokeStyle = 'brown'
        ctx.strokeRect(x, y, this.width, this.height)

        this.sumImage.runRender()

        ctx.fillStyle = 'black'
        ctx.font = '20px Sans'
        const sunString = String(sun)
        const { width } = ctx.measureText(sunString)
        ctx.fillText(sunString, x + 1 + (80 - width) / 2, y + 1 + 80 + 20 - 2)
    }
}