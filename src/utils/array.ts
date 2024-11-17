export const by = <T, U>(cmpGetter: (item: T) => U) => (a: T, b: T) => {
    const cmpA = cmpGetter(a)
    const cmpB = cmpGetter(b)
    return cmpA < cmpB ? - 1 : cmpA > cmpB ? 1 : 0
}

export const matrix = <T>(width: number, height: number, cb: (x: number, y: number) => T) => {
    const mat = []
    for (let x = 0; x < width; x ++) {
        const row = []
        for (let y = 0; y < height; y ++) {
            row.push(cb(x, y))
        }
        mat.push(row)
    }
    return mat
}

export const includes = <T>(array: T[], item: any) => array.includes(item)

export const remove = <T>(array: T[], pred: (item: T) => boolean) => {
    const index = array.findIndex(pred)
    if (index >= 0) array.splice(index, 1)
}

export const sum = <T>(array: T[], selector: (item: T) => number): number => {
    return array.reduce((acc, item) => acc + selector(item), 0)
}

export const rep = <T>(...args: (T | number)[]): T[] => {
    if (args.length % 2 !== 0) {
        throw new Error('Argument must be even')
    }

    const result: T[] = []

    for (let i = 0; i < args.length; i += 2) {
        const value = args[i] as T
        const repeatCount = args[i + 1] as number

        if (repeatCount < 0) {
            throw new Error('Repeat count must be greater than 0')
        }

        for (let j = 0; j < repeatCount; j ++) {
            result.push(value)
        }
    }

    return result
}

