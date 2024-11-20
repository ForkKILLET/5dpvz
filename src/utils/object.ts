export const omit = <T extends {}, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result: any = {}
    Object.keys(obj).forEach(key => {
        if (! keys.includes(key as K))
            result[key] = obj[key as K]
    })
    return result
}

export const pick = <T extends {}, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result: any = {}
    keys.forEach(key => {
        result[key] = obj[key]
    })
    return result
}
