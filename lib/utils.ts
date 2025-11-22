import { CURRENCIES } from './currencies';

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = CURRENCIES[currencyCode as keyof typeof CURRENCIES];
  if (!currency) return `$${amount.toFixed(2)}`;
  
  return `${currency.symbol}${amount.toFixed(2)}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Normalizes Next.js API request body across runtimes (e.g. Netlify adapters)
// where req.body may arrive as a JSON string instead of an object.
export function getParsedBody<T = any>(req: any): T {
  const body = (req as any)?.body;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as T;
    } catch {
      return {} as T;
    }
  }
  return (body ?? {}) as T;
}

// Returns true if DB is configured; otherwise responds 503 and returns false.
export function requireDatabase(res: any): boolean {
  const normalize = (v?: string) => (v && v.trim().length > 0 ? v.trim() : undefined);

  if (!normalize(process.env.DATABASE_URL)) {
    const pooled = normalize(process.env.NETLIFY_DATABASE_URL);
    const direct = normalize(process.env.NETLIFY_DATABASE_URL_UNPOOLED);
    if (pooled || direct) {
      process.env.DATABASE_URL = pooled || direct;
    }
  }

  if (!normalize(process.env.DATABASE_URL)) {
    const envPresence = {
      databaseUrlPresent: !!normalize(process.env.DATABASE_URL),
      netlifyDatabaseUrlPresent: !!normalize(process.env.NETLIFY_DATABASE_URL),
      netlifyDatabaseUrlUnpooledPresent: !!normalize(process.env.NETLIFY_DATABASE_URL_UNPOOLED),
    };
    try {
      res.status(503).json({
        error: 'Database not configured',
        code: 'DB_MISSING',
        env: envPresence,
      });
    } catch {
      /* ignore */
    }
    try {
      console.warn('[requireDatabase] missing DATABASE_URL', envPresence);
    } catch {
      /* ignore */
    }
    return false;
  }
  return true;
}
