export interface Vector2D {
    x: number
    y: number
}

export const vSub = (p1: Vector2D, p2: Vector2D): Vector2D => ({
    x: p1.x - p2.x,
    y: p1.y - p2.y,
})

export const vAdd = (p1: Vector2D, p2: Vector2D): Vector2D => ({
    x: p1.x + p2.x,
    y: p1.y + p2.y,
})

export const vZero = (): Vector2D => ({ x: 0, y: 0 })
