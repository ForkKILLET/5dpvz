export const id =
    <X>(x: X): X => x

export const eq =
    <X extends Y, Y>(x: X) => (y: Y): boolean => x === y

export const neq =
    <X extends Y, Y>(x: X) => (y: Y): y is Exclude<Y, X> => x !== y

export type Pred<X> = (x: X) => boolean
