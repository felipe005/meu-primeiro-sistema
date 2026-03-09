const { pool } = require('../config/database');

async function createOrder(orderInput) {
  const query = `
    INSERT INTO orders (cliente, modelo, referencia, data, tecido, largura, media, matriz, retalho, quantidade_total)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *
  `;

  const values = [
    orderInput.cliente,
    orderInput.modelo,
    orderInput.referencia,
    orderInput.data,
    orderInput.tecido,
    orderInput.largura,
    orderInput.media,
    orderInput.matriz,
    orderInput.retalho,
    orderInput.quantidade_total
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function listOrders() {
  const { rows } = await pool.query(`
    SELECT o.*,
      COALESCE(SUM(CASE WHEN pr.etapa = 'Loja' THEN pr.quantidade ELSE 0 END), 0)::int AS produzido_loja
    FROM orders o
    LEFT JOIN production_records pr ON pr.pedido_id = o.id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `);
  return rows;
}

async function findOrderById(id) {
  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1 LIMIT 1', [id]);
  return rows[0] || null;
}

async function setOrderSizes(orderId, sizes) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM order_sizes WHERE pedido_id = $1', [orderId]);

    for (const size of sizes) {
      await client.query(
        'INSERT INTO order_sizes (pedido_id, tamanho, quantidade) VALUES ($1, $2, $3)',
        [orderId, size.tamanho, size.quantidade]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getOrderSizes(orderId) {
  const { rows } = await pool.query(
    'SELECT pedido_id, tamanho, quantidade FROM order_sizes WHERE pedido_id = $1 ORDER BY tamanho::int',
    [orderId]
  );
  return rows;
}

module.exports = { createOrder, listOrders, findOrderById, setOrderSizes, getOrderSizes };
