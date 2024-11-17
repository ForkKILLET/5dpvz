export const eq = <T>(a: T) => (b: T): boolean => a === b

export const neq = <T, U extends T>(a: U) => (b: T): b is Exclude<T, U> => a !== b
