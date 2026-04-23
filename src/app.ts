import express from 'express';
import session from 'express-session';
import path from 'path';
import expressLayouts from 'express-ejs-layouts';

const app = express();

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

app.get('/', (req, res) => {
    res.render('login');
});

app.get('/test', (req: Request, res: Response) => {
    // We pass an object as the second argument to send data to the page
    res.render('test', {
        pageTitle: "Testing Page",
        message: "This is a dynamic message from the server!"
    });
});

export { app };
