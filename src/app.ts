import path from 'path';

import express from 'express';
import session from 'express-session';
import expressLayouts from 'express-ejs-layouts';
import morgan from 'morgan';

import logger from './utils/logger';
import authRouter from './routes/auth';
import matchRouter from './routes/match';

const app = express();

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(morgan('dev', {
    stream: { write: (message: string) => logger.info(message.trim()) }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'dev_secret_change_in_production',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.get('/', (req, res) => {
    if (req.session.userId) return res.redirect('/swipe');
    res.render('login', { error: null });
});

app.use(authRouter);
app.use(matchRouter);

export { app };
