import { CommonEvents, CommonState, Entity } from '@/engine'

export interface GardenConfig {}

export interface GardenState extends CommonState {}

export interface GardenEvents extends CommonEvents {}

export class GardenEntity extends Entity<GardenConfig, GardenState, GardenEvents> {
    constructor(config: GardenConfig, public state: GardenState) {
        super(config, state)
    }

    render(): void {}

    update(): GardenState {
        return this.state
    }
}