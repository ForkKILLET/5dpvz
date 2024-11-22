export class Random {
    private seed: number
    private count: number

    constructor(seed: number) {
        this.seed = seed
        this.count = 0
    }

    private next(): number {
        this.count ++
        this.seed = (this.seed * 1145147 + 1919810255) % (2 ** 32)
        return this.seed / (2 ** 32)
    }

    public random(min: number, max?: number): number {
        const rand = this.next()
        if (max === undefined) {
            max = min
            min = 0
        }
        return Math.floor(rand * (max - min) + min)
    }
}
