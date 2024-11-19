import { ImageEntity } from '@/entities/Image'
import { kLevelState } from '@/entities/Level'
import { SlotConfig, SlotEntity, SlotEvents, SlotState } from '@/entities/ui/Slot'

export interface SunSlotConfig extends SlotConfig {}

export interface SunSlotState extends SlotState {}

export interface SunSlotEvents extends SlotEvents {}

export class SunSlotEntity extends SlotEntity<SunSlotConfig, SunSlotState, SunSlotEvents> {
    sumImage: ImageEntity

    constructor(config: SunSlotConfig, state: SunSlotState) {
        super(config, state)

        const { position: { x, y }, zIndex } = this.state

        this.sumImage = ImageEntity.create(
            {
                src: './assets/sun.png',
            },
            {
                position: { x: x + 1, y: y + 1 },
                zIndex: zIndex + 1,
            },
        )
        this.attach(this.sumImage)
    }

    render() {
        const { sun } = this.inject(kLevelState)!

        const { ctx } = this.game
        const { position: { x, y } } = this.state

        ctx.fillStyle = 'black'
        ctx.textAlign = 'center'
        ctx.font = '20px Sans'
        const sunString = String(sun)
        ctx.fillText(sunString, x + 1 + 80 / 2, y + 1 + 80 + 20 - 2)
    }
}
