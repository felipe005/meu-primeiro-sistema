const tokenKey = 'lavajato_token_v2';
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const messageNode = document.getElementById('auth-message');

function showMessage(text, isError = false) {
  messageNode.textContent = text;
  messageNode.className = `mt-4 min-h-6 text-sm ${isError ? 'text-rose-300' : 'text-emerald-300'}`;
}

function switchTab(mode) {
  const loginMode = mode === 'login';
  formLogin.classList.toggle('hidden', !loginMode);
  formRegister.classList.toggle('hidden', loginMode);
  tabLogin.className = loginMode
    ? 'w-full rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900'
    : 'w-full rounded-xl px-4 py-2 text-sm font-semibold text-slate-200';
  tabRegister.className = loginMode
    ? 'w-full rounded-xl px-4 py-2 text-sm font-semibold text-slate-200'
    : 'w-full rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900';
}

async function api(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erro na requisicao.');
  return data;
}

tabLogin.addEventListener('click', () => switchTab('login'));
tabRegister.addEventListener('click', () => switchTab('register'));

formLogin.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(formLogin).entries());
  try {
    const data = await api('/api/auth/login', payload);
    localStorage.setItem(tokenKey, data.token);
    window.location.href = '/app';
  } catch (error) {
    showMessage(error.message, true);
  }
});

formRegister.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(formRegister).entries());
  try {
    const data = await api('/api/auth/register', payload);
    localStorage.setItem(tokenKey, data.token);
    showMessage('Empresa criada com sucesso. Redirecionando...');
    window.setTimeout(() => {
      window.location.href = '/app';
    }, 600);
  } catch (error) {
    showMessage(error.message, true);
  }
});

const token = localStorage.getItem(tokenKey);
if (token) {
  window.location.href = '/app';
}
