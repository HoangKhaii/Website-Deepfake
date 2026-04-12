const { query } = require('../config/db');
const { clampInt, quoteIdent, getPublicTableColumns, buildRedactor } = require('../utils/pg-utils');

async function dbTime(req, res) {
  try {
    const { rows } = await query('SELECT NOW() AS now');
    return res.json({ ok: true, now: rows?.[0]?.now });
  } catch (err) {
    const status = err?.code === 'DB_NOT_READY' ? 503 : 500;
    return res.status(status).json({ ok: false, error: err?.message || 'DB error' });
  }
}

async function listTables(req, res) {
  try {
    const { rows } = await query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
      `
    );
    return res.json({ ok: true, tables: rows.map((r) => r.table_name) });
  } catch (err) {
    const status = err?.code === 'DB_NOT_READY' ? 503 : 500;
    return res.status(status).json({ ok: false, error: err?.message || 'DB error' });
  }
}

async function describeTableSchema(req, res) {
  try {
    const table = String(req.params.table || '').trim();
    if (!table) return res.status(400).json({ ok: false, error: 'Missing table' });

    const columns = await getPublicTableColumns(table);
    if (!columns.length) {
      return res.status(404).json({ ok: false, error: 'Table not found' });
    }

    return res.json({
      ok: true,
      table,
      columns: columns.map(({ column_name, data_type, is_nullable, ordinal_position }) => ({
        column_name,
        data_type,
        is_nullable,
        ordinal_position,
      })),
    });
  } catch (err) {
    const status = err?.code === 'DB_NOT_READY' ? 503 : 500;
    return res.status(status).json({ ok: false, error: err?.message || 'DB error' });
  }
}

async function sampleTableRows(req, res) {
  try {
    const table = String(req.params.table || '').trim();
    if (!table) return res.status(400).json({ ok: false, error: 'Missing table' });

    const limit = clampInt(req.query.limit, { min: 1, max: 100, fallback: 10 });
    const offset = clampInt(req.query.offset, { min: 0, max: 100000, fallback: 0 });

    const columns = await getPublicTableColumns(table);
    if (!columns.length) {
      return res.status(404).json({ ok: false, error: 'Table not found' });
    }
    const redact = buildRedactor(columns);

    const sql = `SELECT * FROM ${quoteIdent(table)} LIMIT $1 OFFSET $2`;
    const { rows } = await query(sql, [limit, offset]);

    return res.json({
      ok: true,
      table,
      limit,
      offset,
      rows: rows.map(redact),
    });
  } catch (err) {
    const status = err?.code === 'DB_NOT_READY' ? 503 : 500;
    return res.status(status).json({ ok: false, error: err?.message || 'DB error' });
  }
}

module.exports = {
  dbTime,
  listTables,
  describeTableSchema,
  sampleTableRows,
};

