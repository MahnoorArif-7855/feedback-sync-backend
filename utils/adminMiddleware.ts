import { Request, Response, NextFunction } from 'express';
import { User } from '../database';

const isUserAdminMemCache = new Map<string, boolean>();

export const adminMiddleware = async (req: any, res: Response, next: NextFunction) => {
  const userId = req.user?.user_id;
  if (!userId) {
    return res.status(403).send('Unauthorized');
  }

  if (req.query.clearAdminCache === 'true') {
    isUserAdminMemCache.clear();
  }

  if (isUserAdminMemCache.has(userId)) {
    if (!isUserAdminMemCache.get(userId)) {
      return res.status(403).send('Unauthorized');
    }
    return next();
  } else {
    const user = await User.findOne({ userId });
    if (!user || user.type !== 'admin') {
      isUserAdminMemCache.set(userId, false);
      return res.status(403).send('Unauthorized');
    }
    isUserAdminMemCache.set(userId, true);
    return next();
  }
}
