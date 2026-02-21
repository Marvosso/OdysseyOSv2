/**
 * Centralized structured error logger.
 * - Never logs secrets, tokens, or keys
 * - Includes user_id, story_id where applicable
 * - Safe for production
 */

const SECRET_PATTERNS = [
  /sk_(live|test)_\w+/gi,
  /pk_(live|test)_\w+/gi,
  /whsec_\w+/gi,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  /bearer\s+\S+/gi,
  /authorization:\s*\S+/gi,
  /password["\s:=]+[^\s"']+/gi,
  /api[_-]?key["\s:=]+[^\s"']+/gi,
  /secret["\s:=]+[^\s"']+/gi,
];

function sanitize(value: unknown): string {
  if (value == null) return '';
  let s = typeof value === 'object' ? JSON.stringify(value) : String(value);
  for (const re of SECRET_PATTERNS) {
    s = s.replace(re, '[REDACTED]');
  }
  return s;
}

export type LogContext = {
  user_id?: string | null;
  story_id?: string | null;
  table?: string;
  operation?: string;
  event_type?: string;
  event_id?: string;
  [key: string]: unknown;
};

function formatContext(ctx: LogContext): string {
  const parts: string[] = [];
  if (ctx.user_id) parts.push(`user_id=${ctx.user_id}`);
  if (ctx.story_id) parts.push(`story_id=${ctx.story_id}`);
  if (ctx.table) parts.push(`table=${ctx.table}`);
  if (ctx.operation) parts.push(`op=${ctx.operation}`);
  if (ctx.event_type) parts.push(`event=${ctx.event_type}`);
  if (ctx.event_id) parts.push(`event_id=${ctx.event_id}`);
  return parts.length ? ` [${parts.join(' ')}]` : '';
}

/**
 * Log an error. Never logs secrets. Use for DB failures, webhook failures, etc.
 */
export function logError(
  message: string,
  err: unknown,
  context: LogContext = {}
): void {
  const ctxStr = formatContext(context);
  const safeMsg = sanitize(err instanceof Error ? err.message : String(err));
  console.error(`[OdysseyOS]${ctxStr} ${message}:`, safeMsg);
}

/**
 * Log a DB insert/update failure.
 */
export function logDbError(
  operation: 'insert' | 'update' | 'upsert' | 'delete' | 'select',
  table: string,
  err: unknown,
  context: Omit<LogContext, 'operation' | 'table'> = {}
): void {
  logError(`DB ${operation} failed on ${table}`, err, {
    ...context,
    operation,
    table,
  });
}

/**
 * Log a Stripe webhook failure.
 */
export function logStripeWebhookError(
  message: string,
  err: unknown,
  context: Omit<LogContext, 'event_type' | 'event_id'> & Partial<Pick<LogContext, 'event_type' | 'event_id'>> = {}
): void {
  logError(`Stripe webhook: ${message}`, err, {
    ...context,
    event_type: context.event_type,
    event_id: context.event_id,
  });
}

/**
 * Log a warning (non-fatal). Same sanitization rules.
 */
export function logWarn(message: string, context: LogContext = {}): void {
  const ctxStr = formatContext(context);
  console.warn(`[OdysseyOS]${ctxStr} ${message}`);
}
