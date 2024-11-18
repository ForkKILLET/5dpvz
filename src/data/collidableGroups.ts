export const COLLIDABLE_GROUPS = [ 'plants', 'zombies', 'bullets' ] as const

export type CollidableGroup = typeof COLLIDABLE_GROUPS[number]
