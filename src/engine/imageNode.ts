import { TextureEntity } from '@/entities/Texture'

type ProcessFunc = (input: ImageData) => ImageData

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
    private cache: Map<number, ImageData> = new Map()

    constructor(protected processFunc: ProcessFunc) {}

    getOutput(frameeIndex: number): ImageData {
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

    getOutput(frameeIndex: number): ImageData {
        return this.textureEntity.getFrameImageData(frameeIndex)
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

    addNode(node: ImageNode): this {
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

    getOutput(frameIndex: number): ImageData {
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
        super(input => this.applyBlur(input, radius))
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
