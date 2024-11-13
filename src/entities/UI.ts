import { EntityEvents, EntityState, Entity } from '@/engine'
import { PlantSlotEntity } from '@/entities/PlantSlot'
import { PlantId } from '@/data/plants'
import { SunSlotEntity } from '@/entities/SunSlot'
import { HoverableComp } from '@/comps/Hoverable'
import { ShovelSlotEntity } from '@/entities/ShovelSlot'

export interface PlantSlotsConfig {
    slotNum: number
    plantIds: PlantId[]
}

export interface UIConfig extends PlantSlotsConfig {}

export interface UIState extends EntityState {}

export interface UIEvents extends EntityEvents {
    'choose-plant': [ slotId: number ]
}

export class UIEntity extends Entity<UIConfig, UIState, UIEvents> {
    sunSlot: SunSlotEntity
    plantSlots: PlantSlotEntity[]
    shovelSlot: ShovelSlotEntity

    constructor(config: UIConfig, state: UIState) {
        super(config, state)

        const { position: { x, y }, zIndex } = this.state

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
                    emitter.on('click', () => this.emit('choose-plant', i))
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
        this.attach(this.sunSlot, ...this.plantSlots, this.shovelSlot)
    }
}
