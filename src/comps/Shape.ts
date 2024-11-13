import { Position, Comp } from '@/engine'

export class ShapeComp extends Comp {
    constructor(public contains: (point: Position) => boolean) {
        super()
    }
}
