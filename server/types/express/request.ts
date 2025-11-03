import { Request } from 'express';
import { UserDto } from '../dto/UserDto';

/**
 * Interface to cleanly extend the Express Request type
 */
export interface AuthenticatedRequest extends Request {
    user?: UserDto
}