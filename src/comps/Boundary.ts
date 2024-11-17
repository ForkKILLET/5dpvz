import { Comp, Entity, isInRect, Position } from '@/engine'

export class BoundaryComp extends Comp {
    private _x: number | null = null
    get x() {
        return this._x ?? this.entity.state.position.x
    }
    set x(value) {
        this._x = value
    }

    private _y: number | null = null
    get y() {
        return this._y ?? this.entity.state.position.y
    }
    set y(value) {
        this._y = value
    }

    constructor(entity: Entity, public width: number, public height: number, x?: number, y?: number) {
        super(entity)
        if (typeof x === 'number') this.x = x
        if (typeof y === 'number') this.y = y
    }

    contains(point: Position) {
        return isInRect(point, this)
    }
}
