import { Request, Response } from 'express';
import database from '../config/database';
import ApiResponder from '../utils/ApiResponder';
import logger from '../utils/Logger';

export class SystemController {
    /**
     * Récupère les logs d'erreur système (Admin uniquement)
     */
    static async getErrorLogs(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const level = req.query.level as string;
            const offset = (page - 1) * limit;

            let query = "SELECT * FROM system_error_log";
            let countQuery = "SELECT COUNT(*) as total FROM system_error_log";
            const params: any[] = [];

            if (level && level !== 'all') {
                query += " WHERE level = ?";
                countQuery += " WHERE level = ?";
                params.push(level);
            }

            query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
            // params.push(limit, offset); // LIMIT/OFFSET injectés directement pour éviter bug mysql2 prep statements

            const logs = await database.execute(query, params);
            const totalResult: any = await database.execute(countQuery, level && level !== 'all' ? [level] : []);
            const total = totalResult[0]?.total || 0;

            return ApiResponder.success(res, {
                logs,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }, 'Logs récupérés');
        } catch (error) {
            logger.error('Erreur lors de la récupération des logs système', {
                error,
                path: req.originalUrl,
                userId: (req as any).user?.id
            });
            return ApiResponder.error(res, error);
        }
    }

    /**
     * Supprime tous les logs (Admin uniquement)
     */
    static async clearLogs(req: Request, res: Response) {
        try {
            await database.execute("DELETE FROM system_error_log");
            return ApiResponder.success(res, 'Logs système réinitialisés');
        } catch (error) {
            return ApiResponder.error(res, error);
        }
    }
}
