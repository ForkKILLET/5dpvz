export type Dict<X = any> = Record<string, X>

export const omit = <T extends {}, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result: any = {}
    for (const key of Object.keys(obj))
        if (! keys.includes(key as K)) result[key] = obj[key as K]
    return result
}

export const pick = <T extends {}, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result: any = {}
    for (const key of keys) result[key] = obj[key]
    return result
}

export const mapk =
    <D extends Dict, K extends keyof D, R>(k: K, f: (x: D[K]) => R) =>
        (x: D): R => f(x[k])
