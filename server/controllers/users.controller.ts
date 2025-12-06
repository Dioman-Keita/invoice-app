import type { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/express/request';
import database from '../config/database';
import ApiResponder from '../utils/ApiResponder';
import logger from '../utils/Logger';
import { BcryptHasher } from '../utils/PasswordHasher';
import { isValidPasswordStrength } from '../middleware/validator';

function toStatus(isActive?: number, isVerified?: number): 'active' | 'inactive' | 'pending' {
  if (isVerified === 0) return 'pending';
  return isActive === 1 ? 'active' : 'inactive';
}

export async function listUsers(req: Request, res: Response): Promise<Response> {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';
  try {
    const { search = '', role, status, limit = '50', offset = '0' } = req.query as Record<string, string>;

    const filters: string[] = [];
    const params: unknown[] = [];

    if (search) {
      filters.push('(LOWER(firstname) LIKE LOWER(?) OR LOWER(lastname) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?))');
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (role) {
      filters.push('role = ?');
      params.push(role);
    }
    if (status) {
      // status dérivé: pending => isVerified=0, active => isActive=1 AND isVerified=1, inactive => isActive=0
      if (status === 'pending') {
        filters.push('isVerified = 0');
      } else if (status === 'active') {
        filters.push('isActive = 1 AND isVerified = 1');
      } else if (status === 'inactive') {
        filters.push('isActive = 0');
      }
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const lim = Math.max(0, Number(limit) || 50);
    const off = Math.max(0, Number(offset) || 0);

    const sql = `SELECT 
                   e.id, 
                   e.firstname AS firstName, 
                   e.lastname AS lastName, 
                   e.email, 
                   e.role, 
                   e.phone, 
                   e.department, 
                   e.employee_cmdt_id AS employeeId,
                   e.isActive, 
                   e.isVerified, 
                   e.created_at,
                   (
                     SELECT MAX(ua.created_at) 
                     FROM user_activity ua 
                     WHERE ua.user_id = e.id AND ua.name = 'LOGIN'
                   ) AS lastLogin
                 FROM employee e ${where}
                 ORDER BY e.created_at DESC
                 LIMIT ${lim} OFFSET ${off}`;

    const rows = await database.execute<any[]>(sql, params);

    const data = (Array.isArray(rows) ? rows : []).map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      phone: u.phone,
      department: u.department,
      employeeId: u.employeeId,
      status: toStatus(u.isActive, u.isVerified),
      lastLogin: u.lastLogin ?? null,
      createdAt: u.created_at,
    }));

    logger.info(`[${requestId}] Liste des utilisateurs retournée`, { count: data.length });
    return ApiResponder.success(res, { users: data });
  } catch (error) {
    logger.error(`[${requestId}] Erreur listUsers`, { error });
    return ApiResponder.error(res, error);
  }
}

export async function getUser(req: Request, res: Response): Promise<Response> {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';
  const { id } = req.params;
  try {
    const rows = await database.execute<any[]>(
      `SELECT 
         e.id, 
         e.firstname AS firstName, 
         e.lastname AS lastName, 
         e.email, 
         e.role, 
         e.phone, 
         e.department, 
         e.employee_cmdt_id AS employeeId,
         e.isActive, 
         e.isVerified, 
         e.created_at,
         (
           SELECT MAX(ua.created_at) 
           FROM user_activity ua 
           WHERE ua.user_id = e.id AND ua.name = 'LOGIN'
         ) AS lastLogin
       FROM employee e WHERE e.id = ? LIMIT 1`,
      [id]
    );

    const user = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!user) {
      return ApiResponder.notFound(res, 'Utilisateur introuvable');
    }
    const data = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      department: user.department,
      employeeId: user.employeeId,
      status: toStatus(user.isActive, user.isVerified),
      lastLogin: user.lastLogin ?? null,
      createdAt: user.created_at,
    };

    logger.info(`[${requestId}] Détail utilisateur`, { id });
    return ApiResponder.success(res, { user: data });
  } catch (error) {
    logger.error(`[${requestId}] Erreur getUser`, { error, id });
    return ApiResponder.error(res, error);
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response): Promise<Response> {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';
  const { id } = req.params;
  const admin = req.user;

  try {
    const allowedFields = ['firstName', 'lastName', 'role', 'phone', 'department', 'status', 'password'];
    const payload = req.body || {};

    const fields: string[] = [];
    const params: unknown[] = [];

    // Récupérer l'état actuel pour détecter une migration de rôle
    const currentRows = await database.execute<Array<{ role: string }>>('SELECT role FROM employee WHERE id = ? LIMIT 1', [id]);
    const currentRole = Array.isArray(currentRows) && currentRows.length ? currentRows[0].role : undefined;

    if (payload.firstName !== undefined) { fields.push('firstname = ?'); params.push(String(payload.firstName)); }
    if (payload.lastName !== undefined) { fields.push('lastname = ?'); params.push(String(payload.lastName)); }
    // Email immuable: refuser toute tentative de modification
    if (payload.email !== undefined) {
      return ApiResponder.badRequest(res, "L'email de l'utilisateur est immuable et ne peut pas être modifié.");
    }
    if (payload.role !== undefined) { fields.push('role = ?'); params.push(String(payload.role)); }
    if (payload.phone !== undefined) { fields.push('phone = ?'); params.push(String(payload.phone)); }
    if (payload.department !== undefined) { fields.push('department = ?'); params.push(String(payload.department)); }
    if (payload.employeeId !== undefined) { fields.push('employee_cmdt_id = ?'); params.push(String(payload.employeeId)); }

    // Mot de passe optionnel: si fourni, vérifier robustesse et hasher
    if (payload.password !== undefined) {
      const raw = String(payload.password);
      if (!isValidPasswordStrength(raw)) {
        return ApiResponder.badRequest(res, 'Mot de passe trop faible');
      }
      const hash = await BcryptHasher.hash(raw);
      fields.push('password = ?');
      params.push(hash);
    }

    // status -> isActive/isVerified
    if (payload.status !== undefined) {
      if (payload.status === 'pending') {
        fields.push('isVerified = 0');
      } else if (payload.status === 'active') {
        fields.push('isActive = 1', 'isVerified = 1');
      } else if (payload.status === 'inactive') {
        fields.push('isActive = 0');
      }
    }

    if (fields.length === 0) {
      return ApiResponder.badRequest(res, 'Aucun champ valide à mettre à jour');
    }

    const sql = `UPDATE employee SET ${fields.join(', ')} WHERE id = ?`;
    params.push(id);

    // Si un changement de rôle est demandé, journaliser la migration avant de répondre
    const isRoleChange = payload.role !== undefined && currentRole !== undefined && String(payload.role) !== String(currentRole);

    await database.execute(sql, params);

    if (isRoleChange) {
      try {
        await database.execute(
          'INSERT INTO user_role_migration (user_id, old_role, new_role, reason, approved_by) VALUES (?, ?, ?, ?, ?)',
          [id, String(currentRole), String(payload.role), 'admin_initiated', admin ? admin.sup : null]
        );
        logger.info(`[${requestId}] Migration de rôle enregistrée`, { id, from: currentRole, to: payload.role });
      } catch (e) {
        logger.error(`[${requestId}] Échec d'enregistrement migration de rôle`, { id, error: e });
      }
    }

    logger.info(`[${requestId}] Utilisateur mis à jour`, { id });
    return ApiResponder.success(res, null, 'Utilisateur mis à jour avec succès.');
  } catch (error) {
    logger.error(`[${requestId}] Erreur updateUser`, { error, id });
    return ApiResponder.error(res, error);
  }
}

export async function deleteUser(req: Request, res: Response): Promise<Response> {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';
  const { id } = req.params;
  try {
    // Vérifier les dépendances bloquantes
    const [inv] = await database.execute<Array<{ cnt: number }>>('SELECT COUNT(*) AS cnt FROM invoice WHERE created_by = ?', [id]);
    const [sup] = await database.execute<Array<{ cnt: number }>>('SELECT COUNT(*) AS cnt FROM supplier WHERE created_by = ?', [id]);
    const [dec] = await database.execute<Array<{ cnt: number }>>('SELECT COUNT(*) AS cnt FROM dfc_decision WHERE decided_by = ?', [id]);
    const [aud] = await database.execute<Array<{ cnt: number }>>('SELECT COUNT(*) AS cnt FROM audit_log WHERE performed_by = ?', [id]);
    const [act] = await database.execute<Array<{ cnt: number }>>('SELECT COUNT(*) AS cnt FROM user_activity WHERE user_id = ?', [id]);

    const invCount = Array.isArray(inv) ? inv[0]?.cnt ?? 0 : (inv as any)?.cnt ?? 0;
    const supCount = Array.isArray(sup) ? sup[0]?.cnt ?? 0 : (sup as any)?.cnt ?? 0;
    const decCount = Array.isArray(dec) ? dec[0]?.cnt ?? 0 : (dec as any)?.cnt ?? 0;
    const audCount = Array.isArray(aud) ? aud[0]?.cnt ?? 0 : (aud as any)?.cnt ?? 0;
    const actCount = Array.isArray(act) ? act[0]?.cnt ?? 0 : (act as any)?.cnt ?? 0;

    if (invCount > 0 || supCount > 0 || decCount > 0 || audCount > 0 || actCount > 0) {
      const details = { invoices: invCount, suppliers: supCount, dfc_decisions: decCount, audit_logs: audCount, activities: actCount };
      return ApiResponder.error(res, details, "Impossible de supprimer cet utilisateur: des ressources associées existent (factures, fournisseurs, décisions, journaux d'audit ou activités utilisateur).", 409);
    }

    await database.execute('DELETE FROM employee WHERE id = ?', [id]);
    logger.info(`[${requestId}] Utilisateur supprimé`, { id });
    return ApiResponder.success(res, null, 'Utilisateur supprimé avec succès.');
  } catch (error) {
    logger.error(`[${requestId}] Erreur deleteUser`, { error, id });
    return ApiResponder.error(res, error);
  }
}

export async function disableUser(req: Request, res: Response): Promise<Response> {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';
  const { id } = req.params;
  try {
    // Empêcher la désactivation des admins
    const roleRows = await database.execute<Array<{ role: string }>>('SELECT role FROM employee WHERE id = ? LIMIT 1', [id]);
    const role = Array.isArray(roleRows) && roleRows.length ? roleRows[0].role : null;
    if (!role) return ApiResponder.notFound(res, 'Utilisateur introuvable');
    if (role === 'admin') {
      return ApiResponder.forbidden(res, "Vous ne pouvez pas désactiver un administrateur.");
    }

    await database.execute('UPDATE employee SET isActive = 0 WHERE id = ?', [id]);
    logger.info(`[${requestId}] Utilisateur désactivé`, { id });
    return ApiResponder.success(res, null, 'Utilisateur désactivé avec succès.');
  } catch (error) {
    logger.error(`[${requestId}] Erreur disableUser`, { error, id });
    return ApiResponder.error(res, error);
  }
}

export async function enableUser(req: Request, res: Response): Promise<Response> {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';
  const { id } = req.params;
  try {
    await database.execute('UPDATE employee SET isActive = 1 WHERE id = ?', [id]);
    logger.info(`[${requestId}] Utilisateur réactivé`, { id });
    return ApiResponder.success(res, null, 'Utilisateur réactivé avec succès.');
  } catch (error) {
    logger.error(`[${requestId}] Erreur enableUser`, { error, id });
    return ApiResponder.error(res, error);
  }
}

export async function verifyUserEmail(req: Request, res: Response): Promise<Response> {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';
  const { id } = req.params;
  try {
    const rows = await database.execute<Array<{ isVerified: number }>>('SELECT isVerified FROM employee WHERE id = ? LIMIT 1', [id]);
    const current = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!current) return ApiResponder.notFound(res, 'Utilisateur introuvable');
    if (current.isVerified === 1) {
      return ApiResponder.success(res, null, 'Le compte est déjà vérifié.');
    }
    await database.execute('UPDATE employee SET isVerified = 1 WHERE id = ?', [id]);
    logger.info(`[${requestId}] Email utilisateur vérifié (admin action)`, { id });
    return ApiResponder.success(res, null, "L'email de l'utilisateur a été vérifié avec succès.");
  } catch (error) {
    logger.error(`[${requestId}] Erreur verifyUserEmail`, { error, id });
    return ApiResponder.error(res, error);
  }
}