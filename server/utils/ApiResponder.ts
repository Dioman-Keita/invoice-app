import type { Response } from 'express';
import logger from './Logger';

type Meta = Record<string, unknown> | undefined;

export class ApiResponder {
    static success(res: Response, data?: unknown, message: string = 'OK', meta?: Meta, status: number = 200) {
        const body = { success: true, message, data: data ?? null, meta: meta ?? undefined };
        logger.info('API success response', { status, message });
        return res.status(status).json(body);
    }

    static created(res: Response, data?: unknown, message: string = 'Created', meta?: Meta) {
        return ApiResponder.success(res, data, message, meta, 201);
    }

    static badRequest(res: Response, message: string = 'Bad Request', details?: unknown) {
        const body = { success: false, message, error: details ?? null };
        logger.warn('API bad request', { message, details });
        return res.status(400).json(body);
    }

    static unauthorized(res: Response, message: string = 'Unauthorized', details?: unknown) {
        const body = { success: false, message, error: details ?? null };
        logger.warn('API unauthorized', { message });
        return res.status(401).json(body);
    }

    static forbidden(res: Response, message: string = 'Forbidden', details?: unknown) {
        const body = { success: false, message, error: details ?? null };
        logger.warn('API forbidden', { message });
        return res.status(403).json(body);
    }

    static notFound(res: Response, message: string = 'Not Found', details?: unknown) {
        const body = { success: false, message, error: details ?? null };
        logger.warn('API not found', { message });
        return res.status(404).json(body);
    }

    static error(res: Response, err: unknown, message: string = 'Internal Server Error', status: number = 500) {
        const body = { success: false, message, error: ApiResponder.serializeError(err) };
        logger.error('API error response', { message, error: body.error });
        return res.status(status).json(body);
    }

    private static serializeError(err: unknown): unknown {
        if (!err) return null;
        if (err instanceof Error) {
            return { name: err.name, message: err.message, stack: process.env.NODE_ENV === 'production' ? undefined : err.stack };
        }
        return err;
    }
}

export default ApiResponder;