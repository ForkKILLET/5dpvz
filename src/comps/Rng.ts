import { Comp, CompCtor } from '@/engine'

export interface RandomConfig {}

export interface RandomState {
    seed: number
}

export class RngComp extends Comp<RandomConfig, RandomState> {
    static create<M extends Comp>(this: CompCtor<M>, entity: M['entity'], initSeed: number) {
        return new this(entity, {}, { seed: initSeed })
    }

    protected next(): number {
        this.state.seed = (this.state.seed * 1145147 + 1919810255) % (2 ** 32)
        return this.state.seed / (2 ** 32)
    }

    public random(max: number): number
    public random(min: number, max: number): number
    public random(min: number, max?: number): number {
        const rand = this.next()
        if (max === undefined) {
            max = min
            min = 0
        }
        return Math.floor(rand * (max - min) + min)
    }
}
