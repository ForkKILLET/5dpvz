import { TextureEntity } from '@/entities/Texture'

type ProcessFunc = (input: ImageData) => ImageData

export class ImageNode {
    dependencies: ImageNode[] = []
    dependents: ImageNode[] = []
    private cache: Map<number, ImageData> = new Map()

    constructor(protected processFunc: ProcessFunc) {}

    connect(inputNode: ImageNode): this {
        this.dependencies.push(inputNode)
        inputNode.dependents.push(this)
        return this
    }

    removeDependency(node: ImageNode): void {
        const index = this.dependencies.indexOf(node)
        if (index !== - 1) {
            this.dependencies.splice(index, 1)
            const depIndex = node.dependents.indexOf(this)
            if (depIndex !== - 1) {
                node.dependents.splice(depIndex, 1)
            }
        }
    }

    getOutput(frameeIndex: number): ImageData {
        if (this.cache.has(frameeIndex)) {
            return this.cache.get(frameeIndex)!
        }

        if (this.dependencies.length === 0) {
            throw new Error('No input node provided.')
        }

        const inputData = this.dependencies[0].getOutput(frameeIndex)
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

    connect(): this {
        throw new Error('SourceNode cannot have dependencies')
    }

    getOutput(frameeIndex: number): ImageData {
        return this.textureEntity.getFrameImageData(frameeIndex)
    }
}

export class OutputNode extends ImageNode {
    constructor() {
        super(input => input)
    }

    connect(inputNode: ImageNode): this {
        super.connect(inputNode)
        return this
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
        this.ensureEndNode()
        return this
    }

    appendNode(node: ImageNode): this {
        if (this.endNode && this.endNode.dependencies.length > 0) {
            const lastNode = this.endNode.dependencies[0]
            node.connect(lastNode)
            this.endNode.connect(node)
        }
        else if (this.startNode) {
            node.connect(this.startNode)
            this.endNode?.connect(node)
        }
        else {
            throw new Error('Pipeline has no start node.')
        }
        this.nodes.push(node)
        return this
    }

    insertNodeBefore(nodeToInsert: ImageNode, targetNode: ImageNode): this {
        this.nodes.forEach(node => {
            if (node.dependencies.includes(targetNode)) {
                node.removeDependency(targetNode)
                node.connect(nodeToInsert)
            }
        })
        nodeToInsert.connect(targetNode)
        this.nodes.push(nodeToInsert)
        return this
    }

    insertNodeAfter(targetNode: ImageNode, nodeToInsert: ImageNode): this {
        const dependencies = targetNode.dependencies.slice()
        targetNode.dependencies = []
        dependencies.forEach((dep: ImageNode) => dep.dependents.splice(dep.dependents.indexOf(targetNode), 1))

        dependencies.forEach((dep: ImageNode) => nodeToInsert.connect(dep))

        targetNode.connect(nodeToInsert)

        this.nodes.push(nodeToInsert)
        return this
    }

    insertNodeeBetween(newNode: ImageNode, beforeNode: ImageNode, afterNode: ImageNode): this {
        beforeNode.removeDependency(afterNode)
        newNode.connect(beforeNode)
        afterNode.connect(newNode)
        return this
    }

    private ensureEndNode() {
        if (! this.endNode) {
            this.endNode = new OutputNode()
            if (this.startNode) {
                this.endNode!.connect(this.startNode)
            }
        }
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
