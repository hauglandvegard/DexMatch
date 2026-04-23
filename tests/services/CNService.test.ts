import axios from 'axios';
import { getJokeForType } from '../../src/services/CNService';
import logger from '../../src/utils/logger';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Chuck Norris API Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Should return a joke from the search results if matches exist', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                result: [{ value: 'Fire joke 1' }, { value: 'Fire joke 2' }]
            }
        });

        const joke = await getJokeForType('fire');

        expect(joke).toContain('Fire joke');
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/search?query=fire'));
    });

    it('Should fall back to a random joke if the search returns empty', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: { result: [] }
        });
        mockedAxios.get.mockResolvedValueOnce({
            data: { value: 'Completely random joke.' }
        });

        const joke = await getJokeForType('fairy');

        expect(joke).toBe('Completely random joke.');
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        expect(mockedAxios.get).toHaveBeenNthCalledWith(1, expect.stringContaining('/search?query=fairy'));
        expect(mockedAxios.get).toHaveBeenNthCalledWith(2, expect.stringContaining('/random'));
    });

    it('Should log an error and return a safe string if the API crashes', async () => {
        const loggerSpy = jest.spyOn(logger, 'error').mockImplementation();
        mockedAxios.get.mockRejectedValueOnce(new Error('500 Internal Server Error'));

        const joke = await getJokeForType('fire');

        expect(joke).toBe("Chuck Norris caught all 1000+ Pokémon using only a single regular Pokéball.");
        expect(loggerSpy).toHaveBeenCalledTimes(1);
    });
});
