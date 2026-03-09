const SIZES = ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56'];
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '/';
}

function showMessage(message, isError = false) {
  const el = document.getElementById('appMessage');
  el.textContent = message;
  el.classList.remove('hidden');
  el.classList.toggle('bg-red-700', isError);
  el.classList.toggle('bg-slate-800', !isError);
  setTimeout(() => el.classList.add('hidden'), 2800);
}

function formatDate(value) {
  return new Date(value).toLocaleString('pt-BR');
}

function getThemeMode() {
  if (document.documentElement.classList.contains('dark')) return 'dark';
  return 'light';
}

function toggleTheme() {
  const current = getThemeMode();
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.classList.toggle('dark', next === 'dark');
  localStorage.setItem('theme_mode', next);
}

function bindThemeButtons() {
  ['themeToggleDesktop', 'themeToggleMobile'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', toggleTheme);
  });
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
    throw new Error(data.message || 'Erro na requisicao.');
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

async function loadMe() {
  const { user } = await apiFetch('/api/auth/me');
  localStorage.setItem('user', JSON.stringify(user));

  const label = `${user.nome} (${user.tipo_usuario})`;
  const desktop = document.getElementById('userInfoDesktop');
  const mobile = document.getElementById('userInfoMobile');
  if (desktop) desktop.textContent = label;
  if (mobile) mobile.textContent = label;

  return user;
}

async function loadOrders() {
  const orders = await apiFetch('/api/orders');

  document.getElementById('ordersTable').innerHTML =
    orders.map(
      (order) => `
        <tr class="border-t border-slate-200 dark:border-slate-800">
          <td class="p-3">${order.cliente}</td>
          <td class="p-3">${order.modelo}</td>
          <td class="p-3">${order.referencia}</td>
          <td class="p-3">${new Date(order.data).toLocaleDateString('pt-BR')}</td>
          <td class="p-3">${order.quantidade_total}</td>
          <td class="p-3">${order.produzido_loja}</td>
        </tr>
      `
    ).join('') || '<tr><td class="p-3" colspan="6">Sem pedidos.</td></tr>';

  const orderSelect = document.getElementById('pedido_id');
  orderSelect.innerHTML = orders.map((order) => `<option value="${order.id}">#${order.id} - ${order.cliente} - ${order.modelo}</option>`).join('');
}

async function loadProduction() {
  const list = await apiFetch('/api/production');

  document.getElementById('productionTable').innerHTML =
    list.map(
      (item) => `
        <tr class="border-t border-slate-200 dark:border-slate-800">
          <td class="p-3">${formatDate(item.created_at)}</td>
          <td class="p-3">#${item.pedido_id}</td>
          <td class="p-3">${item.etapa}</td>
          <td class="p-3">${item.quantidade}</td>
          <td class="p-3">${item.funcionario_nome}</td>
          <td class="p-3">${item.evidence_url ? `<a class="text-blue-600 underline" href="${item.evidence_url}" target="_blank">foto</a>` : '-'}</td>
          <td class="p-3">${item.is_adjustment ? 'Ajuste' : 'Normal'}</td>
        </tr>
      `
    ).join('') || '<tr><td class="p-3" colspan="7">Sem registros.</td></tr>';
}

async function loadUsers(user) {
  if (user.tipo_usuario !== 'admin') return;
  const users = await apiFetch('/api/users');

  document.getElementById('usersTable').innerHTML = users.map(
    (u) => `
      <tr class="border-t border-slate-200 dark:border-slate-800">
        <td class="p-3">${u.nome}</td>
        <td class="p-3">${u.email}</td>
        <td class="p-3">${u.tipo_usuario}</td>
      </tr>
    `
  ).join('');
}

async function loadOperationalAlerts() {
  const alerts = await apiFetch('/api/dashboard/alerts');
  const list = document.getElementById('operationalAlerts');

  list.innerHTML = alerts.map(
    (item) => {
      const color = item.status === 'atraso' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
        item.status === 'risco' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' :
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      return `<li class="rounded-xl p-2 ${color}">Pedido #${item.pedido_id} - ${item.cliente} (${item.modelo}) | prazo ${new Date(item.data).toLocaleDateString('pt-BR')} | loja ${item.total_loja}/${item.quantidade_total}</li>`;
    }
  ).join('') || '<li class="rounded-xl bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Sem alertas no momento.</li>';
}

async function loadDashboard(user) {
  if (user.tipo_usuario !== 'admin') {
    document.getElementById('dashboardView').innerHTML = '<p class="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-950">Dashboard detalhado apenas para admin.</p>';
    return;
  }

  const stats = await apiFetch('/api/dashboard');
  document.getElementById('statOrdersInProd').textContent = stats.pedidos_em_producao;
  document.getElementById('statLate').textContent = stats.pedidos_em_atraso;
  document.getElementById('statRisk').textContent = stats.pedidos_em_risco;
  document.getElementById('statLeadTime').textContent = Number(stats.lead_time_medio_dias || 0).toFixed(1);

  document.getElementById('throughputList').innerHTML = stats.throughput_por_etapa
    .map((item) => `<li class="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">${item.etapa}: <strong>${item.total}</strong></li>`)
    .join('');

  document.getElementById('dashboardAlerts').innerHTML = (stats.alertas || [])
    .map((alert) => `<li class="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">${alert.mensagem}</li>`)
    .join('') || '<li class="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">Sem alertas.</li>';
}

function setupForms(user) {
  const productionForm = document.getElementById('productionForm');
  productionForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append('pedido_id', document.getElementById('pedido_id').value);
    formData.append('etapa', document.getElementById('etapa').value);
    formData.append('quantidade', document.getElementById('quantidade').value);

    const photoInput = document.getElementById('foto');
    if (!photoInput.files || !photoInput.files[0]) {
      showMessage('Selecione a foto de evidencia.', true);
      return;
    }
    formData.append('foto', photoInput.files[0]);

    try {
      await apiFetch('/api/production', { method: 'POST', body: formData });
      productionForm.reset();
      await Promise.all([loadProduction(), loadOrders(), loadOperationalAlerts()]);
      if (user.tipo_usuario === 'admin') {
        await loadDashboard(user);
      }
      showMessage('Registro salvo com evidencia.');
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  if (user.tipo_usuario === 'admin') {
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
        await loadOrders();
        showMessage('Pedido cadastrado.');
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
        await loadUsers(user);
        showMessage('Usuario cadastrado.');
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  }
}

(async function init() {
  try {
    bindThemeButtons();
    buildSizesInputs();
    const user = await loadMe();
    setupNavigation(user);

    await Promise.all([loadOrders(), loadProduction(), loadOperationalAlerts(), loadDashboard(user), loadUsers(user)]);
    setupForms(user);
  } catch (error) {
    showMessage(error.message, true);
  }
})();
