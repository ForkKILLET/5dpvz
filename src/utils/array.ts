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
