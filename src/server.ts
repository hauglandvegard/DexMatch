import express, { Request, Response } from 'express';
import session from 'express-session';
import path from 'path';
import expressLayouts from 'express-ejs-layouts';

const app = express();
const PORT = process.env.PORT || 3000;

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
    secret: 'super_secret_dexmatch_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.get('/', (req: Request, res: Response) => {
    res.render('login');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Press Ctrl+C to stop`);
});
