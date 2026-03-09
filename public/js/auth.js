const token = localStorage.getItem('token');

if (token) {
  window.location.href = '/app';
}

const form = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  errorMessage.classList.add('hidden');
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha no login.');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = '/app';
  } catch (error) {
    errorMessage.textContent = error.message;
    errorMessage.classList.remove('hidden');
  }
});
