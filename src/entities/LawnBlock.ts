import { ButtonConfig, ButtonEntity, ButtonEvents, ButtonState } from '@/entities/Button'

export interface LawnBlockConfig extends ButtonConfig {
    i: number
    j: number
}

export interface LawnBlockState extends ButtonState {}

export interface LawnBlockEvents extends ButtonEvents {}

export class LawnBlockEntity extends ButtonEntity<LawnBlockConfig, LawnBlockState, LawnBlockEvents> {}
