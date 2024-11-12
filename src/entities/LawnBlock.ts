import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from './Button'

export interface LawnBlockConfig extends ButtonConfig {}

export interface LawnBlockState extends ButtonState {
    i: number
    j: number
}

export interface LawnBlockEvents extends ButtonEvents {}

export class LawnBlockEntity extends ButtonEntity<LawnBlockConfig, LawnBlockState, LawnBlockEvents> {}