export const by = <X>(cmpGetter: (item: X) => number) => (a: X, b: X) => {
    const cmpA = cmpGetter(a)
    const cmpB = cmpGetter(b)
    return cmpA < cmpB ? - 1 : cmpA > cmpB ? 1 : 0
}

export const matrix = <X>(width: number, height: number, gen: (x: number, y: number) => X) => {
    const mat = []
    for (let i = 0; i < width; i ++) {
        const row = []
        for (let j = 0; j < height; j ++) row.push(gen(i, j))
        mat.push(row)
    }
    return mat
}

export const includes = <X>(item: X) => (array: X[]) => array.includes(item)

export const elem = <X, Y extends X>(...array: Y[]) => (item: X) => array.includes(item as Y)

export const remove = <X>(array: X[], pred: (item: X) => boolean) => {
    const index = array.findIndex(pred)
    if (index >= 0) array.splice(index, 1)
}

export const sum = (array: number[]): number => array.reduce((acc, curr) => acc + curr, 0)

export const replicate = <const T>(count: number, item: T): T[] => Array(count).fill(item)

export const replicateBy = <T>(count: number, gen: (index: number) => T): T[] =>
    Array.from({ length: count }).map((_, i) => gen(i))
