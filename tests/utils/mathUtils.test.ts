import { gaussianRandom, getBellCurveRandom } from '../../src/utils/mathUtils';

describe('Statistical Distribution Tests', () => {
    const ITERATIONS = 10000;

    describe('gaussianRandom()', () => {
        it('should converge on the expected mean over many iterations', () => {
            let sum = 0;
            const targetMean = 10;

            for (let i = 0; i < ITERATIONS; i++) {
                sum += gaussianRandom(targetMean, 2); // Mean 10, StDev 2
            }

            const average = sum / ITERATIONS;

            // The average of 10,000 runs should be very close to 10.
            // toBeCloseTo(10, 1) means it checks up to 1 decimal point.
            expect(average).toBeCloseTo(targetMean, 1);
        });
    });

    describe('getBellCurveRandom()', () => {
        it('should always return a number strictly between 0 and 1', () => {
            for (let i = 0; i < ITERATIONS; i++) {
                const result = getBellCurveRandom();
                expect(result).toBeGreaterThanOrEqual(0);
                expect(result).toBeLessThanOrEqual(1);
            }
        });

        it('should converge around a mean of 0.5', () => {
            let sum = 0;
            for (let i = 0; i < ITERATIONS; i++) {
                sum += getBellCurveRandom();
            }

            const average = sum / ITERATIONS;
            expect(average).toBeCloseTo(0.5, 1);
        });
    });
});

describe('Deterministic Logic Tests', () => {
    afterEach(() => {
        // Restore Math.random after every test so we don't break other tests
        jest.spyOn(Math, 'random').mockRestore();
    });

    describe('getBellCurveRandom() outlier handling', () => {
        it('should reroll if the generated number is greater than 1', () => {
            // We will mock Math.random to return specific values in sequence.
            // Box-Muller uses two random numbers per call (u and v).

            const randomMock = jest.spyOn(Math, 'random')
                // FIRST CALL to getBellCurveRandom (Generates an outlier > 1)
                // u = 0.0000000001 (Very close to 0 creates a massive log value)
                .mockReturnValueOnce(1 - 0.0000000001)
                // v = 1 (cos(2PI) = 1)
                .mockReturnValueOnce(1)

                // SECOND CALL to getBellCurveRandom (Generates a normal value ~0.5)
                .mockReturnValueOnce(0.5) // u
                .mockReturnValueOnce(0.5); // v

            const result = getBellCurveRandom();

            // Math.random should have been called 4 times total:
            // 2 times for the outlier, 2 times for the successful reroll
            expect(randomMock).toHaveBeenCalledTimes(4);

            // The final result should be valid
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(1);
        });
    });
});
