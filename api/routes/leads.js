import { Router } from 'express';
import crypto from 'node:crypto';
import { getDb } from '../db.js';

const router = Router();

const VALID_STATUSES = [
  'Novo',
  'Aguardando Pagamento',
  'Revisando (IA)',
  'Entregue'
];

export function formatLead(row) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    name: row.nome,
    link: row.link,
    area: row.area,
    areaRole: row.area,
    status: row.status,
    data_criacao: row.data_criacao,
    createdAt: row.data_criacao
  };
}

// GET /leads - List all leads ordered by data_criacao DESC
router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM leads ORDER BY data_criacao DESC');
    return res.status(200).json(rows.map(formatLead));
  } catch (err) {
    next(err);
  }
});

// POST /leads - Create a new lead
router.post('/', async (req, res, next) => {
  try {
    const nome = typeof req.body?.nome === 'string'
      ? req.body.nome.trim()
      : (typeof req.body?.name === 'string' ? req.body.name.trim() : '');
    const link = typeof req.body?.link === 'string' ? req.body.link.trim() : '';
    const area = typeof req.body?.area === 'string'
      ? req.body.area.trim()
      : (typeof req.body?.areaRole === 'string' ? req.body.areaRole.trim() : '');

    if (!nome || !link || !area) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, link, area' });
    }

    const id = crypto.randomUUID();
    const status = 'Novo';
    const data_criacao = new Date().toISOString();

    const db = await getDb();
    await db.run(
      'INSERT INTO leads (id, nome, link, area, status, data_criacao) VALUES (?, ?, ?, ?, ?, ?)',
      [id, nome, link, area, status, data_criacao]
    );

    const created = {
      id,
      nome,
      name: nome,
      link,
      area,
      areaRole: area,
      status,
      data_criacao,
      createdAt: data_criacao
    };

    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /leads/:id - Update lead status
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const db = await getDb();
    const existing = await db.get('SELECT * FROM leads WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    await db.run('UPDATE leads SET status = ? WHERE id = ?', [status, id]);
    const updated = await db.get('SELECT * FROM leads WHERE id = ?', [id]);

    return res.status(200).json(formatLead(updated));
  } catch (err) {
    next(err);
  }
});

// DELETE /leads/:id - Delete lead
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const existing = await db.get('SELECT * FROM leads WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    await db.run('DELETE FROM leads WHERE id = ?', [id]);
    return res.status(200).json({ message: 'Lead excluído com sucesso', id });
  } catch (err) {
    next(err);
  }
});

export default router;
