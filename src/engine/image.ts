export interface ImageManager {
    imgs: Record<string, HTMLImageElement>
    loadImage: (src: string) => Promise<HTMLImageElement>
}

export const useImageManager = (): ImageManager => {
    const imgs: Record<string, HTMLImageElement> = {}
    
    return {
        imgs,
        loadImage: async (src: string) => {
            if (imgs[src]) return imgs[src]
            const img = new Image
            img.src = src
            imgs[src] = img
            await new Promise((res, rej) => {
                img.onload = res
                img.onerror = (_event) => rej(new Error(`Failed to load image: ${src}`))
            })
            return img
        }
    }
}

export const getImagePixels = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    return ctx.getImageData(0, 0, img.width, img.height).data
}