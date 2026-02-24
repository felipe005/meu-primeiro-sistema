const appMessage = document.getElementById('app-message');
const clientsTable = document.getElementById('clients-table');
const usersTable = document.getElementById('users-table');
const companyLabel = document.getElementById('company-label');
const userLabel = document.getElementById('user-label');
const planBadge = document.getElementById('plan-badge');
const metricsContainer = document.getElementById('metrics');

const clientForm = document.getElementById('client-form');
const userForm = document.getElementById('user-form');
const subscriptionForm = document.getElementById('subscription-form');

function setMessage(text, isError = false) {
  appMessage.style.color = isError ? '#ef4f67' : '#29d3b2';
  appMessage.textContent = text;
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Erro na requisicao');
  }
  return data;
}

function metricCard(label, value) {
  return `<article class="metric"><p>${label}</p><p class="value">${value}</p></article>`;
}

function fillClientForm(client) {
  clientForm.id.value = client.id;
  clientForm.name.value = client.name;
  clientForm.email.value = client.email || '';
  clientForm.phone.value = client.phone || '';
  clientForm.status.value = client.status;
  clientForm.notes.value = client.notes || '';
}

function fillUserForm(user) {
  userForm.id.value = user.id;
  userForm.name.value = user.name;
  userForm.email.value = user.email;
  userForm.password.value = '';
  userForm.role.value = user.role;
  userForm.active.value = String(user.active);
}

async function loadMe() {
  const me = await api('/api/auth/me');
  companyLabel.textContent = `${me.company.name} | ${me.company.businessType}`;
  userLabel.textContent = `${me.user.name} (${me.user.role})`;
  planBadge.textContent = `Plano: ${me.subscription.planStatus}`;
}

async function loadMetrics() {
  try {
    const metrics = await api('/api/dashboard/metrics');
    metricsContainer.innerHTML = [
      metricCard('Usuarios', metrics.totalUsers),
      metricCard('Clientes', metrics.totalClients),
      metricCard('Clientes ativos', metrics.activeClients),
      metricCard('Clientes inativos', metrics.inactiveClients),
      metricCard('Mensalidade', `R$ ${Number(metrics.monthlyFee || 0).toFixed(2)}`),
      metricCard('Vencimento', metrics.nextBillingDate || '-'),
    ].join('');
  } catch (error) {
    metricsContainer.innerHTML = metricCard('Plano', 'Inativo');
    setMessage(error.message, true);
  }
}

async function loadClients() {
  try {
    const clients = await api('/api/clients');
    clientsTable.innerHTML = clients
      .map(
        (client) => `<tr>
          <td>${client.name}</td>
          <td>${client.email || '-'}</td>
          <td>${client.status}</td>
          <td>
            <button data-edit-client="${client.id}">Editar</button>
            <button data-delete-client="${client.id}" class="danger">Excluir</button>
          </td>
        </tr>`
      )
      .join('');

    clientsTable.querySelectorAll('[data-edit-client]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const client = clients.find((item) => item.id === Number(btn.dataset.editClient));
        fillClientForm(client);
      });
    });

    clientsTable.querySelectorAll('[data-delete-client]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Excluir cliente?')) return;
        await api(`/api/clients/${btn.dataset.deleteClient}`, { method: 'DELETE' });
        setMessage('Cliente removido.');
        await loadClients();
        await loadMetrics();
      });
    });
  } catch (error) {
    clientsTable.innerHTML = `<tr><td colspan="4">${error.message}</td></tr>`;
  }
}

async function loadUsers() {
  try {
    const users = await api('/api/users');
    usersTable.innerHTML = users
      .map(
        (user) => `<tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td>${user.active ? 'Ativo' : 'Inativo'}</td>
          <td>
            <button data-edit-user="${user.id}">Editar</button>
            <button data-delete-user="${user.id}" class="danger">Excluir</button>
          </td>
        </tr>`
      )
      .join('');

    usersTable.querySelectorAll('[data-edit-user]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const user = users.find((item) => item.id === Number(btn.dataset.editUser));
        fillUserForm(user);
      });
    });

    usersTable.querySelectorAll('[data-delete-user]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Excluir usuario?')) return;
        await api(`/api/users/${btn.dataset.deleteUser}`, { method: 'DELETE' });
        setMessage('Usuario removido.');
        await loadUsers();
        await loadMetrics();
      });
    });
  } catch (error) {
    usersTable.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
  }
}

async function loadSubscription() {
  const sub = await api('/api/subscription');
  subscriptionForm.planStatus.value = sub.planStatus;
  subscriptionForm.monthlyFee.value = sub.monthlyFee;
  subscriptionForm.nextBillingDate.value = sub.nextBillingDate || '';
}

clientForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(clientForm).entries());
  const id = data.id;
  delete data.id;

  try {
    if (id) {
      await api(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      setMessage('Cliente atualizado.');
    } else {
      await api('/api/clients', { method: 'POST', body: JSON.stringify(data) });
      setMessage('Cliente criado.');
    }
    clientForm.reset();
    await loadClients();
    await loadMetrics();
  } catch (error) {
    setMessage(error.message, true);
  }
});

userForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(userForm).entries());
  const id = data.id;
  data.active = Number(data.active);
  if (!data.password) delete data.password;
  delete data.id;

  try {
    if (id) {
      await api(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      setMessage('Usuario atualizado.');
    } else {
      if (!data.password) {
        setMessage('Senha obrigatoria para criar usuario.', true);
        return;
      }
      await api('/api/users', { method: 'POST', body: JSON.stringify(data) });
      setMessage('Usuario criado.');
    }
    userForm.reset();
    userForm.active.value = '1';
    userForm.role.value = 'member';
    await loadUsers();
    await loadMetrics();
  } catch (error) {
    setMessage(error.message, true);
  }
});

subscriptionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(subscriptionForm).entries());
  try {
    await api('/api/subscription', {
      method: 'PUT',
      body: JSON.stringify({
        planStatus: data.planStatus,
        monthlyFee: Number(data.monthlyFee),
        nextBillingDate: data.nextBillingDate || null,
      }),
    });
    setMessage('Assinatura atualizada.');
    await loadMe();
    await loadMetrics();
  } catch (error) {
    setMessage(error.message, true);
  }
});

document.getElementById('client-clear').addEventListener('click', () => clientForm.reset());
document.getElementById('user-clear').addEventListener('click', () => {
  userForm.reset();
  userForm.active.value = '1';
  userForm.role.value = 'member';
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' });
  window.location.href = '/';
});

(async function bootstrap() {
  try {
    await loadMe();
    await loadSubscription();
    await Promise.all([loadMetrics(), loadClients(), loadUsers()]);
  } catch (error) {
    window.location.href = '/';
  }
})();
