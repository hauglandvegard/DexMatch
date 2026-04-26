import { Router } from 'express';

import { requireAuth } from '../middleware/auth';
import { getNextPokemon, getLikedProfiles } from '../services/pokeService';
import { fetchTypeList, fetchRegionList } from '../services/pokeApi.service';
import { createSwipe } from '../models/Swipe';
import { getPokemonById } from '../models/Pokemon';
import { getWantedTypeIds, setUserTypePreference, updateUserRegionPreference, getUserById } from '../models/User';
import logger from '../utils/logger';

const router = Router();

router.get('/swipe', requireAuth, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const userId = req.session.userId!;
    try {
        res.locals.profile = await getNextPokemon(userId);
        res.render('swipe');
    } catch (error) {
        logger.error('Failed to load pokemon profile', error);
        res.status(500).send('Failed to load a Pokémon. Please try again.');
    }
});

router.post('/swipe', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const pokemonId = Number(req.body.pokemonId);
    const isLiked = req.body.liked === 'true';

    if (!Number.isInteger(pokemonId) || pokemonId <= 0) {
        return res.status(400).send('Invalid pokemonId.');
    }

    const pokemon = getPokemonById(pokemonId);
    if (!pokemon) {
        return res.status(404).send('Pokémon not found.');
    }

    try {
        createSwipe(userId, pokemonId, isLiked);
        logger.debug('Swipe recorded', { userId, pokemonId, isLiked });
    } catch (error) {
        logger.error('Failed to record swipe', { userId, pokemonId, error });
        return res.status(500).send('Failed to record swipe. Please try again.');
    }
    res.redirect('/swipe');
});

router.get('/favorites', requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    try {
        res.locals.profiles = await getLikedProfiles(userId);
        res.render('favorites');
    } catch (error) {
        logger.error('Failed to load favorites', error);
        res.status(500).send('Failed to load favorites. Please try again.');
    }
});

router.get('/preferences', requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    try {
        const [types, regionListRaw, wantedIds, user] = await Promise.all([
            fetchTypeList(),
            fetchRegionList(),
            Promise.resolve(getWantedTypeIds(userId)),
            Promise.resolve(getUserById(userId)),
        ]);
        const regions = ((regionListRaw as any)?.results ?? []).map((r: { name: string; url: string }) => ({
            name: r.name,
            id: parseInt(r.url.split('/').filter(Boolean).pop() ?? '0', 10),
        }));
        res.locals.types = types;
        res.locals.wantedIds = new Set(wantedIds);
        res.locals.regions = regions;
        res.locals.currentRegionId = user?.regionIdPref ?? null;
        res.render('preferences');
    } catch (error) {
        logger.error('Failed to load preferences', error);
        res.status(500).send('Failed to load preferences. Please try again.');
    }
});

router.post('/preferences', requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const submitted: string[] = Array.isArray(req.body.types)
        ? req.body.types
        : req.body.types ? [req.body.types] : [];
    const checkedIds = new Set(submitted.map(Number).filter((n) => n >= 1 && n <= 18));
    const regionId = req.body.region ? parseInt(req.body.region, 10) : null;

    try {
        const types = await fetchTypeList();
        for (const type of types) {
            setUserTypePreference(userId, type.id, checkedIds.has(type.id));
        }
        updateUserRegionPreference(userId, regionId && regionId > 0 ? regionId : null);
        res.redirect('/preferences');
    } catch (error) {
        logger.error('Failed to save preferences', error);
        res.status(500).send('Failed to save preferences. Please try again.');
    }
});

export default router;
