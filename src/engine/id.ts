export const createIdGenerator = () => {
    let id = 0
    return () => id ++
}
