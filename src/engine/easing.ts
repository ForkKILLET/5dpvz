export const easeInSine = (t: number) => 1 - Math.cos(t * Math.PI / 2)

export const easeOutSine = (t: number) => Math.sin(t * Math.PI / 2)

export const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, - 10 * t)
