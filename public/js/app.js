const SIZES = ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56'];
const STAGES = [
  { value: '', label: 'Todas as etapas' },
  { value: 'Corte', label: 'Corte' },
  { value: 'Confeccao', label: 'Confecção' },
  { value: 'Travete', label: 'Travete' },
  { value: 'Lavanderia', label: 'Lavanderia' },
  { value: 'Acabamento', label: 'Acabamento' },
  { value: 'Loja', label: 'Loja' }
];

const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '/';
}

const state = {
  currentOrderStatus: 'ativo',
  currentUser: null,
  users: [],
  orders: [],
  orderCatalog: [],
  historyFilters: {
    orderId: '',
    etapa: '',
    employeeId: '',
    type: 'all',
    from: '',
    to: ''
  },
  historyPage: 1,
  historyTotalPages: 1
};

function showMessage(message, isError = false) {
  const el = document.getElementById('appMessage');
  el.textContent = message;
  el.classList.remove('hidden');
  el.classList.toggle('bg-red-700', isError);
  el.classList.toggle('bg-slate-800', !isError);
  setTimeout(() => el.classList.add('hidden'), 3000);
}

function formatDate(value) {
  return new Date(value).toLocaleString('pt-BR');
}

function getThemeMode() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function toggleTheme() {
  const next = getThemeMode() === 'dark' ? 'light' : 'dark';
  document.documentElement.classList.toggle('dark', next === 'dark');
  localStorage.setItem('theme_mode', next);
}

async function apiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    localStorage.clear();
    window.location.href = '/';
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erro na requisição.');
  }

  return data;
}

function setActiveNav(view) {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('bg-slate-200', btn.dataset.view === view);
    btn.classList.toggle('dark:bg-slate-800', btn.dataset.view === view);
  });
}

function openView(view) {
  document.querySelectorAll('.view').forEach((section) => section.classList.add('hidden'));
  const target = document.getElementById(`${view}View`);
  if (target) {
    target.classList.remove('hidden');
    setActiveNav(view);
  }
}

function bindThemeButtons() {
  ['themeToggleDesktop', 'themeToggleMobile'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', toggleTheme);
  });
}

function bindPhotoPicker() {
  const fotoInput = document.getElementById('foto');
  const trigger = document.getElementById('fotoTrigger');
  const name = document.getElementById('fotoNome');

  trigger.addEventListener('click', () => fotoInput.click());
  fotoInput.addEventListener('change', () => {
    name.textContent = fotoInput.files && fotoInput.files[0] ? fotoInput.files[0].name : 'Nenhum arquivo selecionado';
  });
}

function setupNavigation(user) {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => openView(btn.dataset.view));
  });

  const logout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const logoutDesktop = document.getElementById('logoutBtnDesktop');
  const logoutMobile = document.getElementById('logoutBtnMobile');
  if (logoutDesktop) logoutDesktop.addEventListener('click', logout);
  if (logoutMobile) logoutMobile.addEventListener('click', logout);

  if (user.tipo_usuario !== 'admin') {
    const usersView = document.getElementById('usersView');
    const usersNavDesktop = document.getElementById('usersNavDesktop');
    const orderForm = document.getElementById('orderForm');

    if (usersView) usersView.classList.add('hidden');
    if (usersNavDesktop) usersNavDesktop.classList.add('hidden');
    if (orderForm) orderForm.classList.add('hidden');
  }

  openView('register');
}

function buildSizesInputs() {
  const grid = document.getElementById('sizesGrid');
  if (!grid) return;

  grid.innerHTML = SIZES.map(
    (size) => `
      <label class="rounded-xl border border-slate-300 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-900">
        <span class="block font-medium">${size}</span>
        <input type="number" min="0" value="0" data-size="${size}" class="mt-1 w-full rounded border border-slate-300 bg-transparent p-1 dark:border-slate-700" />
      </label>
    `
  ).join('');
}

function buildHistoryFilters() {
  const stageSelect = document.getElementById('filterStage');
  stageSelect.innerHTML = STAGES.map((item) => `<option value="${item.value}">${item.label}</option>`).join('');

  const typeSelect = document.getElementById('filterType');
  typeSelect.value = state.historyFilters.type;
}

function renderOrderSelects() {
  const registerSelect = document.getElementById('pedido_id');
  const filterOrder = document.getElementById('filterOrder');

  const activeOrders = state.orderCatalog.filter((order) => order.status === 'ativo');

  registerSelect.innerHTML = activeOrders
    .map((order) => `<option value="${order.id}">#${order.id} - ${order.cliente} - ${order.modelo}</option>`)
    .join('');

  filterOrder.innerHTML = [`<option value="">Todos os pedidos</option>`]
    .concat(state.orderCatalog.map((order) => `<option value="${order.id}">#${order.id} - ${order.cliente}</option>`))
    .join('');

  filterOrder.value = state.historyFilters.orderId;
}

function renderEmployeeFilter() {
  const employeeSelect = document.getElementById('filterEmployee');

  if (state.currentUser.tipo_usuario !== 'admin') {
    employeeSelect.innerHTML = `<option value="">Meu usuário</option>`;
    employeeSelect.disabled = true;
    return;
  }

  employeeSelect.disabled = false;
  employeeSelect.innerHTML = [`<option value="">Todos os funcionários</option>`]
    .concat(state.users.map((user) => `<option value="${user.id}">${user.nome}</option>`))
    .join('');

  employeeSelect.value = state.historyFilters.employeeId;
}

function renderOrdersTable() {
  const tbody = document.getElementById('ordersTable');

  if (!state.orders.length) {
    tbody.innerHTML = '<tr><td class="p-3" colspan="8">Sem pedidos para este status.</td></tr>';
    return;
  }

  tbody.innerHTML = state.orders.map((order) => {
    const canManage = state.currentUser.tipo_usuario === 'admin';

    const actionButtons = !canManage
      ? '-'
      : `
        <div class="flex flex-wrap gap-1">
          ${order.status === 'ativo' ? `<button class="order-action rounded bg-amber-100 px-2 py-1 text-xs text-amber-700" data-action="archive" data-id="${order.id}">Arquivar</button>` : ''}
          ${order.status === 'arquivado' ? `<button class="order-action rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700" data-action="unarchive" data-id="${order.id}">Reativar</button>` : ''}
          <button class="order-action rounded bg-red-100 px-2 py-1 text-xs text-red-700" data-action="delete" data-id="${order.id}">Excluir</button>
        </div>
      `;

    return `
      <tr class="border-t border-slate-200 dark:border-slate-800">
        <td class="p-3">${order.cliente}</td>
        <td class="p-3">${order.modelo}</td>
        <td class="p-3">${order.referencia}</td>
        <td class="p-3">${new Date(order.data).toLocaleDateString('pt-BR')}</td>
        <td class="p-3">${order.quantidade_total}</td>
        <td class="p-3">${order.produzido_loja}</td>
        <td class="p-3">${order.status}</td>
        <td class="p-3">${actionButtons}</td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('.order-action').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const orderId = btn.dataset.id;
      const action = btn.dataset.action;

      try {
        if (action === 'archive') {
          await apiFetch(`/api/orders/${orderId}/archive`, { method: 'PATCH' });
          showMessage('Pedido arquivado com sucesso.');
        }

        if (action === 'unarchive') {
          await apiFetch(`/api/orders/${orderId}/unarchive`, { method: 'PATCH' });
          showMessage('Pedido reativado com sucesso.');
        }

        if (action === 'delete') {
          const confirmed = window.confirm('Deseja excluir este pedido definitivamente? Essa ação não pode ser desfeita.');
          if (!confirmed) return;
          await apiFetch(`/api/orders/${orderId}?hard=true`, { method: 'DELETE' });
          showMessage('Pedido excluído definitivamente.');
        }

        await loadOrders(state.currentOrderStatus);
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  });
}

function renderUsersTable() {
  if (state.currentUser.tipo_usuario !== 'admin') return;

  document.getElementById('usersTable').innerHTML = state.users
    .map((u) => `
      <tr class="border-t border-slate-200 dark:border-slate-800">
        <td class="p-3">${u.nome}</td>
        <td class="p-3">${u.email}</td>
        <td class="p-3">${u.tipo_usuario}</td>
      </tr>
    `)
    .join('');
}

function renderHistoryTable(result) {
  const rows = result.items || [];

  document.getElementById('productionTable').innerHTML =
    rows.map(
      (item) => `
        <tr class="border-t border-slate-200 dark:border-slate-800">
          <td class="p-3">${formatDate(item.created_at)}</td>
          <td class="p-3">#${item.pedido_id}</td>
          <td class="p-3">${item.etapa === 'Confeccao' ? 'Confecção' : item.etapa}</td>
          <td class="p-3">${item.quantidade}</td>
          <td class="p-3">${item.funcionario_nome}</td>
          <td class="p-3">${item.evidence_url ? `<a class="text-blue-600 underline" href="${item.evidence_url}" target="_blank">foto</a>` : '-'}</td>
          <td class="p-3">${item.is_adjustment ? 'Ajuste' : 'Normal'}</td>
        </tr>
      `
    ).join('') || '<tr><td class="p-3" colspan="7">Sem registros para os filtros aplicados.</td></tr>';

  state.historyTotalPages = result.total_pages || 1;
  document.getElementById('historyPageInfo').textContent = `Página ${state.historyPage} de ${state.historyTotalPages}`;
}

function renderNotificationBadge(count) {
  const badge = document.getElementById('notificationBadge');
  if (!badge) return;

  if (!count) {
    badge.classList.add('hidden');
    return;
  }

  badge.classList.remove('hidden');
  badge.textContent = `${count} notificação(ões) pendente(s)`;
}

async function loadMe() {
  const { user } = await apiFetch('/api/auth/me');
  state.currentUser = user;

  const label = `${user.nome} (${user.tipo_usuario})`;
  const desktop = document.getElementById('userInfoDesktop');
  const mobile = document.getElementById('userInfoMobile');
  if (desktop) desktop.textContent = label;
  if (mobile) mobile.textContent = label;
}

async function loadUsers() {
  if (state.currentUser.tipo_usuario !== 'admin') {
    state.users = [state.currentUser];
    return;
  }

  state.users = await apiFetch('/api/users');
  renderUsersTable();
}

async function loadOrders(status = 'ativo') {
  state.currentOrderStatus = status;
  const [listByStatus, fullCatalog] = await Promise.all([
    apiFetch(`/api/orders?status=${encodeURIComponent(status)}`),
    apiFetch('/api/orders?status=todos')
  ]);
  state.orders = listByStatus;
  state.orderCatalog = fullCatalog;

  renderOrdersTable();
  renderOrderSelects();
}

async function loadHistory(page = 1) {
  state.historyPage = page;

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', '50');

  const { orderId, etapa, employeeId, type, from, to } = state.historyFilters;

  if (orderId) params.set('orderId', orderId);
  if (etapa) params.set('etapa', etapa);
  if (employeeId) params.set('employeeId', employeeId);
  if (type && type !== 'all') params.set('type', type);
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const result = await apiFetch(`/api/production?${params.toString()}`);
  renderHistoryTable(result);
}

async function loadOperationalAlerts() {
  const alerts = await apiFetch('/api/dashboard/alerts');
  const list = document.getElementById('operationalAlerts');

  list.innerHTML = alerts.map((item) => {
    const color =
      item.status === 'atraso'
        ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
        : item.status === 'risco'
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

    return `<li class="rounded-xl p-2 ${color}">Pedido #${item.pedido_id} - ${item.cliente} (${item.modelo}) | prazo ${new Date(item.data).toLocaleDateString('pt-BR')} | loja ${item.total_loja}/${item.quantidade_total}</li>`;
  }).join('') || '<li class="rounded-xl bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Sem alertas no momento.</li>';
}

async function loadDashboard() {
  if (state.currentUser.tipo_usuario !== 'admin') {
    document.getElementById('dashboardView').innerHTML = '<p class="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-950">Dashboard detalhado disponível apenas para admin.</p>';
    return;
  }

  const stats = await apiFetch('/api/dashboard');

  document.getElementById('statOrdersInProd').textContent = stats.pedidos_em_producao;
  document.getElementById('statLate').textContent = stats.pedidos_em_atraso;
  document.getElementById('statRisk').textContent = stats.pedidos_em_risco;
  document.getElementById('statLeadTime').textContent = Number(stats.lead_time_medio_dias || 0).toFixed(1);

  document.getElementById('stageBalanceList').innerHTML = (stats.saldo_atual_por_etapa || [])
    .map((item) => `<li class="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">${item.etapa === 'Confeccao' ? 'Confecção' : item.etapa}: <strong>${item.total}</strong></li>`)
    .join('');

  document.getElementById('dashboardAlerts').innerHTML = (stats.alertas || [])
    .map((alert) => `<li class="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">${alert.mensagem}</li>`)
    .join('') || '<li class="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">Sem alertas.</li>';

  renderNotificationBadge(stats.notificacoes_pendentes);
}

function setupOrderStatusButtons() {
  document.querySelectorAll('.order-status-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await loadOrders(btn.dataset.status);
        document.querySelectorAll('.order-status-btn').forEach((inner) => {
          inner.classList.toggle('bg-slate-200', inner.dataset.status === btn.dataset.status);
          inner.classList.toggle('dark:bg-slate-800', inner.dataset.status === btn.dataset.status);
        });
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  });
}

function setupHistoryFilters() {
  const form = document.getElementById('historyFilterForm');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    state.historyFilters.orderId = document.getElementById('filterOrder').value;
    state.historyFilters.etapa = document.getElementById('filterStage').value;
    state.historyFilters.employeeId = document.getElementById('filterEmployee').value;
    state.historyFilters.type = document.getElementById('filterType').value;
    state.historyFilters.from = document.getElementById('filterFrom').value;
    state.historyFilters.to = document.getElementById('filterTo').value;

    await loadHistory(1);
  });

  document.getElementById('historyClearFilters').addEventListener('click', async () => {
    state.historyFilters = { orderId: '', etapa: '', employeeId: '', type: 'all', from: '', to: '' };

    document.getElementById('filterOrder').value = '';
    document.getElementById('filterStage').value = '';
    document.getElementById('filterEmployee').value = '';
    document.getElementById('filterType').value = 'all';
    document.getElementById('filterFrom').value = '';
    document.getElementById('filterTo').value = '';

    await loadHistory(1);
  });

  document.getElementById('historyPrevPage').addEventListener('click', async () => {
    if (state.historyPage <= 1) return;
    await loadHistory(state.historyPage - 1);
  });

  document.getElementById('historyNextPage').addEventListener('click', async () => {
    if (state.historyPage >= state.historyTotalPages) return;
    await loadHistory(state.historyPage + 1);
  });
}

function setupForms() {
  document.getElementById('productionForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append('pedido_id', document.getElementById('pedido_id').value);
    formData.append('etapa', document.getElementById('etapa').value);
    formData.append('quantidade', document.getElementById('quantidade').value);

    const photoInput = document.getElementById('foto');
    if (!photoInput.files || !photoInput.files[0]) {
      showMessage('Selecione a foto de evidência.', true);
      return;
    }

    formData.append('foto', photoInput.files[0]);

    try {
      await apiFetch('/api/production', { method: 'POST', body: formData });
      event.currentTarget.reset();
      document.getElementById('fotoNome').textContent = 'Nenhum arquivo selecionado';

      await Promise.all([loadHistory(1), loadOrders(state.currentOrderStatus), loadOperationalAlerts()]);
      if (state.currentUser.tipo_usuario === 'admin') {
        await loadDashboard();
      }

      showMessage('Produção registrada com evidência.');
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  if (state.currentUser.tipo_usuario === 'admin') {
    document.getElementById('orderForm').addEventListener('submit', async (event) => {
      event.preventDefault();

      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
      payload.grades = Array.from(document.querySelectorAll('#sizesGrid input')).map((input) => ({
        tamanho: input.dataset.size,
        quantidade: Number(input.value || 0)
      }));

      try {
        await apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
        event.currentTarget.reset();
        buildSizesInputs();
        await loadOrders(state.currentOrderStatus);
        showMessage('Pedido cadastrado com sucesso.');
      } catch (error) {
        showMessage(error.message, true);
      }
    });

    document.getElementById('userForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

      try {
        await apiFetch('/api/users', { method: 'POST', body: JSON.stringify(payload) });
        event.currentTarget.reset();
        await loadUsers();
        renderEmployeeFilter();
        showMessage('Usuário cadastrado com sucesso.');
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  }
}

(async function init() {
  try {
    bindThemeButtons();
    bindPhotoPicker();
    buildSizesInputs();
    buildHistoryFilters();

    await loadMe();
    setupNavigation(state.currentUser);

    await Promise.all([
      loadUsers(),
      loadOrders('ativo'),
      loadHistory(1),
      loadOperationalAlerts(),
      loadDashboard()
    ]);

    renderEmployeeFilter();
    setupOrderStatusButtons();
    const initialStatusBtn = document.querySelector('.order-status-btn[data-status="ativo"]');
    if (initialStatusBtn) {
      initialStatusBtn.classList.add('bg-slate-200', 'dark:bg-slate-800');
    }
    setupHistoryFilters();
    setupForms();
  } catch (error) {
    showMessage(error.message, true);
  }
})();
