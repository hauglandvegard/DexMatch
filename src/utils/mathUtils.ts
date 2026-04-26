/**
 * Generates a random number following a Gaussian (normal) distribution using the Box-Muller transform.
 * * @param {number} [mean=0] - The center/average of the bell curve.
 * @param {number} [stdev=1] - The standard deviation, determining the spread of the curve.
 * @returns {number} A normally distributed random number.
 * @author https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
 */
export function gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}

/**
 * Generates a random number strictly between 0 and 1 following a bell curve (normal) distribution.
 * The curve is centered exactly at 0.5.
 * * @returns {number} A normally distributed decimal value bounded between 0 and 1.
 */
export function getBellCurveRandom(): number {
    // Call the gaussian function with mean = 0.5 and stdev = 1/6
    const num = gaussianRandom(0.5, 1 / 6.0);

    // Catch the extreme outliers (< 0.1% chance) and reroll
    if (num < 0 || num > 1) {
        return getBellCurveRandom();
    }

    return num;
}
