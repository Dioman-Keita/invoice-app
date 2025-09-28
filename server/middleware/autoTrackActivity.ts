import type { Response, Request, NextFunction } from 'express';
import type { ActivityType } from '../services/userToken';
import { ActivityTracker } from '../utils/ActivityTracker';

export function autoTrackActivity(activityName: ActivityType) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (user && user.sup) {
            const activityTracker = new ActivityTracker();
            await activityTracker.track(activityName, user.sup)
        }
        next();
    };
}