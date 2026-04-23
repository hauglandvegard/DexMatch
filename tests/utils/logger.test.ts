// tests/utils/logger.test.ts
import logger from '../../src/utils/logger';

describe('Logger Utility', () => {
    it('should be defined', () => {
        expect(logger).toBeDefined();
    });

    it('should have standard logging methods', () => {
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.error).toBe('function');
        expect(typeof logger.debug).toBe('function');
        expect(typeof logger.warn).toBe('function');
    });
});
