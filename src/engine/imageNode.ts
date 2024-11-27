
type ImageNodeInput = ImageData | Node
type ImageNodeOutput = ImageData

export class ImageNode {
    private cache: ImageNodeOutput | null = null
    private lastInputVersion: number | null = null
    private dependents: Node[] = []

    constructor(
        private input: ImageNodeInput,
        private processFunc: (input: ImageData) => ImageNodeOutput
    ) {}

    getOutput(): ImageNodeOutput {
        const { inputData, version } = this.resolveInput()

        if (this, this.lastInputVersion === version && this.cache) {
            return this.cache!
        }

        const output = this.processFunc(inputData)
        this.cache = output
        this.lastInputVersion = version
        return output
    }

    private resolveInput(): { inputData: ImageData, version: number } {
        if (this.input instanceof ImageNode) {
            return {
                inputData: this.input.getOutput(),
                version: this.input.getVersion(),
            }
        }
        else {
            return {
                inputData: <ImageData> this.input,
                version: this.getVersion(),
            }
        }
    }

    getVersion(): number {
        return 1
    }

    markDirty() {
        this.cache = null
        this.lastInputVersion = null
    }

    addDependent(node: Node) {
        this.dependents.push(node)
    }
}
