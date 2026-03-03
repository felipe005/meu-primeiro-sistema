const tokenKey = 'lavajato_token_v2';
const token = localStorage.getItem(tokenKey);
if (!token) window.location.href = '/';

const state = {
  clientes: [],
  veiculos: [],
  servicos: [],
  funcionarios: [],
  agendamentos: [],
  caixa: [],
  assinatura: null,
  dashboard: null,
};

const nodes = {
  message: document.getElementById('global-message'),
  companyName: document.getElementById('company-name'),
  companyPlan: document.getElementById('company-plan'),
  menu: document.getElementById('menu'),
  screens: document.querySelectorAll('[data-screen]'),
  chart: document.getElementById('chart-canvas'),
  metricTotalDia: document.getElementById('metric-total-dia'),
  metricServicosDia: document.getElementById('metric-servicos-dia'),
  metricTotalMes: document.getElementById('metric-total-mes'),
  clienteForm: document.getElementById('cliente-form'),
  veiculoForm: document.getElementById('veiculo-form'),
  servicoForm: document.getElementById('servico-form'),
  funcionarioForm: document.getElementById('funcionario-form'),
  agendamentoForm: document.getElementById('agendamento-form'),
  agendamentoFilter: document.getElementById('agendamento-filter'),
  caixaForm: document.getElementById('caixa-form'),
  relatorioForm: document.getElementById('relatorio-form'),
  assinaturaForm: document.getElementById('assinatura-form'),
  clientesList: document.getElementById('clientes-list'),
  veiculosList: document.getElementById('veiculos-list'),
  servicosList: document.getElementById('servicos-list'),
  funcionariosList: document.getElementById('funcionarios-list'),
  agendamentosList: document.getElementById('agendamentos-list'),
  caixaList: document.getElementById('caixa-list'),
  relatorioBox: document.getElementById('relatorio-box'),
  assinaturaInfo: document.getElementById('assinatura-info'),
  veiculoCliente: document.getElementById('veiculo-cliente'),
  agendaCliente: document.getElementById('agenda-cliente'),
  agendaVeiculo: document.getElementById('agenda-veiculo'),
  agendaServico: document.getElementById('agenda-servico'),
  agendaFuncionario: document.getElementById('agenda-funcionario'),
  logout: document.getElementById('logout-btn'),
};

function money(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function showMessage(text, isError = false) {
  nodes.message.textContent = text;
  nodes.message.className = `mb-3 min-h-6 text-sm ${isError ? 'text-rose-300' : 'text-emerald-300'}`;
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem(tokenKey);
      window.location.href = '/';
    }
    throw new Error(data.message || 'Erro na requisicao.');
  }
  return data;
}

function setScreen(name) {
  nodes.screens.forEach((screen) => screen.classList.toggle('hidden', screen.dataset.screen !== name));
  nodes.menu.querySelectorAll('[data-view]').forEach((btn) => {
    if (btn.dataset.view === name) {
      btn.className = 'w-full rounded-xl bg-cyan-500 px-3 py-2 text-left text-sm font-semibold text-slate-900';
    } else {
      btn.className = 'w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800';
    }
  });
}

function toBool(value) {
  return value === true || value === 'true' || value === '1';
}

function fillSelect(select, items, labelKey = 'nome') {
  select.innerHTML = '<option value="">Selecione</option>' + items.map((i) => `<option value="${i.id}">${i[labelKey]}</option>`).join('');
}

function renderTable(node, headers, rows) {
  if (!rows.length) {
    node.innerHTML = '<p class="text-sm text-slate-400">Nenhum registro encontrado.</p>';
    return;
  }
  const head = headers.map((h) => `<th class="px-3 py-2 text-left text-xs font-semibold text-slate-400">${h}</th>`).join('');
  const body = rows.map((r) => `<tr class="border-t border-slate-800">${r}</tr>`).join('');
  node.innerHTML = `<table class="w-full text-sm"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderDashboard() {
  if (!state.dashboard) return;
  nodes.metricTotalDia.textContent = money(state.dashboard.totalDia);
  nodes.metricServicosDia.textContent = state.dashboard.servicosDia;
  nodes.metricTotalMes.textContent = money(state.dashboard.totalMes);
  drawChart(state.dashboard.grafico || []);
}

function drawChart(points) {
  const canvas = nodes.chart;
  const ctx = canvas.getContext('2d');
  const width = canvas.clientWidth;
  const height = 120;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);

  if (!points.length) return;
  const values = points.flatMap((p) => [Number(p.entradas || 0), Number(p.saidas || 0)]);
  const max = Math.max(1, ...values);
  const stepX = width / Math.max(1, points.length - 1);

  function drawLine(key, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    points.forEach((p, index) => {
      const x = index * stepX;
      const y = height - (Number(p[key] || 0) / max) * (height - 20) - 10;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  drawLine('entradas', '#22c55e');
  drawLine('saidas', '#f43f5e');
}

function renderClientes() {
  renderTable(nodes.clientesList, ['Nome', 'Telefone', 'Email', 'Acoes'], state.clientes.map((item) => `
    <td class="px-3 py-2">${item.nome}</td>
    <td class="px-3 py-2">${item.telefone || '-'}</td>
    <td class="px-3 py-2">${item.email || '-'}</td>
    <td class="px-3 py-2">
      <button data-edit-cliente="${item.id}" class="mr-2 rounded bg-slate-700 px-2 py-1 text-xs">Editar</button>
      <button data-del-cliente="${item.id}" class="rounded bg-rose-600 px-2 py-1 text-xs">Excluir</button>
    </td>
  `));
}

function renderVeiculos() {
  const veiculoSubmitButton = nodes.veiculoForm.querySelector('button');
  if (!state.clientes.length) {
    nodes.veiculoCliente.innerHTML = '<option value="">Cadastre um cliente primeiro</option>';
    nodes.veiculoCliente.disabled = true;
    nodes.veiculoCliente.required = false;
    if (veiculoSubmitButton) {
      veiculoSubmitButton.disabled = true;
      veiculoSubmitButton.classList.add('cursor-not-allowed', 'opacity-60');
    }
  } else {
    fillSelect(nodes.veiculoCliente, state.clientes);
    nodes.veiculoCliente.disabled = false;
    nodes.veiculoCliente.required = true;
    if (veiculoSubmitButton) {
      veiculoSubmitButton.disabled = false;
      veiculoSubmitButton.classList.remove('cursor-not-allowed', 'opacity-60');
    }
  }
  fillSelect(nodes.agendaVeiculo, state.veiculos, 'placa');
  renderTable(nodes.veiculosList, ['Placa', 'Modelo', 'Cliente', 'Acoes'], state.veiculos.map((item) => `
    <td class="px-3 py-2">${item.placa}</td>
    <td class="px-3 py-2">${item.modelo}</td>
    <td class="px-3 py-2">${item.clienteNome || '-'}</td>
    <td class="px-3 py-2">
      <button data-edit-veiculo="${item.id}" class="mr-2 rounded bg-slate-700 px-2 py-1 text-xs">Editar</button>
      <button data-del-veiculo="${item.id}" class="rounded bg-rose-600 px-2 py-1 text-xs">Excluir</button>
    </td>
  `));
}

function renderServicos() {
  fillSelect(nodes.agendaServico, state.servicos);
  renderTable(nodes.servicosList, ['Servico', 'Preco', 'Duracao', 'Acoes'], state.servicos.map((item) => `
    <td class="px-3 py-2">${item.nome}</td>
    <td class="px-3 py-2">${money(item.preco)}</td>
    <td class="px-3 py-2">${item.duracaoMinutos} min</td>
    <td class="px-3 py-2">
      <button data-edit-servico="${item.id}" class="mr-2 rounded bg-slate-700 px-2 py-1 text-xs">Editar</button>
      <button data-del-servico="${item.id}" class="rounded bg-rose-600 px-2 py-1 text-xs">Excluir</button>
    </td>
  `));
}

function renderFuncionarios() {
  nodes.agendaFuncionario.innerHTML = '<option value="">Sem funcionario</option>' + state.funcionarios.map((f) => `<option value="${f.id}">${f.nome}</option>`).join('');
  renderTable(nodes.funcionariosList, ['Nome', 'Cargo', 'Salario', 'Acoes'], state.funcionarios.map((item) => `
    <td class="px-3 py-2">${item.nome}</td>
    <td class="px-3 py-2">${item.cargo || '-'}</td>
    <td class="px-3 py-2">${money(item.salario)}</td>
    <td class="px-3 py-2">
      <button data-edit-funcionario="${item.id}" class="mr-2 rounded bg-slate-700 px-2 py-1 text-xs">Editar</button>
      <button data-del-funcionario="${item.id}" class="rounded bg-rose-600 px-2 py-1 text-xs">Excluir</button>
    </td>
  `));
}

function renderAgendamentos() {
  fillSelect(nodes.agendaCliente, state.clientes);
  renderTable(nodes.agendamentosList, ['Data', 'Hora', 'Cliente', 'Servico', 'Status', 'Acoes'], state.agendamentos.map((item) => `
    <td class="px-3 py-2">${item.data}</td>
    <td class="px-3 py-2">${String(item.hora).slice(0, 5)}</td>
    <td class="px-3 py-2">${item.clienteNome}</td>
    <td class="px-3 py-2">${item.servicoNome}</td>
    <td class="px-3 py-2">${item.status}</td>
    <td class="px-3 py-2">
      <button data-edit-agenda="${item.id}" class="mr-2 rounded bg-slate-700 px-2 py-1 text-xs">Editar</button>
      <button data-del-agenda="${item.id}" class="rounded bg-rose-600 px-2 py-1 text-xs">Excluir</button>
    </td>
  `));
}

function renderCaixa() {
  renderTable(nodes.caixaList, ['Data', 'Tipo', 'Categoria', 'Valor', 'Pagamento', 'Acoes'], state.caixa.map((item) => `
    <td class="px-3 py-2">${item.dataMovimento}</td>
    <td class="px-3 py-2">${item.tipo}</td>
    <td class="px-3 py-2">${item.categoria}</td>
    <td class="px-3 py-2">${money(item.valor)}</td>
    <td class="px-3 py-2">${item.formaPagamento}</td>
    <td class="px-3 py-2">
      <button data-del-caixa="${item.id}" class="rounded bg-rose-600 px-2 py-1 text-xs">Excluir</button>
    </td>
  `));
}

function renderAssinatura() {
  if (!state.assinatura) return;
  nodes.companyName.textContent = state.assinatura.nome;
  nodes.companyPlan.textContent = `${state.assinatura.plano.toUpperCase()} | ${state.assinatura.statusAssinatura.toUpperCase()} | Vence: ${state.assinatura.dataVencimento}`;
  nodes.assinaturaForm.plano.value = state.assinatura.plano;
  nodes.assinaturaForm.statusAssinatura.value = state.assinatura.statusAssinatura;
  nodes.assinaturaForm.dataVencimento.value = state.assinatura.dataVencimento;
  nodes.assinaturaInfo.textContent = `Status atual: ${state.assinatura.statusAssinatura}. Plano: ${state.assinatura.plano}.`;
}

async function loadDashboard() {
  state.dashboard = await api('/api/dashboard');
  renderDashboard();
}

async function loadClientes() {
  state.clientes = await api('/api/clientes');
  renderClientes();
}

async function loadVeiculos() {
  state.veiculos = await api('/api/veiculos');
  renderVeiculos();
}

async function loadServicos() {
  state.servicos = await api('/api/servicos');
  renderServicos();
}

async function loadFuncionarios() {
  state.funcionarios = await api('/api/funcionarios');
  renderFuncionarios();
}

async function loadAgendamentos(filters = {}) {
  const params = new URLSearchParams();
  if (filters.data) params.set('data', filters.data);
  if (filters.status) params.set('status', filters.status);
  const qs = params.toString();
  state.agendamentos = await api(`/api/agendamentos${qs ? `?${qs}` : ''}`);
  renderAgendamentos();
}

async function loadCaixa() {
  state.caixa = await api('/api/caixa');
  renderCaixa();
}

async function loadAssinatura() {
  state.assinatura = await api('/api/assinatura');
  renderAssinatura();
}

function bindRowActions() {
  document.addEventListener('click', async (event) => {
    const id = Number(event.target.dataset.editCliente);
    if (id) {
      const item = state.clientes.find((x) => x.id === id);
      nodes.clienteForm.id.value = item.id;
      nodes.clienteForm.nome.value = item.nome;
      nodes.clienteForm.telefone.value = item.telefone || '';
      nodes.clienteForm.email.value = item.email || '';
      nodes.clienteForm.observacoes.value = item.observacoes || '';
      return;
    }
    const delCliente = Number(event.target.dataset.delCliente);
    if (delCliente) {
      await api(`/api/clientes/${delCliente}`, { method: 'DELETE' });
      await loadClientes();
      showMessage('Cliente removido.');
      return;
    }

    const editVeiculo = Number(event.target.dataset.editVeiculo);
    if (editVeiculo) {
      const item = state.veiculos.find((x) => x.id === editVeiculo);
      nodes.veiculoForm.id.value = item.id;
      nodes.veiculoForm.clienteId.value = item.clienteId;
      nodes.veiculoForm.placa.value = item.placa;
      nodes.veiculoForm.marca.value = item.marca || '';
      nodes.veiculoForm.modelo.value = item.modelo || '';
      nodes.veiculoForm.cor.value = item.cor || '';
      nodes.veiculoForm.ano.value = item.ano || '';
      return;
    }
    const delVeiculo = Number(event.target.dataset.delVeiculo);
    if (delVeiculo) {
      await api(`/api/veiculos/${delVeiculo}`, { method: 'DELETE' });
      await loadVeiculos();
      showMessage('Veiculo removido.');
      return;
    }

    const editServico = Number(event.target.dataset.editServico);
    if (editServico) {
      const item = state.servicos.find((x) => x.id === editServico);
      nodes.servicoForm.id.value = item.id;
      nodes.servicoForm.nome.value = item.nome;
      nodes.servicoForm.descricao.value = item.descricao || '';
      nodes.servicoForm.preco.value = item.preco;
      nodes.servicoForm.duracaoMinutos.value = item.duracaoMinutos;
      nodes.servicoForm.ativo.value = String(item.ativo);
      return;
    }
    const delServico = Number(event.target.dataset.delServico);
    if (delServico) {
      await api(`/api/servicos/${delServico}`, { method: 'DELETE' });
      await loadServicos();
      showMessage('Servico removido.');
      return;
    }

    const editFuncionario = Number(event.target.dataset.editFuncionario);
    if (editFuncionario) {
      const item = state.funcionarios.find((x) => x.id === editFuncionario);
      nodes.funcionarioForm.id.value = item.id;
      nodes.funcionarioForm.nome.value = item.nome;
      nodes.funcionarioForm.cargo.value = item.cargo || '';
      nodes.funcionarioForm.telefone.value = item.telefone || '';
      nodes.funcionarioForm.salario.value = item.salario || '';
      nodes.funcionarioForm.ativo.value = String(item.ativo);
      return;
    }
    const delFuncionario = Number(event.target.dataset.delFuncionario);
    if (delFuncionario) {
      await api(`/api/funcionarios/${delFuncionario}`, { method: 'DELETE' });
      await loadFuncionarios();
      showMessage('Funcionario removido.');
      return;
    }

    const editAgenda = Number(event.target.dataset.editAgenda);
    if (editAgenda) {
      const item = state.agendamentos.find((x) => x.id === editAgenda);
      nodes.agendamentoForm.id.value = item.id;
      nodes.agendamentoForm.clienteId.value = item.clienteId;
      nodes.agendamentoForm.veiculoId.value = item.veiculoId;
      nodes.agendamentoForm.servicoId.value = item.servicoId;
      nodes.agendamentoForm.funcionarioId.value = item.funcionarioId || '';
      nodes.agendamentoForm.data.value = item.data;
      nodes.agendamentoForm.hora.value = String(item.hora).slice(0, 5);
      nodes.agendamentoForm.status.value = item.status;
      nodes.agendamentoForm.valor.value = item.valor;
      nodes.agendamentoForm.observacoes.value = item.observacoes || '';
      return;
    }
    const delAgenda = Number(event.target.dataset.delAgenda);
    if (delAgenda) {
      await api(`/api/agendamentos/${delAgenda}`, { method: 'DELETE' });
      await loadAgendamentos();
      await loadDashboard();
      showMessage('Agendamento removido.');
      return;
    }

    const delCaixa = Number(event.target.dataset.delCaixa);
    if (delCaixa) {
      await api(`/api/caixa/${delCaixa}`, { method: 'DELETE' });
      await Promise.all([loadCaixa(), loadDashboard()]);
      showMessage('Movimentacao removida.');
    }
  });
}

function bindForms() {
  nodes.clienteForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(nodes.clienteForm).entries());
    const id = payload.id;
    delete payload.id;
    if (id) await api(`/api/clientes/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await api('/api/clientes', { method: 'POST', body: JSON.stringify(payload) });
    nodes.clienteForm.reset();
    await Promise.all([loadClientes(), loadVeiculos()]);
    showMessage('Cliente salvo.');
  });

  nodes.veiculoForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.clientes.length) {
      showMessage('Cadastre um cliente antes de salvar um veiculo.', true);
      return;
    }
    const payload = Object.fromEntries(new FormData(nodes.veiculoForm).entries());
    if (!payload.clienteId) {
      showMessage('Selecione um cliente para o veiculo.', true);
      return;
    }
    const id = payload.id;
    delete payload.id;
    payload.clienteId = Number(payload.clienteId);
    payload.ano = payload.ano ? Number(payload.ano) : undefined;
    if (id) await api(`/api/veiculos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await api('/api/veiculos', { method: 'POST', body: JSON.stringify(payload) });
    nodes.veiculoForm.reset();
    await Promise.all([loadVeiculos(), loadAgendamentos()]);
    showMessage('Veiculo salvo.');
  });

  nodes.servicoForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(nodes.servicoForm).entries());
    const id = payload.id;
    delete payload.id;
    payload.preco = Number(payload.preco);
    payload.duracaoMinutos = Number(payload.duracaoMinutos);
    payload.ativo = toBool(payload.ativo);
    if (id) await api(`/api/servicos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await api('/api/servicos', { method: 'POST', body: JSON.stringify(payload) });
    nodes.servicoForm.reset();
    await Promise.all([loadServicos(), loadAgendamentos()]);
    showMessage('Servico salvo.');
  });

  nodes.funcionarioForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(nodes.funcionarioForm).entries());
    const id = payload.id;
    delete payload.id;
    payload.salario = Number(payload.salario);
    payload.ativo = toBool(payload.ativo);
    if (id) await api(`/api/funcionarios/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await api('/api/funcionarios', { method: 'POST', body: JSON.stringify(payload) });
    nodes.funcionarioForm.reset();
    await Promise.all([loadFuncionarios(), loadAgendamentos()]);
    showMessage('Funcionario salvo.');
  });

  nodes.agendamentoForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(nodes.agendamentoForm).entries());
    const id = payload.id;
    delete payload.id;
    payload.clienteId = Number(payload.clienteId);
    payload.veiculoId = Number(payload.veiculoId);
    payload.servicoId = Number(payload.servicoId);
    payload.funcionarioId = payload.funcionarioId ? Number(payload.funcionarioId) : null;
    payload.valor = Number(payload.valor);
    if (id) await api(`/api/agendamentos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await api('/api/agendamentos', { method: 'POST', body: JSON.stringify(payload) });
    nodes.agendamentoForm.reset();
    await Promise.all([loadAgendamentos(), loadDashboard()]);
    showMessage('Agendamento salvo.');
  });

  nodes.agendamentoFilter.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(nodes.agendamentoFilter).entries());
    await loadAgendamentos(payload);
  });

  nodes.caixaForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(nodes.caixaForm).entries());
    payload.valor = Number(payload.valor);
    await api('/api/caixa', { method: 'POST', body: JSON.stringify(payload) });
    nodes.caixaForm.reset();
    await Promise.all([loadCaixa(), loadDashboard()]);
    showMessage('Movimentacao registrada.');
  });

  nodes.relatorioForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(nodes.relatorioForm).entries());
    const report = await api(`/api/caixa/relatorio/mensal?mes=${payload.mes}`);
    const lines = [
      `Mes: ${report.mes}`,
      `Entradas: ${money(report.resumo.entradas)}`,
      `Saidas: ${money(report.resumo.saidas)}`,
      `Saldo: ${money(report.resumo.saldo)}`,
      '',
      ...report.porFormaPagamento.map((item) => `${item.formaPagamento}: +${money(item.entradas)} / -${money(item.saidas)}`),
    ];
    nodes.relatorioBox.textContent = lines.join('\n');
  });

  nodes.assinaturaForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(nodes.assinaturaForm).entries());
    await api('/api/assinatura', { method: 'PUT', body: JSON.stringify(payload) });
    await loadAssinatura();
    showMessage('Assinatura atualizada.');
  });
}

function bindMenu() {
  nodes.menu.addEventListener('click', (event) => {
    const button = event.target.closest('[data-view]');
    if (!button) return;
    setScreen(button.dataset.view);
  });
}

async function bootstrap() {
  try {
    bindMenu();
    bindForms();
    bindRowActions();
    nodes.logout.addEventListener('click', () => {
      localStorage.removeItem(tokenKey);
      window.location.href = '/';
    });

    await loadAssinatura();
    await Promise.all([
      loadDashboard(),
      loadClientes(),
      loadVeiculos(),
      loadServicos(),
      loadFuncionarios(),
      loadAgendamentos(),
      loadCaixa(),
    ]);
    setScreen('dashboard');
    showMessage('Sistema carregado.');
  } catch (error) {
    showMessage(error.message, true);
  }
}

bootstrap();
