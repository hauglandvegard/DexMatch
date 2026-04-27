import 'express-session';
import { QueuedProfile } from './pokemon.types';

declare module 'express-session' {
    interface SessionData {
        userId: number;
        pendingProfile: QueuedProfile | undefined;
    }
}
