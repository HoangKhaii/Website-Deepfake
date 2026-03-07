const { query } = require('../config/db');

function quoteIdent(ident) {
  return `"${String(ident).replace(/"/g, '""')}"`;
}

function clampInt(value, { min, max, fallback }) {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

async function ensurePublicTable(tableName) {
  const { rows } = await query(
    `
    SELECT 1 AS ok
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name = $1
    LIMIT 1
    `,
    [tableName]
  );
  return rows.length > 0;
}

async function getPublicTableColumns(tableName) {
  const { rows } = await query(
    `
    SELECT column_name, data_type, is_nullable, ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
    `,
    [tableName]
  );
  return rows;
}

function buildRedactor(columns) {
  const sensitive = new Set(
    columns
      .map((c) => String(c.column_name))
      .filter((name) => /pass(word)?|token|secret|otp|hash/i.test(name))
  );

  return (row) => {
    if (!row || typeof row !== 'object') return row;
    const out = { ...row };
    for (const key of Object.keys(out)) {
      if (sensitive.has(key)) out[key] = '[REDACTED]';
    }
    return out;
  };
}

module.exports = {
  quoteIdent,
  clampInt,
  ensurePublicTable,
  getPublicTableColumns,
  buildRedactor,
};

