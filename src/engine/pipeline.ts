import { absurd, Endo, eq, id, remove, WithThisParameter } from '@/utils'
import { createIdGenerator, vAdd, Vector2D } from '@/engine'
import { Unit, unitLikeToString } from '@/utils/unit'
import { Size } from '@/comps/Shape'

type RenderData = {
    canvas: OffscreenCanvas
    offset: { x: number, y: number }
}

type RenderProcessor = WithThisParameter<Endo<RenderData>, RenderNode>

export class PipelineError extends Error {}

export interface ImageNodeCtor<N extends RenderNode> {
    new (...args: any): N
    name: string
    leftCount: number[]
    rightCount: number[]
}

export class RenderNode {
    static generateRenderNodeId = createIdGenerator()
    readonly id = RenderNode.generateRenderNodeId()

    pipeline: RenderPipeline | null = null

    static leftCount: number[] = []
    static rightCount: number[] = []

    get Ctor() {
        return this.constructor as ImageNodeCtor<this>
    }

    constructor(protected processor: RenderProcessor) {}

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

    protected cache: Record<string, RenderData> = {}

    protected canvases: Record<string, OffscreenCanvas> = {
        default: new OffscreenCanvas(0, 0),
    }
    protected ctxes: Record<string, OffscreenCanvasRenderingContext2D> = {
        default: this.canvases['default'].getContext('2d')!,
    }
    protected _canvas = this.canvases['default']
    get canvas() {
        return this._canvas
    }
    protected _ctx = this.ctxes['default']
    get ctx() {
        return this._ctx
    }

    protected _resourceId = 'default'
    get resourceId() {
        return this._resourceId
    }
    set resourceId(value: string) {
        if (this._resourceId === value) return

        this._resourceId = value
        this._canvas = this.canvases[value] ??= new OffscreenCanvas(this.width, this.height)
        this._ctx = this.ctxes[value] ??= this._canvas.getContext('2d')!
    }

    get width() {
        return this._canvas.width
    }
    set width(value: number) {
        this._canvas.width = value
    }
    get height() {
        return this._canvas.height
    }
    set height(value: number) {
        this._canvas.height = value
    }

    getOutput(): RenderData {
        if (this.lefts.length === 0) {
            throw new PipelineError('No input node provided.')
        }

        const id = this._resourceId
        // if (id in this.cache) return this.cache[id]

        const inputData = this.lefts[0].getOutput()
        const output = this.processor.call(this, inputData)
        this.cache[id] = output
        return output
    }

    clearCache() {
        this.cache = {}
    }
}

export interface RenderNodeCtor<N extends RenderNode> {
    new (...args: any): N
    name: string
    leftCount: number[]
    rightCount: number[]
}

export class RenderPipeline {
    constructor() {
        this.inputNode = new InputNode()
        this.outputNode = new OutputNode()
        this.addNode(this.inputNode, this.outputNode)

        this.inputNode.rights = [ this.outputNode ]
        this.outputNode.lefts = [ this.inputNode ]
    }

    allNodes: RenderNode[] = []
    inputNode: InputNode
    outputNode: OutputNode

    protected _resourceId = 'default'
    get resourceId() {
        return this._resourceId
    }
    set resourceId(value: string) {
        if (this._resourceId === value) return

        this._resourceId = value
        this.allNodes.forEach(node => node.resourceId = value)
    }

    private addNode(...nodes: RenderNode[]): this {
        this.allNodes.push(...nodes)
        return this
    }

    appendNode(node: RenderNode): this {
        const [ lastNode ] = this.outputNode.lefts
        this.insertNodeBetween(node, lastNode, this.outputNode)

        return this
    }

    removeNode(node: RenderNode): this {
        if (node.lefts.length === 1 && node.rights.length === 1) {
            remove(this.allNodes, eq(node))

            const [ left ] = node.lefts
            const [ right ] = node.rights
            left.rights = [ right ]
            right.lefts = [ left ]
        }
        else {
            throw new PipelineError('Cannot remove a node with multiple inputs or outputs.')
        }

        return this
    }

    private insertNodeBetween(node: RenderNode, left: RenderNode, right: RenderNode): this {
        this.addNode(node)

        left.rights = [ node ]
        node.lefts = [ left ]
        node.rights = [ right ]
        right.lefts = [ node ]

        return this
    }

    getOutput(): RenderData {
        return this.outputNode.getOutput()
    }

    clearCache() {
        this.allNodes.forEach(node => node.clearCache())
    }
}

export class InputNode extends RenderNode {
    static leftCount = [ 0 ]
    static rightCount = [ 1 ]

    constructor() {
        super(absurd)
    }

    getOutput(): RenderData {
        return {
            canvas: this.canvas,
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

export abstract class FilterNode<F> extends RenderNode {
    static leftCount = [ 1 ]
    static rightCount = [ 1 ]

    constructor(public config: F) {
        super(({ offset, canvas }) => {
            return {
                canvas: this.applyFilter(canvas),
                offset,
            }
        })
    }

    applyFilter(sourceCanvas: OffscreenCanvas): OffscreenCanvas {
        this.width = sourceCanvas.width
        this.height = sourceCanvas.height

        const { ctx, canvas } = this
        ctx.filter = this.getFilterStr()
        ctx.drawImage(sourceCanvas, 0, 0)

        return canvas
    }

    adjust(config: F) {
        if (this.config !== config) {
            this.config = config
            this.clearCache()
        }
        return this
    }

    abstract getFilterStr(): string
}

export interface GaussianBlurConfig {
    radius: number
}
export class GaussianBlurNode extends FilterNode<GaussianBlurConfig> {
    getFilterStr() {
        return `blur(${ this.config.radius }px)`
    }
}

export interface BrightnessConfig {
    brightness: number
}
export class BrightnessNode extends FilterNode<BrightnessConfig> {
    getFilterStr() {
        return `brightness(${ this.config.brightness })`
    }
}

export interface Origin {
    x: Unit<'px'> | Unit<'%'> | 'left' | 'center' | 'right'
    y: Unit<'px'> | Unit<'%'> | 'top' | 'center' | 'bottom'
}

export const originToString = ({ x, y }: Origin): string => {
    return `${ unitLikeToString(x) } ${ unitLikeToString(y) }`
}

export interface ScaleConfig {
    scaleX: number
    scaleY: number
    origin: Origin
}

export class ScaleNode extends RenderNode {
    static leftCount = [ 1 ]
    static rightCount = [ 1 ]

    constructor(public config: ScaleConfig) {
        super(({ canvas, offset }) => {
            return {
                canvas: this.process(canvas),
                offset: vAdd(offset, this.getOffset(canvas)),
            }
        })
    }

    protected process(sourceCanvas: OffscreenCanvas): OffscreenCanvas {
        const { width, height } = sourceCanvas
        const { scaleX, scaleY } = this.config
        const { canvas, ctx } = this

        const newWidth = canvas.width = Math.floor(width * scaleX)
        const newHeight = canvas.height = Math.floor(height * scaleY)

        ctx.drawImage(sourceCanvas, 0, 0, width, height, 0, 0, newWidth, newHeight)

        return canvas
    }

    protected getOffset(size: Size): Vector2D {
        const { scaleX, scaleY, origin: { x: ox, y: oy } } = this.config
        const { width, height } = size
        const x =
            ox === 'left' ? 0 :
            ox === 'center' ? width / 2 :
            ox === 'right' ? width :
            ox[0] === '%' ? ox[1] * width / 100 :
            ox[1]
        const y =
            oy === 'top' ? 0 :
            oy === 'center' ? height / 2 :
            oy === 'bottom' ? height :
            oy[0] === '%' ? oy[1] * height / 100 :
            oy[1]
        return {
            x: Math.round(x * (1 - scaleX)),
            y: Math.round(y * (1 - scaleY)),
        }
    }

    configScale(config: ScaleConfig) {
        if (this.config.scaleX !== config.scaleX ||
            this.config.scaleY !== config.scaleY ||
            originToString(this.config.origin) !== originToString(config.origin)
        ) this.clearCache()
        this.config = config
        return this
    }
}

export interface ShearConfig {
    shearX: number
    shearY: number
}

export class ShearNode extends RenderNode {
    static leftCount = [ 1 ]
    static rightCount = [ 1 ]

    constructor(public config: ShearConfig) {
        super(({ canvas, offset }) => {
            return {
                canvas: this.process(canvas),
                offset: vAdd(offset, this.getOffset(canvas)),
            }
        })
    }

    private process(sourceCanvas: OffscreenCanvas): OffscreenCanvas {
        const { width, height } = sourceCanvas
        const { shearX, shearY } = this.config
        const { ctx, canvas } = this

        const newWidth = Math.ceil(width + Math.abs(shearX) * width)
        const newHeight = Math.ceil(height + shearY * height)

        canvas.width = newWidth
        canvas.height = newHeight
        ctx.transform(
            1, 0,
            - shearX * width / height, 1 + shearY,
            shearX * width + Math.max(0, - shearX * width), - shearY * height + Math.max(0, shearY * height),
        )
        ctx.drawImage(sourceCanvas, 0, 0)

        return canvas
    }

    private getOffset(canvas: OffscreenCanvas): Vector2D {
        const { width, height } = canvas
        const { shearX, shearY } = this.config
        return {
            x: - Math.max(0, - shearX * width),
            y: - Math.max(0, shearY * height),
        }
    }

    adjust(config: ShearConfig) {
        if (this.config.shearX !== config.shearX || this.config.shearY !== config.shearX)
            this.clearCache()
        this.config = config
        return this
    }
}

export interface TrapezoidConfig {
    scaleTop: number
    centerTop: number
}

export class TrapezoidNode extends RenderNode {
    static leftCount = [ 1 ]
    static rightCount = [ 1 ]

    constructor(public config: TrapezoidConfig) {
        super(({ canvas, offset }) => ({
            canvas: this.process(canvas),
            offset,
        }))
    }

    protected process(sourceCanvas: OffscreenCanvas): OffscreenCanvas {
        const { width, height } = sourceCanvas
        const { scaleTop, centerTop } = this.config

        if (scaleTop === 1) return sourceCanvas

        const { canvas, ctx } = this

        const sourceCtx = sourceCanvas.getContext('2d')!
        const sourceImageData = sourceCtx!.getImageData(0, 0, width, height)
        const imageData = ctx.createImageData(width, height)

        const padTop = centerTop - width * scaleTop / 2

        for (let j = 0; j < height; j ++) {
            const padJ = Math.round((height - j) / height * padTop)
            const widthJ = width - padJ * 2
            const invScaleJ = width / widthJ
            for (let i = 0; i < widthJ; i ++) {
                const k = j * width + i + padJ
                const sourceK = Math.round(j * width + i * invScaleJ)
                for (let b = 0; b < 4; b ++) imageData.data[k * 4 + b] = sourceImageData.data[sourceK * 4 + b]
            }
        }

        canvas.width = width
        canvas.height = height
        ctx.putImageData(imageData, 0, 0)
        return canvas
    }

    adjust(config: TrapezoidConfig) {
        if (this.config.scaleTop !== config.scaleTop) this.clearCache()
        this.config = config
        return this
    }
}
