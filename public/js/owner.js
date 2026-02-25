const state = {
  me: null,
  search: '',
  companies: [],
  overview: null,
};

const nodes = {
  ownerMetrics: document.getElementById('owner-metrics'),
  ownerSearch: document.getElementById('owner-search'),
  ownerCompaniesList: document.getElementById('owner-companies-list'),
  ownerMessage: document.getElementById('owner-message'),
};

function showMessage(text, isError = false) {
  nodes.ownerMessage.style.color = isError ? '#ef4f67' : '#2de38d';
  nodes.ownerMessage.textContent = text;
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

function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('pt-BR');
}

function renderOverview() {
  if (!state.overview) return;
  const cards = [
    ['Empresas', state.overview.totalCompanies],
    ['Planos Ativos', state.overview.activePlans],
    ['Planos Inativos', state.overview.inactivePlans],
    ['MRR', money(state.overview.mrr)],
  ];
  nodes.ownerMetrics.innerHTML = cards
    .map(([label, value]) => `<article class="metric"><p>${label}</p><p class="value">${value}</p></article>`)
    .join('');
}

function renderCompanies() {
  if (!state.companies.length) {
    nodes.ownerCompaniesList.innerHTML = '<div class="item-card"><div class="item-main"><h3>Nenhuma empresa encontrada</h3></div></div>';
    return;
  }

  nodes.ownerCompaniesList.innerHTML = state.companies
    .map((company) => `<article class="item-card">
      <div class="item-main">
        <h3>${company.name} <span class="tag ${company.planStatus === 'active' ? 'ok' : 'danger'}">${company.planStatus || 'inactive'}</span></h3>
        <div class="item-meta">
          <span>${company.businessType}</span>
          <span>Mensalidade: ${money(company.monthlyFee)}</span>
          <span>Vencimento: ${formatDate(company.nextBillingDate)}</span>
          <span>Usuarios: ${company.usersCount}</span>
          <span>Agendamentos: ${company.appointmentsCount}</span>
        </div>
      </div>
      <div class="item-actions">
        <button class="icon-btn" data-toggle-plan="${company.id}" data-next="${company.planStatus === 'active' ? 'inactive' : 'active'}">
          ${company.planStatus === 'active' ? 'Bloquear' : 'Desbloquear'}
        </button>
      </div>
    </article>`)
    .join('');

  nodes.ownerCompaniesList.querySelectorAll('[data-toggle-plan]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const company = state.companies.find((item) => item.id === Number(btn.dataset.togglePlan));
      if (!company) return;
      try {
        await api(`/api/platform/companies/${company.id}/subscription`, {
          method: 'PATCH',
          body: JSON.stringify({
            planStatus: btn.dataset.next,
            monthlyFee: company.monthlyFee,
            pixKey: company.pixKey || '',
            nextBillingDate: company.nextBillingDate,
          }),
        });
        showMessage(`Empresa ${company.name} atualizada.`);
        await Promise.all([loadOverview(), loadCompanies()]);
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  });
}

async function loadOverview() {
  state.overview = await api('/api/platform/overview');
  renderOverview();
}

async function loadCompanies() {
  const qs = new URLSearchParams();
  if (state.search.trim()) qs.set('search', state.search.trim());
  state.companies = await api(`/api/platform/companies?${qs.toString()}`);
  renderCompanies();
}

function registerEvents() {
  document.getElementById('owner-search').addEventListener('input', async (event) => {
    state.search = event.target.value;
    await loadCompanies();
  });

  document.getElementById('owner-logout-btn').addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });

  document.getElementById('go-app-btn').addEventListener('click', () => {
    window.location.href = '/app';
  });
}

(async function bootstrap() {
  try {
    state.me = await api('/api/auth/me');
    if (!state.me.user?.platformOwner) {
      window.location.href = '/app';
      return;
    }
    registerEvents();
    await Promise.all([loadOverview(), loadCompanies()]);
  } catch (error) {
    window.location.href = '/';
  }
})();
