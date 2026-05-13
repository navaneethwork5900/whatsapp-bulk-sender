async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const message = document.getElementById('message');

  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const result = await response.json();

  if (result.success) {
    localStorage.setItem('authToken', result.token);
    window.location.href = '/dashboard/dashboard.html';
  } else {
    message.innerHTML = result.message;
  }
}
