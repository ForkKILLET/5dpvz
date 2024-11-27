import { abs } from '@/utils/math'

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
