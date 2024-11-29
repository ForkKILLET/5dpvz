import { TextureEntity } from '@/entities/Texture'
import { Endo, id } from '@/utils'

type RenderData = { imageData: ImageData, offset: { x: number, y: number } }

type Processor = Endo<RenderData>

export class PipelineError extends Error {}

export interface ImageNodeCtor<N extends RenderNode> {
    new (...args: any): N
    name: string
    leftCount: number[]
    rightCount: number[]
}

export class RenderNode {
    static leftCount: number[] = []
    static rightCount: number[] = []

    get Ctor() {
        return this.constructor as ImageNodeCtor<this>
    }

    constructor(protected processor: Processor) {}

    protected _lefts: RenderNode[] = []
    get lefts(): RenderNode[] {
        return this._lefts
    }
    set lefts(value: RenderNode[]) {
        const { leftCount, name } = this.Ctor
        if (! leftCount.includes(value.length))
            throw new PipelineError(`${ name } expect ${ leftCount.join(' | ') } lefts, but got ${ value.length }`)
        this._lefts = value
    }

    protected _rights: RenderNode[] = []
    get rights(): RenderNode[] {
        return this._rights
    }
    set rights(value: RenderNode[]) {
        const { rightCount, name } = this.Ctor
        if (! rightCount.includes(value.length))
            throw new PipelineError(`${ name } expect ${ rightCount.join(' | ') } rights, but got ${ value.length }`)
        this._rights = value
    }

    protected cache: Map<number, RenderData> = new Map()

    getOutput(frameIndex: number): RenderData {
        if (this.cache.has(frameIndex)) {
            return this.cache.get(frameIndex)!
        }

        if (this.lefts.length === 0) {
            throw new Error('No input node provided.')
        }

        const inputData = this.lefts[0].getOutput(frameIndex)
        const output = this.processor(inputData)
        this.cache.set(frameIndex, output)
        return output
    }

    clearCache() {
        this.cache.clear()
    }
}

export class RenderPipeline {
    private nodes: RenderNode[] = []
    private startNode: RenderNode | null = null
    private endNode: RenderNode | null = null

    private addNode(node: RenderNode): this {
        this.nodes.push(node)
        return this
    }

    setStartNode(node: RenderNode): this {
        this.startNode = node
        this.addNode(node)
        this.ensureEndNode()
        return this
    }

    appendNode(node: RenderNode): this {
        if (this.endNode?.lefts.length) {
            const [ lastNode ] = this.endNode.lefts
            this.insertNodeBetween(node, lastNode, this.endNode)

            console.log(22222)
            console.log(this.nodes)
            console.log(this.endNode)
            console.log(this.startNode)
        }
        else if (this.startNode) {
            this.appendAfter(node, this.startNode)
        }
        else {
            throw new PipelineError('Pipeline has no start node.')
        }
        this.nodes.push(node)
        return this
    }

    private ensureEndNode() {
        if (! this.endNode) {
            this.endNode = new OutputNode()
            if (this.startNode) {
                this.appendAfter(this.endNode, this.startNode)
            }
        }
    }

    private appendAfter(newNode: RenderNode, left: RenderNode) {
        newNode.lefts = [ left ]
        left.rights = [ newNode ]
        this.addNode(newNode)
        return this
    }

    private insertNodeBetween(node: RenderNode, left: RenderNode, right: RenderNode): this {
        left.rights = [ node ]
        node.lefts = [ left ]
        node.rights = [ right ]
        right.lefts = [ node ]
        this.addNode(node)
        return this
    }

    getOutput(frameIndex: number): RenderData {
        if (this.endNode) {
            return this.endNode.getOutput(frameIndex)
        }
        else {
            throw new Error('Pipeline has no end node.')
        }
    }

    clearCache() {
        this.nodes.forEach(node => node.clearCache())
        if (this.endNode) this.endNode.clearCache()
    }
}

export class InputNode extends RenderNode {
    static leftCount = [ 0 ]
    static rightCount = [ 1 ]

    constructor(private textureEntity: TextureEntity) {
        super(() => {
            throw new PipelineError('InputNode should override getOutput')
        })
    }

    getOutput(frameeIndex: number): RenderData {
        return {
            imageData: this.textureEntity.getFrameImageData(frameeIndex),
            offset: { x: 0, y: 0 },
        }
    }
}

export class OutputNode extends RenderNode {
    static leftCount = [ 1 ]
    static rightCount = [ 0 ]

    constructor() {
        super(id)
    }
}

export class ProcessingNode extends RenderNode {
    constructor(processor: Processor) {
        super(processor)
    }
}

export class GaussianBlurNode extends RenderNode {
    static leftCount = [ 1 ]
    static rightCount = [ 1 ]

    constructor(protected radius: number) {
        super(({ imageData, offset: offset }) => {
            return {
                imageData: this.applyBlur(imageData, radius),
                offset: offset,
            }
        })
    }

    private applyBlur(imageData: ImageData, radius: number): ImageData {
        const width = imageData.width
        const height = imageData.height

        const sourceCanvas = document.createElement('canvas')
        sourceCanvas.width = width
        sourceCanvas.height = height
        const SourceCtx = sourceCanvas.getContext('2d')!
        SourceCtx.putImageData(imageData, 0, 0)

        const blurCanvas = document.createElement('canvas')
        blurCanvas.width = width
        blurCanvas.height = height
        const blurCtx = blurCanvas.getContext('2d')!

        blurCtx.filter = `blur(${ radius }px)`
        blurCtx.drawImage(sourceCanvas, 0, 0)
        const blurredImageData = blurCtx.getImageData(0, 0, width, height)
        console.log('gaussian blur')

        return blurredImageData
    }

    setRadius(radius: number) {
        if (this.radius !== radius) {
            this.radius = radius
            this.clearCache()
        }
    }
}

export class BrightnessNode extends RenderNode {
    static leftCount = [ 1 ]
    static rightCount = [ 1 ]

    constructor(private brightness: number) {
        super(({ imageData, offset: offset }) => {
            return {
                imageData: this.adjustBrightness(imageData, brightness),
                offset: offset,
            }
        })
    }

    private adjustBrightness(imageData: ImageData, adjustment: number): ImageData {
        const width = imageData.width
        const height = imageData.height

        const sourceCanvas = document.createElement('canvas')
        sourceCanvas.width = width
        sourceCanvas.height = height
        const SourceCtx = sourceCanvas.getContext('2d')!
        SourceCtx.putImageData(imageData, 0, 0)

        const brightnessCanvas = document.createElement('canvas')
        brightnessCanvas.width = width
        brightnessCanvas.height = height
        const brightnessCtx = brightnessCanvas.getContext('2d')!

        brightnessCtx.filter = `brightness(${ adjustment })`
        brightnessCtx.drawImage(sourceCanvas, 0, 0)
        const brightnessImageData = brightnessCtx.getImageData(0, 0, width, height)
        console.log('brightness')

        return brightnessImageData
    }

    setAdjustment(adjustment: number) {
        if (this.brightness !== adjustment) {
            this.brightness = adjustment
            this.clearCache()
        }
    }
}

export class ScalingNode extends RenderNode {
    static leftCount = [ 1 ]
    static rightCount = [ 1 ]

    constructor(private scaleX: number, private scaleY?: number) {
        super(({ imageData, offset: offset }) => {
            return {
                imageData: this.scaleImage(imageData, scaleX, scaleY === undefined ? scaleX : scaleY),
                offset: this.scaleOffset(offset, imageData.height, scaleY === undefined ? scaleX : scaleY),
            }
        })
    }

    private scaleImage(imageData: ImageData, scaleX: number, scaleY: number): ImageData {
        const width = imageData.width
        const height = imageData.height
        const newWidth = Math.floor(width * scaleX)
        const newHeight = Math.floor(height * scaleY)

        const sourceCanvas = document.createElement('canvas')
        sourceCanvas.width = width
        sourceCanvas.height = height
        const sourceCtx = sourceCanvas.getContext('2d')!
        sourceCtx.putImageData(imageData, 0, 0)

        const scaledCanvas = document.createElement('canvas')
        scaledCanvas.width = newWidth
        scaledCanvas.height = newHeight
        const scaledCtx = scaledCanvas.getContext('2d')!

        scaledCtx.drawImage(sourceCanvas, 0, 0, width, height, 0, 0, newWidth, newHeight)

        console.log(newWidth, newHeight)
        const scaledImageData = scaledCtx.getImageData(0, 0, newWidth, newHeight)

        console.log('scaling')

        return scaledImageData
    }

    private scaleOffset(offset: { x: number, y: number }, height: number, scaleY: number): { x: number, y: number } {
        return {
            x: offset.x,
            y: offset.y + (1 - scaleY) * height,
        }
    }

    setScale(scaleX: number, scaleY: number) {
        if (this.scaleX !== scaleX || this.scaleY !== scaleY) {
            this.scaleX = scaleX
            this.scaleY = scaleY
            this.clearCache()
        }
    }
}

export class ShearNode extends RenderNode {
    static leftCount = [ 1 ]
    static rightCount = [ 1 ]

    //
    //  transformation: Anchor the left bottom corner, look at left top corner:
    //  shearX: the percentage change in X axis (positive direction is right)
    //  shearY: the percentage change in Y axis (positive direction is up)
    //
    constructor(private shearX: number, private shearY: number) {
        super(({ imageData, offset: offset }) => {
            return {
                imageData: this.shearImage(imageData, shearX, shearY),
                offset: this.shearOffset(offset, imageData.width, imageData.height, shearX, shearY),
            }
        })
    }

    private shearImage(imageData: ImageData, shearX: number, shearY: number): ImageData {
        const width = imageData.width
        const height = imageData.height

        const newWidth = Math.ceil(width + Math.abs(shearX) * width)
        const newHeight = Math.ceil(height + shearY * height)

        const sourceCanvas = document.createElement('canvas')
        sourceCanvas.width = width
        sourceCanvas.height = height
        const sourceCtx = sourceCanvas.getContext('2d')!
        sourceCtx.putImageData(imageData, 0, 0)

        const shearedCanvas = document.createElement('canvas')
        shearedCanvas.width = newWidth
        shearedCanvas.height = newHeight
        const shearedCtx = shearedCanvas.getContext('2d')!

        shearedCtx.transform(
            1, 0,
            - shearX * width / height, 1 + shearY,
            shearX * width + Math.max(0, - shearX * width), - shearY * height + Math.max(0, shearY * height),
        )

        shearedCtx.drawImage(sourceCanvas, 0, 0)

        const shearedImageData = shearedCtx.getImageData(0, 0, shearedCanvas.width, shearedCanvas.height)

        console.log('shear', newWidth, newHeight)

        return shearedImageData
    }

    private shearOffset(
        offset: { x: number, y: number }, width: number, height: number, shearX: number, shearY: number):
        { x: number, y: number } {
        return {
            x: offset.x - Math.max(0, - shearX * width),
            y: offset.y - Math.max(0, shearY * height),
        }
    }

    setShear(shearX: number, shearY: number) {
        if (this.shearX !== shearX || this.shearY !== shearY) {
            this.shearX = shearX
            this.shearY = shearY
            this.clearCache()
        }
    }
}
