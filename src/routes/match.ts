import { Router } from 'express';

import { requireAuth } from '../middleware/auth';
import { getNextPokemon, getLikedProfiles } from '../services/pokeService';
import { createSwipe } from '../models/Swipe';
import { getPokemonById } from '../models/Pokemon';
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

export default router;
