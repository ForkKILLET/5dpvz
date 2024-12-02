/* eslint-disable @stylistic/ts/indent */

export type RemoveIndex<T> = {
    [ K in keyof T as
        string extends K ? never :
        number extends K ? never :
        symbol extends K ? never :
        K
    ]: T[K]
}

export type OrElse<T, D> = keyof T extends never ? D : T
export type SafelyRemoveIndex<T> = OrElse<RemoveIndex<T>, T>

export type Disposer = () => void

export type Nullable<T> = T | null

export type PartialBy<T, K extends keyof T> = StrictOmit<T, K> & Partial<Pick<T, K>>
export type RequiredBy<T, K extends keyof T> = StrictOmit<T, K> & Required<Pick<T, K>>

export type StrictOmit<T, K extends keyof T> = Omit<T, K>
export type StrictPick<T, K extends keyof T> = Pick<T, K>

export type Direction = 1 | - 1
