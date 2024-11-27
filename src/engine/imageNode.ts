import { shearImage } from '@/utils/imageOperation'

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

export class ShearImageNode extends ImageNode {
    private shearX: number
    private shearY: number

    constructor(input: ImageNodeInput, shearX: number = 0, shearY: number = 0) {
        super(input, imageData => this.shearImage(imageData))
        this.shearX = shearX
        this.shearY = shearY
    }

    private shearImage(imageData: ImageData): ImageData {
        return shearImage(imageData, this.shearX, this.shearY)
    }

    setShearX(shearX: number) {
        this.shearX = shearX
        this.markDirty()
    }

    setShearY(shearY: number) {
        this.shearY = shearY
        this.markDirty()
    }
}
