import { Router } from 'express';

import { requireAuth } from '../middleware/auth';
import { getNextPokemon } from '../services/pokeService';
import { createSwipe } from '../models/Swipe';
import logger from '../utils/logger';

const router = Router();

router.get('/swipe', requireAuth, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
        res.locals.profile = await getNextPokemon();
        res.render('swipe');
    } catch (error) {
        logger.error('Failed to generate pokemon profile', error);
        res.status(500).send('Failed to load a Pokémon. Please try again.');
    }
});

router.post('/swipe', requireAuth, (req, res) => {
    const userId = req.session.userId!;
    const pokemonId = Number(req.body.pokemonId);
    const isLiked = req.body.liked === 'true';

    try {
        createSwipe(userId, pokemonId, isLiked);
        logger.debug('Swipe recorded', { userId, pokemonId, isLiked });
    } catch (error) {
        logger.error('Failed to record swipe', { userId, pokemonId, error });
    }
    res.redirect('/swipe');
});

export default router;
