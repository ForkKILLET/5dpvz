export const by = <T, U>(cmpGetter: (item: T) => U) => (a: T, b: T) => {
    const cmpA = cmpGetter(a)
    const cmpB = cmpGetter(b)
    return cmpA < cmpB ? -1 : cmpA > cmpB ? 1 : 0
}