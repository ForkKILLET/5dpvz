export interface Position {
    x: number
    y: number
}

export interface Rect {
    x: number
    y: number
    width: number
    height: number
}

export const inRect = (point: Position, rect: Rect) => (
    point.x >= rect.x && point.x < rect.x + rect.width &&
    point.y >= rect.y && point.y < rect.y + rect.height
)