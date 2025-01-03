import { elem } from '@/utils'

export const id =
    <X>(x: X): X => x

export const eq =
    <X extends Y, Y>(x: X) => (y: Y): boolean => x === y

export const neq =
    <X extends Y, Y>(x: X) => (y: Y): y is Exclude<Y, X> => x !== y

export const not = <X>(f: Pred<X>): Pred<X> => x => ! f(x)

export type Pred<X> = (x: X) => boolean

export type Primitive = string | number | boolean | null | undefined | symbol | bigint

export const isPrimitive = (x: unknown): x is Primitive =>
    elem('string', 'number', 'boolean', 'undefined', 'symbol', 'bigint')(typeof x) || x === null
