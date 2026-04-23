import path from 'path';

import express from 'express';
import session from 'express-session';
import expressLayouts from 'express-ejs-layouts';
import morgan from 'morgan';

import logger from './utils/logger';

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
    secret: 'super_secret_dexmatch_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.get('/', (req, res) => {
    res.render('login');
});

export { app };
