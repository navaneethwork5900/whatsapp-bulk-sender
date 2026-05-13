const token = localStorage.getItem('authToken');

if (!token) {
  window.location.href = '/login/login.html';
}

function logout() {
  localStorage.removeItem('authToken');
  window.location.href = '/login/login.html';
}

document.getElementById('totalMessages').innerHTML = 1524;
document.getElementById('loyaltyCustomers').innerHTML = 214;
document.getElementById('activePassengers').innerHTML = 875;
