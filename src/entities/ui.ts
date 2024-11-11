import { CommonEvents, CommonState, Entity, Game } from '@/engine'
import { SlotEntity, SlotState } from '@/entities/slot'
import { PlantName } from '@/data/plants'

export interface UIConfig {
    slotNum: number
    plantNames: PlantName[]
}

export interface UIUniqueState {
    slots: SlotState[]
}
export interface UIState extends UIUniqueState, CommonState {}

export interface UIEvents extends CommonEvents {}

export class UIEntity extends Entity<UIConfig, UIState, UIEvents> {
    static initState = <S>(state: S): S & UIUniqueState => ({
        ...state,
        slots: []
    })

    slots: SlotEntity[] = []

    constructor(config: UIConfig, state: UIState) {
        super(config, state)

        const { position: { x, y }, zIndex } = this.state
        this.delegatedEntities.push(...this.slots = this.config.plantNames.map((plantName, i) => new SlotEntity(
            {
                plantName
            },
            SlotEntity.initState({
                position: { x: x + i * (80 + 2 + 5), y },
                zIndex: zIndex + 1,
            })
        )))
    }

    update() {
        this.state.slots = this.slots.map(slot => slot.state)
        return this.state
    }

    render() {
        this.slots.forEach(slot => slot.runRender())
    }
}