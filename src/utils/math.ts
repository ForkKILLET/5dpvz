export const fixed = (value: number, precision = 2): number => {
    const multiplier = Math.pow(10, precision)
    return Math.round(value * multiplier) / multiplier
}

export const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max)

export const abs = (value: number): number =>
    Math.abs(value)
