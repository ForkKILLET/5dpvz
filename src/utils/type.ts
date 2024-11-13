export type RemoveIndex<T> = {
    [ K in keyof T as
        string extends K ? never :
        number extends K ? never :
        symbol extends K ? never :
        K
    ]: T[K]
}

export type Disposer = () => void

export type Nullable<T> = T | null
