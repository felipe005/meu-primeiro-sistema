const tabs = document.querySelectorAll('.tab');
const forms = document.querySelectorAll('.form');
const message = document.getElementById('auth-message');

async function request(url, method, data) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Falha na requisicao');
  }
  return payload;
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((item) => item.classList.remove('active'));
    forms.forEach((form) => form.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.target).classList.add('active');
    message.textContent = '';
  });
});

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());
  try {
    await request('/api/auth/login', 'POST', data);
    const me = await request('/api/auth/me', 'GET');
    window.location.href = me.user?.platformOwner ? '/owner' : '/app';
  } catch (error) {
    message.textContent = error.message;
  }
});

document.getElementById('register-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());
  data.monthlyFee = 49.99;

  try {
    await request('/api/auth/register', 'POST', data);
    message.textContent = 'Empresa criada. Faca login na aba Entrar.';
    event.target.reset();
  } catch (error) {
    message.textContent = error.message;
  }
});

(async function checkSession() {
  try {
    const me = await request('/api/auth/me', 'GET');
    window.location.href = me.user?.platformOwner ? '/owner' : '/app';
  } catch (error) {
    // visitante sem sessao
  }
})();
