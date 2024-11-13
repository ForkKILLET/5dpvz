interface random {
    (min: number, max: number): number
    (max: number): number
}

export const random: random = (a: number, b?: number): number => {
    const offset = b === undefined ? 0 : a
    const length = b === undefined ? a : b - a
    return offset + Math.floor(Math.random() * length)
}
