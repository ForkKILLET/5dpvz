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

export const getImagePixels = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    return ctx.getImageData(0, 0, img.width, img.height).data
}
