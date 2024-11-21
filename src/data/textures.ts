export type TextureCategory = 'plants' | 'zombies' | 'shovels' | 'bullets'

export interface Image {
    src: string
}

export interface AnimeDef {
    fpaf: number
    frameNum: number
}

export interface Anime extends AnimeDef {
    srcs: string[]
}

export type AnimeDefSet = Record<string, AnimeDef>

export type Texture =
    | { type: 'anime' } & Anime
    | { type: 'image' } & Image

export type TextureSet = Record<string, Texture>

export const useTextures = <M extends Record<string, { animes: AnimeDefSet }>>(
    category: TextureCategory, metadata: M
) => {
    type Id = keyof M & string
    const textureManager = {
        getImageSrc: (id: Id, variant = 'common', idx = '01') =>
            `./assets/${ category }/${ id }/${ variant }/${ idx }.png`,
        getImage: (id: Id, variant = 'common', idx = '01'): Image => ({
            src: textureManager.getImageSrc(id, variant, idx),
        }),
        getImageTextureSet: (id: Id, variant = 'common', idx = '01'): TextureSet => ({
            [variant]: {
                type: 'image',
                ...textureManager.getImage(id, variant, idx),
            },
        }),
        getAnime: (id: Id, variant = 'common'): Anime => {
            const { animes } = metadata[id]
            const { frameNum, fpaf } = animes[variant]
            const srcs = Array.from(
                { length: frameNum },
                (_, i) => `./assets/${ category }/${ id }/${ variant }/${ String(i + 1).padStart(2, '0') }.png`
            )
            return { srcs, frameNum, fpaf }
        },
        getAnimeTextureSet: (id: Id): TextureSet => {
            const { animes } = metadata[id]
            const variants = Object.keys(animes)
            const textures: TextureSet = {}
            variants.forEach(variant => {
                textures[variant] = {
                    type: 'anime',
                    ...textureManager.getAnime(id, variant),
                }
            })
            return textures
        },
        getAllSrcs: () => Object
            .keys(metadata)
            .flatMap(id => textureManager.getAnime(id).srcs),
    }
    return textureManager
}
