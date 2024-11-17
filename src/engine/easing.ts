export const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, - 10 * t)
