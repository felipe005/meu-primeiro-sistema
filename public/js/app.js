
const state = {
  me: null,
  currentTab: 'agenda',
  appointmentStatus: 'todos',
  appointmentSearch: '',
  services: [],
  team: [],
  clients: [],
  clientPayments: [],
  appointments: [],
  subscription: null,
  subscriptionPayments: [],
  cashEntries: [],
  purchases: [],
  stockItems: [],
  mapPoints: [],
};
const DEFAULT_PIX_KEY = '71275808123';
const PAYMENT_LABELS = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartao de Credito',
  cartao_debito: 'Cartao de Debito',
  boleto: 'Boleto',
  transferencia: 'Transferencia',
};

const nodes = {
  appMessage: document.getElementById('app-message'),
  billingAlert: document.getElementById('billing-alert'),
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
  managementContent: document.getElementById('management-content'),
  adminOnlyNote: document.getElementById('admin-only-note'),
  clientsList: document.getElementById('clients-list'),
  clientForm: document.getElementById('client-form'),
  clientPlate: document.getElementById('client-plate'),
  clientPlateType: document.getElementById('client-plate-type'),
  clientPaymentForm: document.getElementById('client-payment-form'),
  clientPaymentClient: document.getElementById('client-payment-client'),
  clientPaymentsList: document.getElementById('client-payments-list'),
  subscriptionForm: document.getElementById('subscription-form'),
  pixKey: document.getElementById('pix-key'),
  pixQrCode: document.getElementById('pix-qrcode'),
  pixCopyText: document.getElementById('pix-copy-text'),
  subscriptionPaymentForm: document.getElementById('subscription-payment-form'),
  subscriptionPaymentsList: document.getElementById('subscription-payments-list'),
  cashMetrics: document.getElementById('cash-metrics'),
  cashForm: document.getElementById('cash-form'),
  cashList: document.getElementById('cash-list'),
  purchaseForm: document.getElementById('purchase-form'),
  purchasesList: document.getElementById('purchases-list'),
  stockMetrics: document.getElementById('stock-metrics'),
  stockForm: document.getElementById('stock-form'),
  stockMoveForm: document.getElementById('stock-move-form'),
  stockItemSelect: document.getElementById('stock-item-select'),
  stockList: document.getElementById('stock-list'),
  mapForm: document.getElementById('map-form'),
  mapFrame: document.getElementById('map-frame'),
  mapPointsList: document.getElementById('map-points-list'),
};

window.addEventListener('unhandledrejection', (event) => {
  showMessage(event.reason?.message || 'Erro inesperado.', true);
});

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
  if (!response.ok) throw new Error(data.message || 'Erro na requisicao');
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

function formatDate(isoDate) {
  if (!isoDate) return '-';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('pt-BR');
}

function paymentLabel(method) {
  return PAYMENT_LABELS[method] || method || '-';
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
    if (form[key] !== undefined && form[key] !== null) form[key].value = data[key] ?? '';
  });
}

function resetAndHide(form) {
  form.reset();
  form.id.value = '';
  form.classList.add('hidden');
}

function storageKey(name) {
  return `saas:${state.me.company.id}:${name}`;
}

function readLocal(name, fallback = []) {
  try {
    const raw = localStorage.getItem(storageKey(name));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(name, value) {
  localStorage.setItem(storageKey(name), JSON.stringify(value));
}

function cleanPlate(value) {
  return (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
}

function detectPlateType(cleaned) {
  if (!cleaned || cleaned.length < 7) return 'nao_informado';
  if (/^[A-Z]{3}[0-9]{4}$/.test(cleaned)) return 'antiga';
  if (/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(cleaned)) return 'mercosul';
  return 'nao_informado';
}

function formatPlate(value) {
  const cleaned = cleanPlate(value);
  if (!cleaned) return '';
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
}

function plateInputHandler(input, plateTypeNode) {
  input.addEventListener('input', () => {
    const cleaned = cleanPlate(input.value);
    input.value = formatPlate(cleaned);
    if (plateTypeNode) plateTypeNode.value = detectPlateType(cleaned);
  });
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
      await api(`/api/team/${btn.dataset.deleteTeam}`, { method: 'DELETE' });
      await Promise.all([loadTeam(), loadMetrics()]);
      showMessage('Funcionario removido.');
    });
  });
}

function renderClients() {
  if (!state.clients.length) {
    nodes.clientsList.innerHTML = '<div class="item-card"><div class="item-main"><h3>Nenhum cliente cadastrado</h3></div></div>';
    nodes.clientPaymentClient.innerHTML = '<option value="">Selecione um cliente</option>';
    return;
  }

  nodes.clientPaymentClient.innerHTML = ['<option value="">Selecione um cliente</option>']
    .concat(state.clients.map((item) => `<option value="${item.id}">${item.name}</option>`))
    .join('');

  nodes.clientsList.innerHTML = state.clients
    .map((item) => {
      const badge = item.paymentStatus === 'em_dia' ? 'ok' : item.paymentStatus === 'atrasado' ? 'danger' : '';
      return `<article class="item-card">
        <div class="item-main">
          <h3>${item.name} <span class="tag ${badge}">${item.paymentStatus || 'pendente'}</span></h3>
          <div class="item-meta">
            <span>${item.vehiclePlate || '-'}</span>
            <span>${item.vehicleModel || '-'}</span>
            <span>Mensalidade: ${money(item.monthlyFee)}</span>
            <span>Vence: ${formatDate(item.nextDueDate)}</span>
          </div>
          <p>${item.phone || '-'} ${item.email || ''}</p>
        </div>
        <div class="item-actions">
          <button class="icon-btn" data-fill-payment="${item.id}">Receber</button>
          <button class="icon-btn" data-edit-client="${item.id}">Editar</button>
          <button class="icon-btn danger" data-delete-client="${item.id}">Excluir</button>
        </div>
      </article>`;
    })
    .join('');

  nodes.clientsList.querySelectorAll('[data-fill-payment]').forEach((btn) => {
    btn.addEventListener('click', () => {
      nodes.clientPaymentClient.value = btn.dataset.fillPayment;
      setActiveTab('management');
    });
  });

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
      await api(`/api/clients/${btn.dataset.deleteClient}`, { method: 'DELETE' });
      await loadClients();
      showMessage('Cliente removido.');
    });
  });
}

function renderClientPayments() {
  if (!state.clientPayments.length) {
    nodes.clientPaymentsList.innerHTML = '<div class="item-card"><div class="item-main"><h3>Sem pagamentos registrados</h3></div></div>';
    return;
  }

  nodes.clientPaymentsList.innerHTML = state.clientPayments
    .map((item) => `<article class="item-card compact">
      <div class="item-main">
        <h3>${item.clientName}</h3>
        <p>${money(item.amount)} via ${paymentLabel(item.method)} - ${formatDate(item.paidAt)}</p>
      </div>
      <span class="tag ok">Recebido</span>
    </article>`)
    .join('');
}

function fillSelectors() {
  nodes.appointmentService.innerHTML = ['<option value="">Servico</option>']
    .concat(state.services.map((item) => `<option value="${item.id}">${item.name}</option>`))
    .join('');
  nodes.appointmentTeam.innerHTML = ['<option value="">Funcionario</option>']
    .concat(state.team.map((item) => `<option value="${item.id}">${item.name}</option>`))
    .join('');
}

function generatePixQRCode() {
  const pixKey = nodes.pixKey.value?.trim();
  if (!pixKey) {
    nodes.pixQrCode.classList.add('hidden');
    nodes.pixCopyText.textContent = 'Informe a chave Pix para gerar QR Code.';
    return;
  }
  const amount = Number(nodes.subscriptionForm.monthlyFee.value || state.subscription?.monthlyFee || 0).toFixed(2);
  const payload = `PIX|${pixKey}|${amount}|${state.me.company.name}`;
  nodes.pixQrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payload)}`;
  nodes.pixQrCode.classList.remove('hidden');
  nodes.pixCopyText.textContent = `Chave Pix: ${pixKey}`;
}

function renderSubscriptionPayments() {
  if (!state.subscriptionPayments.length) {
    nodes.subscriptionPaymentsList.innerHTML = '<div class="item-card"><div class="item-main"><h3>Sem cobrancas da assinatura</h3></div></div>';
    return;
  }

  nodes.subscriptionPaymentsList.innerHTML = state.subscriptionPayments
    .map((item) => `<article class="item-card compact">
      <div class="item-main">
        <h3>${money(item.amount)} - ${item.status === 'paid' ? 'Pago' : 'Pendente'}</h3>
        <p>Metodo: ${paymentLabel(item.method)} | Vencimento: ${formatDate(item.dueDate)} | Pago: ${formatDate(item.paidAt)}</p>
      </div>
      <div class="item-actions">
        ${item.status !== 'paid' ? `<button class="icon-btn" data-pay-sub="${item.id}">Marcar pago</button>` : '<span class="tag ok">Pago</span>'}
      </div>
    </article>`)
    .join('');

  nodes.subscriptionPaymentsList.querySelectorAll('[data-pay-sub]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await api(`/api/subscription/payments/${btn.dataset.paySub}/pay`, { method: 'PATCH' });
      await loadSubscriptionPayments();
      showMessage('Pagamento da assinatura confirmado.');
    });
  });
}

function showBillingAlert() {
  if (!state.subscription?.nextBillingDate) {
    nodes.billingAlert.classList.add('hidden');
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(state.subscription.nextBillingDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000);

  if (diffDays <= 5) {
    nodes.billingAlert.textContent = diffDays >= 0
      ? `Atencao: sua assinatura vence em ${diffDays} dia(s). Evite bloqueio e regularize pelo metodo de pagamento escolhido.`
      : 'Sua assinatura esta vencida. Regularize agora para manter o sistema ativo.';
    nodes.billingAlert.classList.remove('hidden');
  } else {
    nodes.billingAlert.classList.add('hidden');
  }
}

function renderCash() {
  const today = new Date().toISOString().slice(0, 10);
  const todayRevenue = state.appointments
    .filter((item) => item.appointmentDate === today)
    .reduce((sum, item) => sum + Number(item.price || 0), 0);
  const totalIn = state.cashEntries.filter((item) => item.type === 'entrada').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalOut = state.cashEntries.filter((item) => item.type === 'saida').reduce((sum, item) => sum + Number(item.amount || 0), 0);

  nodes.cashMetrics.innerHTML = [
    ['Saldo do Caixa', money(totalIn - totalOut)],
    ['Entradas', money(totalIn)],
    ['Saidas', money(totalOut)],
    ['Faturamento Agenda Hoje', money(todayRevenue)],
  ]
    .map(([label, value]) => `<article class="metric"><p>${label}</p><p class="value">${value}</p></article>`)
    .join('');

  nodes.cashList.innerHTML = state.cashEntries.length
    ? state.cashEntries
        .map((item, index) => `<article class="item-card">
          <div class="item-main">
            <h3>${item.category} <span class="tag ${item.type === 'entrada' ? 'ok' : 'danger'}">${item.type}</span></h3>
            <p>${formatDate(item.date)} - ${item.description || '-'}</p>
          </div>
          <div class="item-actions">
            <span class="price">${money(item.amount)}</span>
            <button class="icon-btn danger" data-delete-cash="${index}">Excluir</button>
          </div>
        </article>`)
        .join('')
    : '<div class="item-card"><div class="item-main"><h3>Nenhum lancamento no caixa</h3></div></div>';

  nodes.cashList.querySelectorAll('[data-delete-cash]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.cashEntries.splice(Number(btn.dataset.deleteCash), 1);
      writeLocal('cash_entries', state.cashEntries);
      renderCash();
    });
  });
}

function renderPurchases() {
  nodes.purchasesList.innerHTML = state.purchases.length
    ? state.purchases
        .map((item, index) => `<article class="item-card">
          <div class="item-main">
            <h3>${item.item} <span class="tag ${item.status === 'recebido' ? 'ok' : ''}">${item.status}</span></h3>
            <p>${item.supplier} - ${item.quantity} x ${money(item.unitPrice)} (${formatDate(item.date)})</p>
          </div>
          <div class="item-actions">
            <span class="price">${money(item.quantity * item.unitPrice)}</span>
            <button class="icon-btn danger" data-delete-purchase="${index}">Excluir</button>
          </div>
        </article>`)
        .join('')
    : '<div class="item-card"><div class="item-main"><h3>Nenhuma compra cadastrada</h3></div></div>';

  nodes.purchasesList.querySelectorAll('[data-delete-purchase]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.purchases.splice(Number(btn.dataset.deletePurchase), 1);
      writeLocal('purchases', state.purchases);
      renderPurchases();
    });
  });
}

function renderStock() {
  const lowCount = state.stockItems.filter((item) => Number(item.quantity) <= Number(item.minQuantity)).length;
  nodes.stockMetrics.innerHTML = [
    ['Itens em Estoque', state.stockItems.length],
    ['Abaixo do Minimo', lowCount],
  ]
    .map(([label, value]) => `<article class="metric"><p>${label}</p><p class="value">${value}</p></article>`)
    .join('');

  nodes.stockItemSelect.innerHTML = ['<option value="">Selecione o item</option>']
    .concat(state.stockItems.map((item) => `<option value="${item.id}">${item.name}</option>`))
    .join('');

  nodes.stockList.innerHTML = state.stockItems.length
    ? state.stockItems
        .map((item) => {
          const low = Number(item.quantity) <= Number(item.minQuantity);
          return `<article class="item-card">
            <div class="item-main">
              <h3>${item.name} <span class="tag ${low ? 'danger' : 'ok'}">${low ? 'Reposicao' : 'OK'}</span></h3>
              <p>Atual: ${item.quantity} ${item.unit} | Min: ${item.minQuantity} ${item.unit}</p>
            </div>
            <div class="item-actions">
              <button class="icon-btn danger" data-delete-stock="${item.id}">Excluir</button>
            </div>
          </article>`;
        })
        .join('')
    : '<div class="item-card"><div class="item-main"><h3>Nenhum item no estoque</h3></div></div>';

  nodes.stockList.querySelectorAll('[data-delete-stock]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.stockItems = state.stockItems.filter((item) => item.id !== btn.dataset.deleteStock);
      writeLocal('stock_items', state.stockItems);
      renderStock();
    });
  });
}

function renderMap() {
  if (!state.mapPoints.length) {
    nodes.mapPointsList.innerHTML = '<div class="item-card"><div class="item-main"><h3>Nenhum ponto salvo</h3></div></div>';
    nodes.mapFrame.src = 'https://www.openstreetmap.org/export/embed.html';
    return;
  }

  nodes.mapPointsList.innerHTML = state.mapPoints
    .map((point, index) => `<article class="item-card">
      <div class="item-main">
        <h3>${point.name}</h3>
        <p>${point.address}</p>
      </div>
      <div class="item-actions">
        <a class="icon-btn" target="_blank" rel="noreferrer" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point.address)}">Abrir</a>
        <button class="icon-btn" data-focus-map="${index}">Ver no mapa</button>
        <button class="icon-btn danger" data-delete-map="${index}">Excluir</button>
      </div>
    </article>`)
    .join('');

  nodes.mapPointsList.querySelectorAll('[data-focus-map]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const point = state.mapPoints[Number(btn.dataset.focusMap)];
      nodes.mapFrame.src = `https://www.openstreetmap.org/export/embed.html?marker=${encodeURIComponent(point.address)}`;
    });
  });

  nodes.mapPointsList.querySelectorAll('[data-delete-map]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.mapPoints.splice(Number(btn.dataset.deleteMap), 1);
      writeLocal('map_points', state.mapPoints);
      renderMap();
    });
  });
}

function initLocalModules() {
  state.cashEntries = readLocal('cash_entries', []);
  state.purchases = readLocal('purchases', []);
  state.stockItems = readLocal('stock_items', []);
  state.mapPoints = readLocal('map_points', []);
  renderCash();
  renderPurchases();
  renderStock();
  renderMap();
}

async function loadMe() {
  state.me = await api('/api/auth/me');
  nodes.companyTitle.textContent = state.me.company.name;
  nodes.companySubtitle.textContent = `${state.me.company.businessType} | ${state.me.user.name}`;
  nodes.planBadge.textContent = state.me.subscription.planStatus === 'active' ? 'Plano ativo' : 'Plano inativo';
  nodes.brandAvatar.textContent = initials(state.me.company.name) || 'LJ';

  if (state.me.user.role !== 'admin') {
    document.querySelector('[data-tab="management"]').classList.add('hidden');
    nodes.managementContent.classList.add('hidden');
    nodes.adminOnlyNote.classList.remove('hidden');
  }
}

async function loadMetrics() {
  renderMetrics(await api('/api/dashboard/metrics'));
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
  if (state.me.user.role !== 'admin') return;
  state.clients = await api('/api/clients');
  renderClients();
}

async function loadClientPayments() {
  if (state.me.user.role !== 'admin') return;
  state.clientPayments = await api('/api/clients/payments');
  renderClientPayments();
}

async function loadAppointments() {
  const params = new URLSearchParams();
  params.set('status', state.appointmentStatus);
  if (state.appointmentSearch.trim()) params.set('search', state.appointmentSearch.trim());
  state.appointments = await api(`/api/appointments?${params.toString()}`);
  renderAppointments();
  renderCash();
}

async function loadSubscription() {
  state.subscription = await api('/api/subscription');
  if (!state.subscription.pixKey) {
    state.subscription.pixKey = DEFAULT_PIX_KEY;
  }
  setFormData(nodes.subscriptionForm, state.subscription);
  generatePixQRCode();
  showBillingAlert();
}

async function loadSubscriptionPayments() {
  if (state.me.user.role !== 'admin') return;
  state.subscriptionPayments = await api('/api/subscription/payments');
  renderSubscriptionPayments();
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

  plateInputHandler(nodes.appointmentForm.vehiclePlate, null);
  plateInputHandler(nodes.clientPlate, nodes.clientPlateType);
  nodes.pixKey.addEventListener('input', generatePixQRCode);
  nodes.subscriptionForm.monthlyFee.addEventListener('input', generatePixQRCode);

  document.getElementById('new-appointment-btn').addEventListener('click', () => nodes.appointmentForm.classList.remove('hidden'));
  document.getElementById('cancel-appointment-btn').addEventListener('click', () => resetAndHide(nodes.appointmentForm));
  document.getElementById('new-service-btn').addEventListener('click', () => nodes.serviceForm.classList.remove('hidden'));
  document.getElementById('cancel-service-btn').addEventListener('click', () => resetAndHide(nodes.serviceForm));
  document.getElementById('new-team-btn').addEventListener('click', () => nodes.teamForm.classList.remove('hidden'));
  document.getElementById('cancel-team-btn').addEventListener('click', () => resetAndHide(nodes.teamForm));
  document.getElementById('new-client-btn').addEventListener('click', () => nodes.clientForm.classList.remove('hidden'));
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
    try {
      const data = Object.fromEntries(new FormData(nodes.appointmentForm).entries());
      const id = data.id;
      delete data.id;
      data.vehiclePlate = formatPlate(data.vehiclePlate);
      data.price = Number(data.price || 0);
      data.serviceId = data.serviceId ? Number(data.serviceId) : null;
      data.teamMemberId = data.teamMemberId ? Number(data.teamMemberId) : null;

      if (id) await api(`/api/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      else await api('/api/appointments', { method: 'POST', body: JSON.stringify(data) });
      resetAndHide(nodes.appointmentForm);
      await Promise.all([loadAppointments(), loadMetrics()]);
      showMessage('Agendamento salvo.');
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  nodes.serviceForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(nodes.serviceForm).entries());
      const id = data.id;
      delete data.id;
      data.price = Number(data.price || 0);
      data.durationMinutes = Number(data.durationMinutes || 0);
      data.active = Number(data.active || 1);
      if (id) await api(`/api/services/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      else await api('/api/services', { method: 'POST', body: JSON.stringify(data) });
      resetAndHide(nodes.serviceForm);
      await Promise.all([loadServices(), loadMetrics()]);
      showMessage('Servico salvo.');
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  nodes.teamForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(nodes.teamForm).entries());
      const id = data.id;
      delete data.id;
      data.salary = Number(data.salary || 0);
      data.active = Number(data.active || 1);
      if (id) await api(`/api/team/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      else await api('/api/team', { method: 'POST', body: JSON.stringify(data) });
      resetAndHide(nodes.teamForm);
      await Promise.all([loadTeam(), loadMetrics()]);
      showMessage('Funcionario salvo.');
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  nodes.clientForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(nodes.clientForm).entries());
      const id = data.id;
      delete data.id;
      data.vehiclePlate = formatPlate(data.vehiclePlate);
      data.monthlyFee = Number(data.monthlyFee || 0);
      if (id) await api(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      else await api('/api/clients', { method: 'POST', body: JSON.stringify(data) });
      resetAndHide(nodes.clientForm);
      await loadClients();
      showMessage('Cliente salvo.');
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  nodes.clientPaymentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(nodes.clientPaymentForm).entries());
      if (!data.clientId) {
        showMessage('Selecione um cliente.', true);
        return;
      }
      data.amount = Number(data.amount || 0);
      await api(`/api/clients/${data.clientId}/payments`, { method: 'POST', body: JSON.stringify(data) });
      nodes.clientPaymentForm.reset();
      await Promise.all([loadClients(), loadClientPayments()]);
      showMessage('Pagamento do cliente registrado.');
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  nodes.subscriptionForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(nodes.subscriptionForm).entries());
      data.monthlyFee = Number(data.monthlyFee || 0);
      await api('/api/subscription', { method: 'PUT', body: JSON.stringify(data) });
      await Promise.all([loadMe(), loadSubscription(), loadMetrics()]);
      showMessage('Assinatura atualizada.');
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  nodes.subscriptionPaymentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(nodes.subscriptionPaymentForm).entries());
      data.amount = Number(data.amount || 0);
      await api('/api/subscription/payments', { method: 'POST', body: JSON.stringify(data) });
      nodes.subscriptionPaymentForm.reset();
      await loadSubscriptionPayments();
      showMessage('Cobranca da assinatura criada.');
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  nodes.cashForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(nodes.cashForm).entries());
    data.amount = Number(data.amount || 0);
    state.cashEntries.push(data);
    writeLocal('cash_entries', state.cashEntries);
    nodes.cashForm.reset();
    renderCash();
    showMessage('Lancamento salvo no caixa.');
  });

  nodes.purchaseForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(nodes.purchaseForm).entries());
    data.quantity = Number(data.quantity || 0);
    data.unitPrice = Number(data.unitPrice || 0);
    state.purchases.push(data);
    writeLocal('purchases', state.purchases);
    if (data.status === 'recebido') {
      const item = state.stockItems.find((row) => row.name.toLowerCase() === data.item.toLowerCase());
      if (item) item.quantity = Number(item.quantity) + data.quantity;
      else state.stockItems.push({ id: String(Date.now()), name: data.item, unit: 'UN', quantity: data.quantity, minQuantity: 1 });
      writeLocal('stock_items', state.stockItems);
      renderStock();
    }
    nodes.purchaseForm.reset();
    renderPurchases();
    showMessage('Compra registrada.');
  });

  nodes.stockForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(nodes.stockForm).entries());
    data.id = String(Date.now());
    data.quantity = Number(data.quantity || 0);
    data.minQuantity = Number(data.minQuantity || 0);
    state.stockItems.push(data);
    writeLocal('stock_items', state.stockItems);
    nodes.stockForm.reset();
    renderStock();
    showMessage('Item de estoque cadastrado.');
  });

  nodes.stockMoveForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(nodes.stockMoveForm).entries());
    data.quantity = Number(data.quantity || 0);
    const item = state.stockItems.find((row) => row.id === data.itemId);
    if (!item) {
      showMessage('Selecione um item valido.', true);
      return;
    }
    if (data.type === 'saida' && Number(item.quantity) < data.quantity) {
      showMessage('Estoque insuficiente para esta saida.', true);
      return;
    }
    item.quantity = data.type === 'entrada' ? Number(item.quantity) + data.quantity : Number(item.quantity) - data.quantity;
    writeLocal('stock_items', state.stockItems);
    nodes.stockMoveForm.reset();
    renderStock();
    showMessage('Movimentacao de estoque salva.');
  });

  nodes.mapForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(nodes.mapForm).entries());
    state.mapPoints.push(data);
    writeLocal('map_points', state.mapPoints);
    nodes.mapForm.reset();
    nodes.mapFrame.src = `https://www.openstreetmap.org/export/embed.html?marker=${encodeURIComponent(data.address)}`;
    renderMap();
    showMessage('Ponto adicionado ao mapa.');
  });
}

(async function bootstrap() {
  try {
    await loadMe();
    registerEvents();
    initLocalModules();
    await Promise.all([
      loadMetrics(),
      loadServices(),
      loadTeam(),
      loadAppointments(),
      loadSubscription(),
      loadClients(),
      loadClientPayments(),
      loadSubscriptionPayments(),
    ]);
    setActiveTab('agenda');
  } catch (error) {
    window.location.href = '/';
  }
})();
