export const placeholder = null as any

export const unreachable = () => {
    const error = new Error('Unreachable')
    error.stack = error.stack!.replace(/.*\n/, '')
    return error
}

export const absurd = () => {
    throw unreachable()
}
