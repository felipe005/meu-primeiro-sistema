CREATE TABLE IF NOT EXISTS empresas (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  plano VARCHAR(30) NOT NULL DEFAULT 'trial',
  status_assinatura VARCHAR(20) NOT NULL DEFAULT 'trial' CHECK (status_assinatura IN ('trial', 'ativo', 'suspenso')),
  data_vencimento DATE NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(120) NOT NULL,
  telefone VARCHAR(30),
  email VARCHAR(160),
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veiculos (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id BIGINT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  placa VARCHAR(12) NOT NULL,
  marca VARCHAR(80),
  modelo VARCHAR(80) NOT NULL,
  cor VARCHAR(40),
  ano INTEGER,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, placa)
);

CREATE TABLE IF NOT EXISTS servicos (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT,
  preco NUMERIC(10, 2) NOT NULL DEFAULT 0,
  duracao_minutos INTEGER NOT NULL DEFAULT 30,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funcionarios (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(120) NOT NULL,
  cargo VARCHAR(80),
  telefone VARCHAR(30),
  salario NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id BIGINT NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  veiculo_id BIGINT NOT NULL REFERENCES veiculos(id) ON DELETE RESTRICT,
  servico_id BIGINT NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
  funcionario_id BIGINT REFERENCES funcionarios(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Aguardando' CHECK (status IN ('Aguardando', 'Em Lavagem', 'Finalizado')),
  valor NUMERIC(10, 2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS caixa (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria VARCHAR(80) NOT NULL,
  descricao TEXT,
  valor NUMERIC(10, 2) NOT NULL CHECK (valor >= 0),
  forma_pagamento VARCHAR(30) NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'pix', 'debito', 'credito', 'boleto', 'transferencia')),
  data_movimento DATE NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_empresa_id ON veiculos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_servicos_empresa_id ON servicos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_empresa_id ON funcionarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_empresa_id_data ON agendamentos(empresa_id, data);
CREATE INDEX IF NOT EXISTS idx_caixa_empresa_id_data ON caixa(empresa_id, data_movimento);
