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
  setTimeout(() => el.classList.add('hidden'), 2500);
}

async function apiFetch(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    localStorage.clear();
    window.location.href = '/';
    return;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erro na requisicao.');
  }

  return data;
}

function setupSidebar() {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      document.querySelectorAll('.view').forEach((section) => section.classList.add('hidden'));
      document.getElementById(`${view}View`).classList.remove('hidden');
    });
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/';
  });
}

function buildSizesInputs() {
  const grid = document.getElementById('sizesGrid');
  grid.innerHTML = SIZES.map(
    (size) => `
      <label class="rounded-lg border bg-slate-50 p-2 text-xs">
        <span class="block font-medium">${size}</span>
        <input type="number" min="0" value="0" data-size="${size}" class="mt-1 w-full rounded border p-1" />
      </label>
    `
  ).join('');
}

async function loadMe() {
  const { user } = await apiFetch('/api/auth/me');
  localStorage.setItem('user', JSON.stringify(user));
  document.getElementById('userInfo').textContent = `${user.nome} (${user.tipo_usuario})`;

  if (user.tipo_usuario !== 'admin') {
    document.getElementById('usersNav').classList.add('hidden');
    document.getElementById('usersView').classList.add('hidden');
    document.getElementById('orderForm').classList.add('hidden');
  }

  return user;
}

async function loadDashboard(user) {
  if (user.tipo_usuario !== 'admin') {
    document.getElementById('dashboardView').innerHTML = '<p class="rounded-xl bg-white p-4 shadow-sm">Dashboard disponivel apenas para admin.</p>';
    return;
  }

  const stats = await apiFetch('/api/dashboard');
  document.getElementById('statOrdersInProd').textContent = stats.pedidos_em_producao;
  document.getElementById('statToday').textContent = stats.producao_dia;
  document.getElementById('statTotal').textContent = stats.total_produzido;
}

async function loadOrders() {
  const orders = await apiFetch('/api/orders');

  const rows = orders.map(
    (order) => `
      <tr class="border-t">
        <td class="p-3">${order.cliente}</td>
        <td class="p-3">${order.modelo}</td>
        <td class="p-3">${order.referencia}</td>
        <td class="p-3">${new Date(order.data).toLocaleDateString('pt-BR')}</td>
        <td class="p-3">${order.quantidade_total}</td>
        <td class="p-3">${order.produzido_estoque}</td>
      </tr>
    `
  ).join('');

  document.getElementById('ordersTable').innerHTML = rows || '<tr><td class="p-3" colspan="6">Sem pedidos.</td></tr>';

  const select = document.getElementById('pedido_id');
  select.innerHTML = orders.map((order) => `<option value="${order.id}">${order.id} - ${order.cliente} - ${order.modelo}</option>`).join('');
}

async function loadProduction() {
  const list = await apiFetch('/api/production');

  const rows = list.map(
    (item) => `
      <tr class="border-t">
        <td class="p-3">${new Date(item.data).toLocaleString('pt-BR')}</td>
        <td class="p-3">#${item.pedido_id}</td>
        <td class="p-3">${item.etapa}</td>
        <td class="p-3">${item.quantidade}</td>
        <td class="p-3">${item.funcionario_nome}</td>
      </tr>
    `
  ).join('');

  document.getElementById('productionTable').innerHTML = rows || '<tr><td class="p-3" colspan="5">Sem registros.</td></tr>';
}

async function loadUsers(user) {
  if (user.tipo_usuario !== 'admin') return;

  const users = await apiFetch('/api/users');

  document.getElementById('usersTable').innerHTML = users.map(
    (u) => `
      <tr class="border-t">
        <td class="p-3">${u.nome}</td>
        <td class="p-3">${u.email}</td>
        <td class="p-3">${u.tipo_usuario}</td>
      </tr>
    `
  ).join('');
}

function setupForms(user) {
  const orderForm = document.getElementById('orderForm');
  if (user.tipo_usuario === 'admin') {
    orderForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(orderForm);
      const grades = Array.from(document.querySelectorAll('#sizesGrid input')).map((input) => ({
        tamanho: input.dataset.size,
        quantidade: Number(input.value || 0)
      }));

      const payload = Object.fromEntries(formData.entries());
      payload.grades = grades;

      try {
        await apiFetch('/api/orders', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        orderForm.reset();
        buildSizesInputs();
        await loadOrders();
        showMessage('Pedido cadastrado com sucesso.');
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  }

  document.getElementById('productionForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      pedido_id: Number(document.getElementById('pedido_id').value),
      etapa: document.getElementById('etapa').value,
      quantidade: Number(document.getElementById('quantidade').value)
    };

    try {
      await apiFetch('/api/production', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      document.getElementById('productionForm').reset();
      await loadProduction();
      await loadOrders();
      if (user.tipo_usuario === 'admin') {
        await loadDashboard(user);
      }
      showMessage('Producao registrada com sucesso.');
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  if (user.tipo_usuario === 'admin') {
    document.getElementById('userForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

      try {
        await apiFetch('/api/users', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        event.currentTarget.reset();
        await loadUsers(user);
        showMessage('Usuario cadastrado com sucesso.');
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  }
}

(async function init() {
  try {
    setupSidebar();
    buildSizesInputs();
    const user = await loadMe();
    await Promise.all([loadOrders(), loadProduction(), loadDashboard(user), loadUsers(user)]);
    setupForms(user);
  } catch (error) {
    showMessage(error.message, true);
  }
})();
