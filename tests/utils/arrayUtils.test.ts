import { getRandomIndices } from '../../src/utils/arrayUtils';

describe('getRandomIndices', () => {

    it('should return an array of length k', () => {
        const n = 10;
        const k = 3;
        const result = getRandomIndices(n, k);
        expect(result).toHaveLength(k);
    });

    it('should return all indices from 0 to n-1 if k > n', () => {
        const n = 5;
        const k = 10;
        const result = getRandomIndices(n, k);

        expect(result).toHaveLength(n);
        expect(result).toEqual([0, 1, 2, 3, 4]);
    });

    it('should return an empty array if k is 0', () => {
        const result = getRandomIndices(10, 0);
        expect(result).toEqual([]);
    });

    it('should contain only unique indices', () => {
        const n = 50;
        const k = 40;
        const result = getRandomIndices(n, k);

        const uniqueSet = new Set(result);
        expect(uniqueSet.size).toBe(k);
    });

    it('should return indices in ascending order', () => {
        const result = getRandomIndices(100, 10);

        const sortedCopy = [...result].sort((a, b) => a - b);
        expect(result).toEqual(sortedCopy);
    });

    it('should only return indices within the range 0 to n-1', () => {
        const n = 10;
        const k = 5;
        const result = getRandomIndices(n, k);

        result.forEach(index => {
            expect(index).toBeGreaterThanOrEqual(0);
            expect(index).toBeLessThan(n);
        });
    });

    it('should perform swaps correctly based on random values', () => {
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.9);

        const result = getRandomIndices(3, 1);

        expect(result).toEqual([2]);
        spy.mockRestore(); // Important: clean up the mock!
    });
});
