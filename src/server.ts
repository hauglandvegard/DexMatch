import { app } from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`DexMatch is live at http://localhost:${PORT}`);
    console.log(`Development proxy at http://localhost:3001`);
    console.log(`Press Ctrl+C to stop`);
});
