import type { Response } from 'express';
import database from '../config/database';
import ApiResponder from '../utils/ApiResponder';
import logger from '../utils/Logger';
import { AuthenticatedRequest } from '../types/express/request';
import { GmailEmailSender } from '../services/emailService';
import { NotificationFactory } from '../services/notificationFactory';
import User from '../models/User';

const emailSender = new GmailEmailSender();
function onlySupportedRole(role: string): role is 'dfc_agent' | 'invoice_manager' {
  return role === 'dfc_agent' || role === 'invoice_manager';
}

export async function createRoleMigrationRequest(req: AuthenticatedRequest, res: Response) {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';
  try {
    const user = req.user;
    if (!user || !user.sup) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    const { department, motivation, targetRole } = (req.body || {}) as {
      department?: string;
      motivation?: string;
      targetRole?: string;
    };

    if (!department || !targetRole) {
      return ApiResponder.badRequest(res, 'Paramètres requis manquants');
    }

    if (!onlySupportedRole(user.role)) {
      return ApiResponder.forbidden(res, 'Votre rôle ne peut pas utiliser ce canal');
    }

    if (!onlySupportedRole(targetRole)) {
      return ApiResponder.badRequest(res, 'Rôle cible non supporté');
    }

    if (user.role === targetRole) {
      return ApiResponder.badRequest(res, 'Le rôle cible doit être différent du rôle actuel');
    }

    const DFC_DEPARTMENTS = ['Finance', 'Comptabilité', 'Contrôle de gestion', 'Audit interne'];
    const INVOICE_MANAGER_DEPARTMENTS = ['Facturation', 'Comptabilité Client', 'Gestion des factures'];

    if (targetRole === 'dfc_agent' && !DFC_DEPARTMENTS.includes(department)) {
      return ApiResponder.badRequest(res, 'Département invalide pour le rôle Agent DFC');
    }

    if (targetRole === 'invoice_manager' && !INVOICE_MANAGER_DEPARTMENTS.includes(department)) {
      return ApiResponder.badRequest(res, 'Département invalide pour le rôle Gestionnaire de Factures');
    }

    // Insert request
    const sql = `INSERT INTO role_migration_request 
      (requester_id, from_role, to_role, department, motivation) 
      VALUES (?, ?, ?, ?, ?)`;
    await database.execute(sql, [user.sup, user.role, targetRole, department, motivation ?? null]);

    // Fetch request ID
    const [row] = await database.execute<Array<{ id: number }>>(
      'SELECT id FROM role_migration_request WHERE requester_id = ? ORDER BY id DESC LIMIT 1',
      [user.sup]
    );
    const request = Array.isArray(row) && row.length ? row[0] : null;
    const requestIdDb = request?.id;

    // Event: submitted
    try {
      await database.execute(
        'INSERT INTO role_migration_event (request_id, event, metadata, performed_by) VALUES (?, ?, ?, ?)',
        [requestIdDb, 'submitted', JSON.stringify({ department, motivation, from: user.role, to: targetRole }), user.sup]
      );
    } catch (e) {
      logger.warn(`[${requestId}] Failed to log event submitted`, { error: e });
    }

    // Confirmation email to requester
    try {
      const userRows = await User.findUser(user.sup, 'id');
      const userDetails = userRows[0];

      if (userDetails && userDetails.email) {
        const firstName = (userDetails as any).firstname || userDetails.firstName;
        const lastName = (userDetails as any).lastname || userDetails.lastName;

        const template = NotificationFactory.create('migration_submitted', {
          name: `${firstName} ${lastName}`,
          role: targetRole,
          department,
          motivation
        });
        await emailSender.send({ to: userDetails.email }, template);

        await database.execute(
          'INSERT INTO role_migration_event (request_id, event, metadata, performed_by) VALUES (?, ?, ?, ?)',
          [requestIdDb, 'email_sent', JSON.stringify({ kind: 'submission_ack' }), user.sup]
        );
      }
    } catch (e) {
      logger.warn(`[${requestId}] Failed to send submission email`, { error: e });
    }

    return ApiResponder.success(res, { id: requestIdDb }, 'Demande soumise avec succès.');
  } catch (error) {
    logger.error(`[${requestId}] Error createRoleMigrationRequest`, { error });
    return ApiResponder.error(res, error);
  }
}

export async function listRoleMigrationRequests(req: AuthenticatedRequest, res: Response) {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';
  try {
    const { status = 'all', search = '', limit = '50', offset = '0' } = req.query as Record<string, string>;
    const filters: string[] = [];
    const params: unknown[] = [];

    if (status && status !== 'all') {
      filters.push('r.status = ?');
      params.push(status);
    }
    if (search) {
      filters.push('(LOWER(e.firstname) LIKE LOWER(?) OR LOWER(e.lastname) LIKE LOWER(?) OR LOWER(e.email) LIKE LOWER(?) OR LOWER(r.department) LIKE LOWER(?))');
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const lim = Math.max(0, Number(limit) || 50);
    const off = Math.max(0, Number(offset) || 0);

    const rows = await database.execute<any[]>(
      `SELECT r.id, r.requester_id, r.from_role, r.to_role, r.department, r.motivation, r.status, r.review_note, r.reviewed_by, r.reviewed_at, r.created_at,
              e.firstname AS firstName, e.lastname AS lastName, e.email
       FROM role_migration_request r
       JOIN employee e ON e.id = r.requester_id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT ${lim} OFFSET ${off}`,
      params
    );

    const data = Array.isArray(rows) ? rows : [];
    logger.info(`[${requestId}] List of role migration requests`, { count: data.length });
    return ApiResponder.success(res, { requests: data });
  } catch (error) {
    logger.error(`[${requestId}] Error listRoleMigrationRequests`, { error });
    return ApiResponder.error(res, error);
  }
}

export async function roleMigrationStats(_req: AuthenticatedRequest, res: Response) {
  try {
    const rows = await database.execute<Array<{ total: number; pending: number; approved: number; rejected: number }>>(`
      SELECT 
        COUNT(*) AS total,
        SUM(status = 'pending') AS pending,
        SUM(status = 'approved') AS approved,
        SUM(status = 'rejected') AS rejected
      FROM role_migration_request
    `);

    const stats = Array.isArray(rows) && rows.length ? rows[0] : { total: 0, pending: 0, approved: 0, rejected: 0 } as any;
    return ApiResponder.success(res, { stats });
  } catch (error) {
    return ApiResponder.error(res, error);
  }
}

export async function getRoleMigrationRequest(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params as { id: string };
  try {
    const rows = await database.execute<any[]>(
      `SELECT r.*, e.firstname AS firstName, e.lastname AS lastName, e.email
       FROM role_migration_request r
       JOIN employee e ON e.id = r.requester_id
       WHERE r.id = ? LIMIT 1`,
      [id]
    );
    const data = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!data) return ApiResponder.notFound(res, 'Demande introuvable');
    return ApiResponder.success(res, { request: data });
  } catch (error) {
    return ApiResponder.error(res, error);
  }
}

export async function approveRoleMigrationRequest(req: AuthenticatedRequest, res: Response) {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';
  const admin = req.user;
  const { id } = req.params as { id: string };
  const { review_note } = (req.body || {}) as { review_note?: string };

  try {
    if (!admin) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    // Load request
    const rows = await database.execute<Array<any>>('SELECT * FROM role_migration_request WHERE id = ? LIMIT 1', [id]);
    const reqRow = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!reqRow) return ApiResponder.notFound(res, 'Demande introuvable');
    if (reqRow.status !== 'pending') return ApiResponder.badRequest(res, 'Demande déjà traitée');

    // Approve + trace
    await database.execute(
      'UPDATE role_migration_request SET status = \'approved\', review_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?'
      , [review_note ?? null, admin.sup, id]
    );

    // Update user role
    const oldRole = reqRow.from_role as string;
    const newRole = reqRow.to_role as string;
    await database.execute('UPDATE employee SET role = ? WHERE id = ?', [newRole, reqRow.requester_id]);

    // user_role_migration log
    try {
      await database.execute(
        'INSERT INTO user_role_migration (user_id, old_role, new_role, reason, approved_by, request_id) VALUES (?, ?, ?, ?, ?, ?)',
        [reqRow.requester_id, oldRole, newRole, 'user_requested', admin.sup, id]
      );
    } catch (e) {
      logger.warn(`[${requestId}] Failed to register user_role_migration`, { error: e });
    }

    // Events & Email
    try {
      await database.execute('INSERT INTO role_migration_event (request_id, event, metadata, performed_by) VALUES (?, ?, ?, ?)',
        [id, 'approved', JSON.stringify({ review_note }), admin.sup]);
      await database.execute('INSERT INTO role_migration_event (request_id, event, metadata, performed_by) VALUES (?, ?, ?, ?)',
        [id, 'user_role_updated', JSON.stringify({ from: oldRole, to: newRole }), admin.sup]);

      // Fetch requester email
      // Fetch requester email
      const userRows = await User.findUser(reqRow.requester_id, 'id');
      const user = userRows[0];

      if (user && user.email) {
        const firstName = (user as any).firstname || user.firstName;
        const lastName = (user as any).lastname || user.lastName;

        const template = NotificationFactory.create('migration_approved', {
          name: `${firstName} ${lastName}`,
          role: newRole
        });
        await emailSender.send({ to: user.email }, template);

        await database.execute('INSERT INTO role_migration_event (request_id, event, metadata, performed_by) VALUES (?, ?, ?, ?)',
          [id, 'email_sent', JSON.stringify({ kind: 'approval_notice' }), admin.sup]);
      }
    } catch (e) {
      logger.warn(`[${requestId}] Failed to log events/email approval`, { error: e });
    }

    return ApiResponder.success(res, null, 'Demande approuvée et rôle mis à jour.');
  } catch (error) {
    logger.error(`[${requestId}] Error approveRoleMigrationRequest`, { error, id });
    return ApiResponder.error(res, error);
  }
}

export async function rejectRoleMigrationRequest(req: AuthenticatedRequest, res: Response) {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';
  const admin = req.user;
  const { id } = req.params as { id: string };
  const { review_note } = (req.body || {}) as { review_note?: string };

  try {
    if (!admin) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    const rows = await database.execute<Array<any>>('SELECT * FROM role_migration_request WHERE id = ? LIMIT 1', [id]);
    const reqRow = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!reqRow) return ApiResponder.notFound(res, 'Demande introuvable');
    if (reqRow.status !== 'pending') return ApiResponder.badRequest(res, 'Demande déjà traitée');

    await database.execute(
      'UPDATE role_migration_request SET status = \'rejected\', review_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?'
      , [review_note ?? null, admin.sup, id]
    );

    try {
      await database.execute('INSERT INTO role_migration_event (request_id, event, metadata, performed_by) VALUES (?, ?, ?, ?)',
        [id, 'rejected', JSON.stringify({ review_note }), admin.sup]);

      // Fetch requester email
      // Fetch requester email
      const userRows = await User.findUser(reqRow.requester_id, 'id');
      const user = userRows[0];

      if (user && user.email) {
        const firstName = (user as any).firstname || user.firstName;
        const lastName = (user as any).lastname || user.lastName;

        const template = NotificationFactory.create('migration_rejected', {
          name: `${firstName} ${lastName}`,
          review_note: review_note
        });
        await emailSender.send({ to: user.email }, template);

        await database.execute('INSERT INTO role_migration_event (request_id, event, metadata, performed_by) VALUES (?, ?, ?, ?)',
          [id, 'email_sent', JSON.stringify({ kind: 'rejection_notice' }), admin.sup]);
      }
    } catch (e) {
      logger.warn(`[${requestId}] Failed to log events/email rejection`, { error: e });
    }

    return ApiResponder.success(res, null, 'Demande rejetée.');
  } catch (error) {
    logger.error(`[${requestId}] Error rejectRoleMigrationRequest`, { error, id });
    return ApiResponder.error(res, error);
  }
}
