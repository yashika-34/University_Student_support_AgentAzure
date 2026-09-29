import AuditLog from '../models/AuditLog.js';

/**
 * Enterprise Audit Logging Service
 * Records immutable, append-only logs of critical security, academic, and administrative operations.
 */
export const logAudit = async ({
  action,
  performedBy = null,
  performedByRole = 'system',
  targetUser = null,
  resourceType = null,
  resourceId = null,
  changes = null,
  metadata = {},
  ipAddress = null,
  userAgent = null,
  status = 'success',
  errorMessage = null,
  req = null
}) => {
  try {
    const ip = ipAddress || (req ? (req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip) : null);
    const ua = userAgent || (req ? req.headers['user-agent'] : null);
    const actor = performedBy || req?.user?._id;
    const role = performedByRole !== 'system' ? performedByRole : (req?.user?.role || 'system');

    if (!action || !actor) {
      console.warn('[AuditLog] Skipping audit entry: missing action or actor', { action, actor });
      return null;
    }

    const entry = await AuditLog.create({
      action,
      performedBy: actor,
      performedByRole: role,
      targetUser,
      resourceType,
      resourceId,
      changes,
      metadata,
      ipAddress: ip,
      userAgent: ua,
      status,
      errorMessage
    });

    return entry;
  } catch (err) {
    console.error('[AuditLog Error]:', err.message);
    return null;
  }
};

export default { logAudit };
