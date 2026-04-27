import { QueuedProfile } from '../types/pokemon.types';
import {
    buildCleanSpeciesData,
    fetchTypeList,
    fetchRegionSpeciesIds,
    fetchSpeciesIdsByTypes,
} from './pokeApi.service';
import generatePokemon from './pokeGenerator';
import getJokeForType from './CNService';
import { getWantedTypeIds, getUserById } from '../models/User';
import logger from '../utils/logger';

const QUEUE_SIZE = 5;
const MAX_SPECIES_ID = 898;

const queues = new Map<number, QueuedProfile[]>();
const filling = new Set<number>();

export function popQueue(userId: number): QueuedProfile | null {
    const q = queues.get(userId) ?? [];
    if (q.length === 0) return null;
    const item = q.shift()!;
    queues.set(userId, q);
    return item;
}

export function queueLength(userId: number): number {
    return queues.get(userId)?.length ?? 0;
}

export function invalidateQueue(userId: number): void {
    queues.delete(userId);
    filling.delete(userId);
}

async function buildCandidateIds(wantedTypeIds: number[], regionId: number | null): Promise<number[]> {
    const [typeList, regionIds] = await Promise.all([
        wantedTypeIds.length > 0 ? fetchTypeList() : Promise.resolve([]),
        regionId && regionId > 0 ? fetchRegionSpeciesIds(regionId) : Promise.resolve(new Set<number>()),
    ]);

    const idToName = new Map(typeList.map((t) => [t.id, t.name]));
    const wantedNames = wantedTypeIds.map((id) => idToName.get(id)).filter((n): n is string => Boolean(n));
    const typeIds = wantedNames.length > 0 ? await fetchSpeciesIdsByTypes(wantedNames) : new Set<number>();

    if (typeIds.size === 0 && regionIds.size === 0) return [];
    if (typeIds.size === 0) return Array.from(regionIds);
    if (regionIds.size === 0) return Array.from(typeIds);
    return Array.from(typeIds).filter((id) => regionIds.has(id));
}

async function generateOne(userId: number): Promise<QueuedProfile | null> {
    const user = getUserById(userId);
    const wantedTypeIds = getWantedTypeIds(userId);
    const candidateIds = await buildCandidateIds(wantedTypeIds, user?.regionIdPref ?? null);

    const speciesId = candidateIds.length > 0
        ? candidateIds[Math.floor(Math.random() * candidateIds.length)]
        : Math.floor(Math.random() * MAX_SPECIES_ID) + 1;

    const speciesData = await buildCleanSpeciesData(speciesId);
    if (!speciesData) return null;

    const joke = await getJokeForType(speciesData.types[0] ?? 'normal');
    const draft = generatePokemon(speciesData, joke);

    return { draft, speciesData };
}

export async function fillQueue(userId: number): Promise<void> {
    if (filling.has(userId)) return;
    filling.add(userId);
    try {
        const q = queues.get(userId) ?? [];
        const needed = QUEUE_SIZE - q.length;
        for (let i = 0; i < needed; i++) {
            const profile = await generateOne(userId);
            if (profile) q.push(profile);
        }
        queues.set(userId, q);
    } finally {
        filling.delete(userId);
    }
}

export function fillQueueInBackground(userId: number): void {
    if (process.env.NODE_ENV === 'test') return;
    fillQueue(userId).catch((err) => logger.error('Background queue fill failed', err));
}
