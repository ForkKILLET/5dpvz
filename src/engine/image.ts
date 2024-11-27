import { Size } from '@/comps/Shape'
import { Position } from '@/engine'
import { abs, matrix } from '@/utils'

export interface ImageManager {
    imgs: Record<string, HTMLImageElement>
    loadingImgs: Record<string, Promise<HTMLImageElement>>
    loadImage: (src: string) => Promise<HTMLImageElement>
}

export const isImageLoaded = (img: HTMLImageElement) => img.complete && img.naturalWidth !== 0

export const useImageManager = (): ImageManager => {
    const imgs: Record<string, HTMLImageElement> = {}
    const loadingImgs: Record<string, Promise<HTMLImageElement>> = {}

    return {
        imgs,
        loadingImgs,
        loadImage: async (src: string) => {
            if (src in imgs) return imgs[src]
            if (src in loadingImgs) return loadingImgs[src]

            const img = new Image()
            img.src = src
            return loadingImgs[src] = new Promise((res, rej) => {
                img.onload = () => res(img)
                img.onerror = event => {
                    rej(new Error(`Failed to load image: ${ src }`))
                    console.error(`Failed to load image: ${ src }\n%o`, event)
                }
            })
        },
    }
}

export const getImagePixels = (img: HTMLImageElement): Uint8ClampedArray => {
    const canvas = new OffscreenCanvas(img.width, img.height)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    return ctx.getImageData(0, 0, img.width, img.height).data
}

export type Outline = {
    outline: Position[]
    inner: Position[]
}

export const getImageOutline = ({ width, height }: Size, pixels: Uint8ClampedArray): Outline => {
    const outline: Position[] = []
    const inner: Position[] = []
    const dots = matrix(width, height, (x, y) => pixels[(y * width + x) * 4 + 3] > 0)
    matrix(width, height, (x, y) => {
        if (! dots[x][y]) return
        if (x === 0 || ! dots[x - 1][y] ||
            x === width - 1 || ! dots[x + 1][y] ||
            y === 0 || ! dots[x][y - 1] ||
            y === height - 1 || ! dots[x][y + 1]
        ) outline.push({ x, y })
        else inner.push({ x, y })
    })
    return { outline, inner }
}

export function shearImage(
    imageData: ImageData,
    shearX: number,
    shearY: number,
): ImageData {
    const originalWidth = imageData.width
    const originalHeight = imageData.height

    const newWidth = originalWidth + abs(shearX) * originalHeight
    const newHeight = originalHeight + abs(shearY) * originalHeight

    const canvas = document.createElement('canvas')
    canvas.width = newWidth
    canvas.height = newHeight
    const ctx = canvas.getContext('2d')!

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const offsetX = shearX < 0 ? - shearX * originalHeight : 0
    const offsetY = shearY < 0 ? - shearY * originalHeight : 0
    ctx.translate(offsetX, offsetY)

    ctx.transform(1, shearY, shearX, 1, 0, 0)

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = originalWidth
    tempCanvas.height = originalHeight
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.putImageData(imageData, 0, 0)

    ctx.drawImage(tempCanvas, 0, 0)

    const transformedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    return transformedImageData
}
