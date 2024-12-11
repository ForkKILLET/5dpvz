import { Vector2D } from '@/engine'
import { Tuple } from '@/utils'

export interface Size {
    width: number
    height: number
}

export interface Rect extends Vector2D, Size {}

export const rectToTuple = (rect: Rect): Tuple<number, 4> => [
    rect.x,
    rect.y,
    rect.width,
    rect.height,
]

export interface RectP {
    x1: number
    y1: number
    x2: number
    y2: number
}
