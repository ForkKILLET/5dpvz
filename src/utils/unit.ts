export type Unit<U extends string> = [ unit: U, value: number ]

export const createUnit = <const U extends string>(unit: U) => (value: number): Unit<U> => [ unit, value ]

export const px = createUnit('px')
export const pct = createUnit('%')

export const unitToString = ([ unit, value ]: Unit<string>): string => `${ value }${ unit }`
export const unitLikeToString = (unit: Unit<string> | string) => typeof unit === 'string' ? unit : unitToString(unit)
