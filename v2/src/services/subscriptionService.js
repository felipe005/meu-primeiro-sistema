const { z } = require('zod');
const companyModel = require('../models/companyModel');

const schema = z.object({
  plano: z.enum(['trial', 'ativo', 'suspenso']),
  statusAssinatura: z.enum(['trial', 'ativo', 'suspenso']),
  dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dataVencimento invalida (YYYY-MM-DD).'),
});

async function get(empresaId) {
  const company = await companyModel.findById(empresaId);
  if (!company) {
    const error = new Error('Empresa nao encontrada.');
    error.status = 404;
    throw error;
  }
  return {
    id: company.id,
    nome: company.nome,
    email: company.email,
    plano: company.plano,
    statusAssinatura: company.statusAssinatura,
    dataVencimento: company.dataVencimento,
  };
}

async function update(empresaId, input) {
  const data = schema.parse(input);
  const updated = await companyModel.updateSubscription(empresaId, data);
  if (!updated) {
    const error = new Error('Empresa nao encontrada.');
    error.status = 404;
    throw error;
  }
  return updated;
}

function paymentIntegrationInfo() {
  return {
    status: 'ready_for_future',
    provider: null,
    message: 'Estrutura pronta para integrar gateway de pagamento no futuro (webhooks, assinaturas recorrentes, concilicao).',
  };
}

module.exports = {
  get,
  update,
  paymentIntegrationInfo,
};
