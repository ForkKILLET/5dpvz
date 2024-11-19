import { fixed } from '@/utils'

export interface Position {
    x: number
    y: number
}

export const positionSubtract = (p1: Position, p2: Position): Position => ({
    x: p1.x - p2.x,
    y: p1.y - p2.y,
})

export const positionAdd = (p1: Position, p2: Position): Position => ({
    x: p1.x + p2.x,
    y: p1.y + p2.y,
})

export type Movement = () => Position | null

export const linear = (speed: number, angle: number): Movement => () => ({
    x: speed * fixed(Math.cos(angle)),
    y: speed * fixed(Math.sin(angle)),
})

export const linearWithDistance = (speed: number, angle: number, distance: number) =>
    withCount(linear(speed, angle), distance / speed)

export const linearTo = (speed: number, from: Position, to: Position): Movement => {
    const delta = positionSubtract(to, from)
    const angle = Math.atan2(delta.y, delta.x)
    const distance = Math.hypot(delta.x, delta.y)
    return linearWithDistance(speed, angle, distance)
}

export const withCount = (movement: Movement, count: number) => {
    let i = 0
    return () => ++ i < count ? movement() : null
}

export const concat = (movements: Movement[]): Movement => () => {
    for (const movement of movements) {
        const delta = movement()
        if (delta !== null) return delta
    }
    return null
}

export const movement = {
    linear,
    linearWithDistance,
    withCount,
    concat,
}

export const ANGLES = {
    up: - Math.PI / 2,
    down: Math.PI / 2,
    left: Math.PI,
    right: 0,
    upLeft: - Math.PI * 3 / 4,
    upRight: - Math.PI / 4,
    downLeft: Math.PI * 3 / 4,
    downRight: Math.PI / 4,
}
