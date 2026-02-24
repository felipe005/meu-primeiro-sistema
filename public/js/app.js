const state = {
  me: null,
  currentTab: 'agenda',
  appointmentStatus: 'todos',
  appointmentSearch: '',
  services: [],
  team: [],
  clients: [],
  appointments: [],
};

const nodes = {
  appMessage: document.getElementById('app-message'),
  planBadge: document.getElementById('plan-badge'),
  companyTitle: document.getElementById('company-title'),
  companySubtitle: document.getElementById('company-subtitle'),
  brandAvatar: document.getElementById('brand-avatar'),
  metrics: document.getElementById('metrics'),
  tabbar: document.getElementById('tabbar'),
  views: document.querySelectorAll('.view'),

  appointmentSearch: document.getElementById('appointment-search'),
  statusTabs: document.getElementById('status-tabs'),
  appointmentList: document.getElementById('appointments-list'),
  appointmentForm: document.getElementById('appointment-form'),
  appointmentService: document.getElementById('appointment-service'),
  appointmentTeam: document.getElementById('appointment-team'),

  serviceList: document.getElementById('services-list'),
  serviceForm: document.getElementById('service-form'),

  teamList: document.getElementById('team-list'),
  teamForm: document.getElementById('team-form'),

  clientsList: document.getElementById('clients-list'),
  clientForm: document.getElementById('client-form'),

  subscriptionForm: document.getElementById('subscription-form'),
};

function showMessage(text, isError = false) {
  nodes.appMessage.style.color = isError ? '#ef4f67' : '#2de38d';
  nodes.appMessage.textContent = text;
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

function money(value) {
  return `R$ ${Number(value || 0).toFixed(2)}`;
}

function initials(text) {
  return text
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function setActiveTab(tab) {
  state.currentTab = tab;
  document.querySelectorAll('.tab-btn[data-tab]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  nodes.views.forEach((view) => view.classList.remove('active'));
  document.getElementById(`view-${tab}`)?.classList.add('active');
}

function setFormData(form, data) {
  Object.keys(data).forEach((key) => {
    if (form[key] !== undefined && form[key] !== null) {
      form[key].value = data[key] ?? '';
    }
  });
}

function resetAndHide(form) {
  form.reset();
  form.id.value = '';
  form.classList.add('hidden');
}

function renderMetrics(data) {
  const cards = [
    ['Agendamentos', data.totalAppointments],
    ['Aguardando', data.pendingAppointments],
    ['Em Lavagem', data.inWashAppointments],
    ['Prontos', data.readyAppointments],
    ['Entregues', data.deliveredAppointments],
    ['Faturamento Hoje', money(data.todayRevenue)],
    ['Servicos', data.totalServices],
    ['Equipe', data.totalTeam],
  ];

  nodes.metrics.innerHTML = cards
    .map(([label, value]) => `<article class="metric"><p>${label}</p><p class="value">${value}</p></article>`)
    .join('');
}

function renderAppointments() {
  if (!state.appointments.length) {
    nodes.appointmentList.innerHTML = '<div class="item-card"><div class="item-main"><h3>Nenhum agendamento encontrado</h3></div></div>';
    return;
  }

  nodes.appointmentList.innerHTML = state.appointments
    .map((item) => {
      const statusLabel = item.status.replace('_', ' ');
      const nextStatus =
        item.status === 'aguardando' ? 'em_lavagem' :
        item.status === 'em_lavagem' ? 'pronto' :
        item.status === 'pronto' ? 'entregue' : 'entregue';

      return `<article class="item-card">
        <div class="item-main">
          <h3>${item.clientName} <span class="tag">${statusLabel}</span></h3>
          <div class="item-meta">
            <span>${item.vehiclePlate || '-'}</span>
            <span>${item.appointmentTime}</span>
            <span>${item.appointmentDate}</span>
            <span>${item.phone || '-'}</span>
          </div>
          <p>${item.serviceName || 'Sem servico'} <span class="price">${money(item.price)}</span></p>
        </div>
        <div class="item-actions">
          <button class="primary-btn" data-next-status="${item.id}" data-status="${nextStatus}">Marcar ${nextStatus.replace('_', ' ')}</button>
          <button class="icon-btn" data-edit-appointment="${item.id}">Editar</button>
          <button class="icon-btn danger" data-delete-appointment="${item.id}">Excluir</button>
        </div>
      </article>`;
    })
    .join('');

  nodes.appointmentList.querySelectorAll('[data-edit-appointment]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = state.appointments.find((row) => row.id === Number(btn.dataset.editAppointment));
      nodes.appointmentForm.classList.remove('hidden');
      setFormData(nodes.appointmentForm, {
        id: item.id,
        clientName: item.clientName,
        vehiclePlate: item.vehiclePlate || '',
        vehicleModel: item.vehicleModel || '',
        phone: item.phone || '',
        serviceId: item.serviceId || '',
        teamMemberId: item.teamMemberId || '',
        appointmentDate: item.appointmentDate,
        appointmentTime: item.appointmentTime,
        status: item.status,
        price: item.price,
        notes: item.notes || '',
      });
    });
  });

  nodes.appointmentList.querySelectorAll('[data-next-status]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await api(`/api/appointments/${btn.dataset.nextStatus}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: btn.dataset.status }),
        });
        await loadAppointments();
        await loadMetrics();
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  });

  nodes.appointmentList.querySelectorAll('[data-delete-appointment]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir agendamento?')) return;
      try {
        await api(`/api/appointments/${btn.dataset.deleteAppointment}`, { method: 'DELETE' });
        showMessage('Agendamento removido.');
        await loadAppointments();
        await loadMetrics();
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  });
}

function renderServices() {
  if (!state.services.length) {
    nodes.serviceList.innerHTML = '<div class="item-card"><div class="item-main"><h3>Nenhum servico cadastrado</h3></div></div>';
    return;
  }

  nodes.serviceList.innerHTML = state.services
    .map((item) => `<article class="item-card">
      <div class="item-main">
        <h3>${item.name}</h3>
        <p><span class="price">${money(item.price)}</span> ${item.durationMinutes} min</p>
      </div>
      <div class="item-actions">
        <span class="tag ${item.active ? 'ok' : ''}">${item.active ? 'Ativo' : 'Inativo'}</span>
        <button class="icon-btn" data-edit-service="${item.id}">Editar</button>
        <button class="icon-btn danger" data-delete-service="${item.id}">Excluir</button>
      </div>
    </article>`)
    .join('');

  nodes.serviceList.querySelectorAll('[data-edit-service]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = state.services.find((row) => row.id === Number(btn.dataset.editService));
      nodes.serviceForm.classList.remove('hidden');
      setFormData(nodes.serviceForm, item);
    });
  });

  nodes.serviceList.querySelectorAll('[data-delete-service]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir servico?')) return;
      try {
        await api(`/api/services/${btn.dataset.deleteService}`, { method: 'DELETE' });
        showMessage('Servico removido.');
        await loadServices();
        await loadMetrics();
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  });
}

function renderTeam() {
  if (!state.team.length) {
    nodes.teamList.innerHTML = '<div class="item-card"><div class="item-main"><h3>Nenhum funcionario cadastrado</h3></div></div>';
    return;
  }

  nodes.teamList.innerHTML = state.team
    .map((item) => `<article class="item-card">
      <div class="item-main">
        <h3>${item.name}</h3>
        <p>${item.role} <span class="price">${money(item.salary)}</span> ${item.shiftLabel || ''}</p>
      </div>
      <div class="item-actions">
        <span class="tag ${item.active ? 'ok' : ''}">${item.active ? 'Ativo' : 'Inativo'}</span>
        <button class="icon-btn" data-edit-team="${item.id}">Editar</button>
        <button class="icon-btn danger" data-delete-team="${item.id}">Excluir</button>
      </div>
    </article>`)
    .join('');

  nodes.teamList.querySelectorAll('[data-edit-team]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = state.team.find((row) => row.id === Number(btn.dataset.editTeam));
      nodes.teamForm.classList.remove('hidden');
      setFormData(nodes.teamForm, item);
    });
  });

  nodes.teamList.querySelectorAll('[data-delete-team]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir funcionario?')) return;
      try {
        await api(`/api/team/${btn.dataset.deleteTeam}`, { method: 'DELETE' });
        showMessage('Funcionario removido.');
        await loadTeam();
        await loadMetrics();
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  });
}

function renderClients() {
  if (!state.clients.length) {
    nodes.clientsList.innerHTML = '<div class="item-card"><div class="item-main"><h3>Nenhum cliente cadastrado</h3></div></div>';
    return;
  }

  nodes.clientsList.innerHTML = state.clients
    .map((item) => `<article class="item-card">
      <div class="item-main">
        <h3>${item.name}</h3>
        <p>${item.phone || '-'} ${item.email || ''}</p>
      </div>
      <div class="item-actions">
        <span class="tag ${item.status === 'active' ? 'ok' : ''}">${item.status}</span>
        <button class="icon-btn" data-edit-client="${item.id}">Editar</button>
        <button class="icon-btn danger" data-delete-client="${item.id}">Excluir</button>
      </div>
    </article>`)
    .join('');

  nodes.clientsList.querySelectorAll('[data-edit-client]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = state.clients.find((row) => row.id === Number(btn.dataset.editClient));
      nodes.clientForm.classList.remove('hidden');
      setFormData(nodes.clientForm, item);
    });
  });

  nodes.clientsList.querySelectorAll('[data-delete-client]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir cliente?')) return;
      try {
        await api(`/api/clients/${btn.dataset.deleteClient}`, { method: 'DELETE' });
        showMessage('Cliente removido.');
        await loadClients();
        await loadMetrics();
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  });
}

function fillSelectors() {
  const serviceOptions = ['<option value="">Servico</option>']
    .concat(state.services.map((item) => `<option value="${item.id}">${item.name}</option>`));
  nodes.appointmentService.innerHTML = serviceOptions.join('');

  const teamOptions = ['<option value="">Funcionario</option>']
    .concat(state.team.map((item) => `<option value="${item.id}">${item.name}</option>`));
  nodes.appointmentTeam.innerHTML = teamOptions.join('');
}

async function loadMe() {
  state.me = await api('/api/auth/me');
  nodes.companyTitle.textContent = state.me.company.name;
  nodes.companySubtitle.textContent = `${state.me.company.businessType} | ${state.me.user.name}`;
  nodes.planBadge.textContent = state.me.subscription.planStatus === 'active' ? 'Plano ativo' : 'Plano inativo';
  nodes.brandAvatar.textContent = initials(state.me.company.name) || 'ES';
}

async function loadMetrics() {
  const data = await api('/api/dashboard/metrics');
  renderMetrics(data);
}

async function loadServices() {
  state.services = await api('/api/services');
  renderServices();
  fillSelectors();
}

async function loadTeam() {
  state.team = await api('/api/team');
  renderTeam();
  fillSelectors();
}

async function loadClients() {
  state.clients = await api('/api/clients');
  renderClients();
}

async function loadAppointments() {
  const params = new URLSearchParams();
  params.set('status', state.appointmentStatus);
  if (state.appointmentSearch.trim()) params.set('search', state.appointmentSearch.trim());
  state.appointments = await api(`/api/appointments?${params.toString()}`);
  renderAppointments();
}

async function loadSubscription() {
  const data = await api('/api/subscription');
  setFormData(nodes.subscriptionForm, data);
}

function registerEvents() {
  nodes.tabbar.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tab]');
    if (!button) return;
    setActiveTab(button.dataset.tab);
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });

  document.getElementById('new-appointment-btn').addEventListener('click', () => {
    nodes.appointmentForm.classList.remove('hidden');
    nodes.appointmentForm.reset();
  });
  document.getElementById('cancel-appointment-btn').addEventListener('click', () => resetAndHide(nodes.appointmentForm));

  document.getElementById('new-service-btn').addEventListener('click', () => {
    nodes.serviceForm.classList.remove('hidden');
    nodes.serviceForm.reset();
  });
  document.getElementById('cancel-service-btn').addEventListener('click', () => resetAndHide(nodes.serviceForm));

  document.getElementById('new-team-btn').addEventListener('click', () => {
    nodes.teamForm.classList.remove('hidden');
    nodes.teamForm.reset();
  });
  document.getElementById('cancel-team-btn').addEventListener('click', () => resetAndHide(nodes.teamForm));

  document.getElementById('new-client-btn').addEventListener('click', () => {
    nodes.clientForm.classList.remove('hidden');
    nodes.clientForm.reset();
  });
  document.getElementById('cancel-client-btn').addEventListener('click', () => resetAndHide(nodes.clientForm));

  nodes.statusTabs.addEventListener('click', async (event) => {
    const btn = event.target.closest('[data-status]');
    if (!btn) return;
    state.appointmentStatus = btn.dataset.status;
    nodes.statusTabs.querySelectorAll('.status-tab').forEach((item) => item.classList.remove('active'));
    btn.classList.add('active');
    await loadAppointments();
  });

  nodes.appointmentSearch.addEventListener('input', async (event) => {
    state.appointmentSearch = event.target.value;
    await loadAppointments();
  });

  nodes.appointmentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(nodes.appointmentForm).entries());
    const id = data.id;
    delete data.id;

    data.price = Number(data.price || 0);
    data.serviceId = data.serviceId ? Number(data.serviceId) : null;
    data.teamMemberId = data.teamMemberId ? Number(data.teamMemberId) : null;

    try {
      if (id) {
        await api(`/api/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        showMessage('Agendamento atualizado.');
      } else {
        await api('/api/appointments', { method: 'POST', body: JSON.stringify(data) });
        showMessage('Agendamento criado.');
      }
      resetAndHide(nodes.appointmentForm);
      await loadAppointments();
      await loadMetrics();
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  nodes.serviceForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(nodes.serviceForm).entries());
    const id = data.id;
    delete data.id;
    data.price = Number(data.price || 0);
    data.durationMinutes = Number(data.durationMinutes || 0);
    data.active = Number(data.active || 1);

    try {
      if (id) {
        await api(`/api/services/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        showMessage('Servico atualizado.');
      } else {
        await api('/api/services', { method: 'POST', body: JSON.stringify(data) });
        showMessage('Servico criado.');
      }
      resetAndHide(nodes.serviceForm);
      await loadServices();
      await loadMetrics();
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  nodes.teamForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(nodes.teamForm).entries());
    const id = data.id;
    delete data.id;
    data.salary = Number(data.salary || 0);
    data.active = Number(data.active || 1);

    try {
      if (id) {
        await api(`/api/team/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        showMessage('Funcionario atualizado.');
      } else {
        await api('/api/team', { method: 'POST', body: JSON.stringify(data) });
        showMessage('Funcionario criado.');
      }
      resetAndHide(nodes.teamForm);
      await loadTeam();
      await loadMetrics();
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  nodes.clientForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(nodes.clientForm).entries());
    const id = data.id;
    delete data.id;

    try {
      if (id) {
        await api(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        showMessage('Cliente atualizado.');
      } else {
        await api('/api/clients', { method: 'POST', body: JSON.stringify(data) });
        showMessage('Cliente criado.');
      }
      resetAndHide(nodes.clientForm);
      await loadClients();
      await loadMetrics();
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  nodes.subscriptionForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(nodes.subscriptionForm).entries());
    data.monthlyFee = Number(data.monthlyFee || 0);

    try {
      await api('/api/subscription', { method: 'PUT', body: JSON.stringify(data) });
      showMessage('Assinatura atualizada.');
      await loadMe();
      await loadMetrics();
    } catch (error) {
      showMessage(error.message, true);
    }
  });
}

(async function bootstrap() {
  try {
    await loadMe();
    registerEvents();
    await Promise.all([
      loadMetrics(),
      loadServices(),
      loadTeam(),
      loadClients(),
      loadAppointments(),
      loadSubscription(),
    ]);
    setActiveTab('agenda');
  } catch (error) {
    window.location.href = '/';
  }
})();
