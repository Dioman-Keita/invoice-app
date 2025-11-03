import type { Response, Request, NextFunction } from 'express';
import type { ActivityType } from '../types/dto/UserDto';
import { ActivityTracker } from '../utils/ActivityTracker';
import { AuthenticatedRequest } from '../types/express/request';

export function autoTrackActivity(activityName: ActivityType) {
    return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
        const user = req.user;
        if (user && user.sup) {
            const activityTracker = new ActivityTracker();
            await activityTracker.track(activityName, user.sup)
        }
        next();
    };
}