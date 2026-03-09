const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const isProdLikeDatabaseUrl =
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('localhost') &&
  !process.env.DATABASE_URL.includes('127.0.0.1');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'false' ? false : isProdLikeDatabaseUrl ? { rejectUnauthorized: false } : false
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'fabrica',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
      }
);

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      email VARCHAR(120) UNIQUE NOT NULL,
      senha_hash VARCHAR(255) NOT NULL,
      tipo_usuario VARCHAR(20) NOT NULL CHECK (tipo_usuario IN ('admin', 'funcionario')),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      cliente VARCHAR(160) NOT NULL,
      modelo VARCHAR(160) NOT NULL,
      referencia VARCHAR(120) NOT NULL,
      data DATE NOT NULL,
      tecido VARCHAR(120) NOT NULL,
      largura NUMERIC(10,2),
      media NUMERIC(10,2),
      matriz NUMERIC(10,2),
      retalho NUMERIC(10,2),
      quantidade_total INTEGER NOT NULL CHECK (quantidade_total >= 0),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_sizes (
      id SERIAL PRIMARY KEY,
      pedido_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      tamanho VARCHAR(10) NOT NULL,
      quantidade INTEGER NOT NULL CHECK (quantidade >= 0),
      UNIQUE (pedido_id, tamanho)
    );

    CREATE TABLE IF NOT EXISTS production_records (
      id SERIAL PRIMARY KEY,
      pedido_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      etapa VARCHAR(30) NOT NULL CHECK (etapa IN ('Costura', 'Travete', 'Lavanderia', 'Acabamento', 'Estoque')),
      quantidade INTEGER NOT NULL CHECK (quantidade > 0),
      funcionario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      data TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Administrador';

  if (adminEmail && adminPassword) {
    const existingAdmin = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [adminEmail]);

    if (existingAdmin.rowCount === 0) {
      const senhaHash = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        `INSERT INTO users (nome, email, senha_hash, tipo_usuario)
         VALUES ($1, $2, $3, 'admin')`,
        [adminName, adminEmail, senhaHash]
      );
      console.log(`Admin inicial criado: ${adminEmail}`);
    }
  }
}

module.exports = { pool, initializeDatabase };
