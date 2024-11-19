import { HoverableComp } from '@/comps/Hoverable'
import { RectShape } from '@/comps/Shape'
import { PlantId } from '@/data/plants'
import { ShovelId } from '@/data/shovels'
import { Entity, EntityEvents, EntityState } from '@/engine'
import { PlantSlotEntity } from '@/entities/ui/PlantSlot'
import { ShovelSlotEntity } from '@/entities/ui/ShovelSlot'
import { SunSlotEntity } from '@/entities/ui/SunSlot'

export interface PlantSlotsConfig {
    slotNum: number
    plantIds: PlantId[]
}

export interface UIConfig extends PlantSlotsConfig {}

export interface UIState extends EntityState {}

export interface UIEvents extends EntityEvents {
    'choose-plant': [ slotId: number ]
    'choose-shovel': [ shovelId: ShovelId ]
}

export class UIEntity extends Entity<UIConfig, UIState, UIEvents> {
    sunSlot: SunSlotEntity
    plantSlots: PlantSlotEntity[]
    shovelSlot: ShovelSlotEntity

    width: number
    height: number

    constructor(config: UIConfig, state: UIState) {
        super(config, state)

        const { position: { x, y }, zIndex } = this.state

        this.width = (this.config.slotNum + 2) * (80 + 2 + 5) - 5
        this.height = 80 + 20 + 2
        this.addComp(RectShape, { width: this.width, height: this.height, origin: 'top-left' })

        this.sunSlot = new SunSlotEntity(
            {},
            {
                position: { x, y },
                zIndex: zIndex + 1,
            },
        )
        this.plantSlots = this.config.plantIds.map((plantName, i) => (
            new PlantSlotEntity(
                {
                    plantId: plantName,
                    slotId: i,
                },
                {
                    position: { x: x + (i + 1) * (80 + 2 + 5), y },
                    zIndex: zIndex + 1,
                },
            )
                .withComp(HoverableComp, ({ emitter }) => {
                    emitter.on('click', ({ stop }) => {
                        stop()
                        this.emit('choose-plant', i)
                    })
                })
        ))
        this.shovelSlot = new ShovelSlotEntity(
            {
                shovelId: 'iron_shovel',
            },
            {
                position: { x: x + (this.config.slotNum + 1) * (80 + 2 + 5), y },
                zIndex: zIndex + 1,
            },
        )
            .withComp(HoverableComp, hoverable => hoverable!.emitter.on('click', ({ stop }) => {
                stop()
                this.emit('choose-shovel', this.shovelSlot.config.shovelId)
            }))

        this.attach(this.sunSlot, ...this.plantSlots, this.shovelSlot)
    }
}
