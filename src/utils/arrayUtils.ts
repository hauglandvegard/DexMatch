/**
 * Performs a partial Fisher-Yates shuffle to pick `k` random indices.
 * * @param n - The length of the array to select from.
 * @param k - The number of random items to select.
 * @returns An array containing `k` randomly selected indices.
 */
export function getRandomIndices(n: number, k: number): number[] {
    if (k > n) {
        return Array.from({ length: n }, (_, i) => i);
    }

    const indices = Array.from({ length: n }, (_, i) => i);

    for (let i = 0; i < k; i++) {
        const r = i + Math.floor(Math.random() * (n - i));

        const temp = indices[i];
        indices[i] = indices[r];
        indices[r] = temp;
    }

    return indices.slice(0, k).sort((a, b) => a - b);;
}
