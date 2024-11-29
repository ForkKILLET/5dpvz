import { TextureEntity } from '@/entities/Texture'

type RenderData = { imageData: ImageData, offset3d: { x: number, y: number } }

type ProcessFunc = (input: RenderData) => RenderData

export class ImageNode {
    private _lefts: ImageNode[] = []
    public get lefts(): ImageNode[] {
        return this._lefts
    }
    public set lefts(value: ImageNode[]) {
        this._lefts = value
    }

    private _rights: ImageNode[] = []
    public get rights(): ImageNode[] {
        return this._rights
    }
    public set rights(value: ImageNode[]) {
        this._rights = value
    }
    private cache: Map<number, RenderData> = new Map()

    constructor(protected processFunc: ProcessFunc) {}

    getOutput(frameeIndex: number): RenderData {
        if (this.cache.has(frameeIndex)) {
            return this.cache.get(frameeIndex)!
        }

        if (this.lefts.length === 0) {
            throw new Error('No input node provided.')
        }

        const inputData = this.lefts[0].getOutput(frameeIndex)
        const output = this.processFunc(inputData)
        this.cache.set(frameeIndex, output)
        return output
    }

    clearCache() {
        this.cache.clear()
    }
}

export class InputNode extends ImageNode {
    constructor(private textureEntity: TextureEntity) {
        super(() => {
            throw new Error('SourceNode should override getOutput')
        })
    }

    private _left: ImageNode[] = []
    get lefts(): ImageNode[] {
        return this._left
    }
    set lefts(node: ImageNode[]) {
        if (node.length !== 0) {
            throw new Error('Left length must be 0')
        }
        this._left = node
    }

    private _right: ImageNode[] = []
    get rights(): ImageNode[] {
        return this._right
    }
    set rights(node: ImageNode[]) {
        if (node.length > 1) {
            throw new Error('Right length must be 0 or 1')
        }
        this._right = node
    }

    getOutput(frameeIndex: number): RenderData {
        return {
            imageData: this.textureEntity.getFrameImageData(frameeIndex),
            offset3d: { x: 0, y: 0 },
        }
    }
}

export class OutputNode extends ImageNode {
    constructor() {
        super(input => input)
    }

    private _left: ImageNode[] = []
    get lefts(): ImageNode[] {
        return this._left
    }
    set lefts(node: ImageNode[]) {
        if (node.length > 1) {
            throw new Error('Left length must be 0 or 1')
        }
        this._left = node
    }

    private _right: ImageNode[] = []
    get rights(): ImageNode[] {
        return this._right
    }
    set rights(node: ImageNode[]) {
        if (node.length !== 0) {
            throw new Error('Right length must be 0')
        }
        this._right = node
    }
}

export class ProcessingNode extends ImageNode {
    constructor(processFunc: ProcessFunc) {
        super(processFunc)
    }
}

export class ProcessingPipeline {
    private nodes: ImageNode[] = []
    private startNode: ImageNode | null = null
    private endNode: ImageNode | null = null

    private addNode(node: ImageNode): this {
        this.nodes.push(node)
        return this
    }

    setStartNode(node: ImageNode): this {
        this.startNode = node
        this.addNode(node)
        this.ensureEndNode()
        return this
    }

    appendNode(node: ImageNode): this {
        if (this.endNode && this.endNode.lefts.length > 0) {
            const lastNode = this.endNode.lefts[0]
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
            throw new Error('Pipeline has no start node.')
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

    private appendAfter(newNode: ImageNode, left: ImageNode) {
        newNode.lefts = [ left ]
        left.rights = [ newNode ]
        this.addNode(newNode)
        return this
    }

    private insertNodeBetween(node: ImageNode, left: ImageNode, right: ImageNode): this {
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

export class GaussianBlurNode extends ImageNode {
    constructor(private radius: number) {
        super(({ imageData, offset3d }) => {
            return {
                imageData: this.applyBlur(imageData, radius),
                offset3d,
            }
        })
    }

    private _left: ImageNode[] = []
    get lefts(): ImageNode[] {
        return this._left
    }
    set lefts(node: ImageNode[]) {
        if (node.length > 1) {
            throw new Error('Left length must be 0 or 1')
        }
        this._left = node
    }

    private _right: ImageNode[] = []
    get rights(): ImageNode[] {
        return this._right
    }
    set rights(node: ImageNode[]) {
        if (node.length > 1) {
            throw new Error('Right length must be 0 or 1')
        }
        this._right = node
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

export class BrightnessNode extends ImageNode {
    constructor(private brightness: number) {
        super(({ imageData, offset3d }) => {
            return {
                imageData: this.adjustBrightness(imageData, brightness),
                offset3d,
            }
        })
    }

    private _left: ImageNode[] = []
    get lefts(): ImageNode[] {
        return this._left
    }
    set lefts(node: ImageNode[]) {
        if (node.length > 1) {
            throw new Error('Left length must be 0 or 1')
        }
        this._left = node
    }

    private _right: ImageNode[] = []
    get rights(): ImageNode[] {
        return this._right
    }
    set rights(node: ImageNode[]) {
        if (node.length > 1) {
            throw new Error('Right length must be 0 or 1')
        }
        this._right = node
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

export class ScalingNode extends ImageNode {
    constructor(private scaleX: number, private scaleY?: number) {
        super(({ imageData, offset3d }) => {
            return {
                imageData: this.scaleImage(imageData, scaleX, scaleY === undefined ? scaleX : scaleY),
                offset3d: this.scaleOffset(offset3d, imageData.height, scaleY === undefined ? scaleX : scaleY),
            }
        })
    }

    private _left: ImageNode[] = []
    get lefts(): ImageNode[] {
        return this._left
    }
    set lefts(node: ImageNode[]) {
        if (node.length > 1) {
            throw new Error('Left length must be 0 or 1')
        }
        this._left = node
    }

    private _right: ImageNode[] = []
    get rights(): ImageNode[] {
        return this._right
    }
    set rights(node: ImageNode[]) {
        if (node.length > 1) {
            throw new Error('Right length must be 0 or 1')
        }
        this._right = node
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

    private scaleOffset(offset3d: { x: number, y: number }, height: number, scaleY: number): { x: number, y: number } {
        return {
            x: offset3d.x,
            y: offset3d.y + (1 - scaleY) * height,
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

export class ShearNode extends ImageNode {
    //
    //  transformation: Anchor the left bottom corner, look at left top corner:
    //  shearX: the percentage change in X axis (positive direction is right)
    //  shearY: the percentage change in Y axis (positive direction is up)
    //
    constructor(private shearX: number, private shearY: number) {
        super(({ imageData, offset3d }) => {
            return {
                imageData: this.shearImage(imageData, shearX, shearY),
                offset3d: this.shearOffset(offset3d, imageData.width, imageData.height, shearX, shearY),
            }
        })
    }

    private _left: ImageNode[] = []
    get lefts(): ImageNode[] {
        return this._left
    }
    set lefts(node: ImageNode[]) {
        if (node.length > 1) {
            throw new Error('Left length must be 0 or 1')
        }
        this._left = node
    }

    private _right: ImageNode[] = []
    get rights(): ImageNode[] {
        return this._right
    }
    set rights(node: ImageNode[]) {
        if (node.length > 1) {
            throw new Error('Right length must be 0 or 1')
        }
        this._right = node
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
        offset3d: { x: number, y: number }, width: number, height: number, shearX: number, shearY: number):
        { x: number, y: number } {
        return {
            x: offset3d.x - Math.max(0, - shearX * width),
            y: offset3d.y - Math.max(0, shearY * height),
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