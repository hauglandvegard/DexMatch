export interface DraftSwipe {
    userId: number;
    pokemonId: number;
    isLiked: boolean;
    createdAt: string;
}

export interface Swipe extends DraftSwipe {
    id: number;
}
