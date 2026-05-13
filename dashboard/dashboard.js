const token = localStorage.getItem('authToken');

if (!token) {
  window.location.href = '/login/login.html';
}

function logout() {
  localStorage.removeItem('authToken');
  window.location.href = '/login/login.html';
}

async function fetchAnalytics() {
  const response = await fetch('/api/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (response.status === 401) {
    logout();
    return;
  }

  const result = await response.json();
  if (!result.success) return;

  document.getElementById('totalMessages').textContent = result.analytics.totalMessages;
  document.getElementById('loyaltyCustomers').textContent = result.analytics.loyaltyCustomers;
  document.getElementById('activePassengers').textContent = result.analytics.activePassengers;
  document.getElementById('lastUpdated').textContent = `Last updated: ${new Date().toLocaleString()}`;

  renderTable('passengersTable', result.passengers, ['mobile', 'count', 'firstJourneyTime']);
  renderTable('loyaltyTable', result.loyaltyPassengers, ['mobile', 'count', 'firstJourneyTime']);
}

function renderTable(targetId, rows, columns) {
  const target = document.getElementById(targetId);
  if (!rows || rows.length === 0) {
    target.innerHTML = '<p>No data available.</p>';
    return;
  }

  const head = columns.map(col => `<th>${col}</th>`).join('');
  const body = rows.map(row => `
    <tr>${columns.map(col => {
      if (col === 'firstJourneyTime') {
        return `<td>${new Date(row[col]).toLocaleString()}</td>`;
      }
      return `<td>${row[col]}</td>`;
    }).join('')}</tr>
  `).join('');

  target.innerHTML = `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

async function processExcel() {
  const fileInput = document.getElementById('excelFile');
  const statusDiv = document.getElementById('status');
  statusDiv.innerHTML = '';

  const file = fileInput.files[0];
  if (!file) {
    alert('Please upload an Excel file');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const uniqueNumbers = [...new Set(jsonData.map(row => String(row.mobile ?? '').trim()).filter(Boolean))];

    for (const mobile of uniqueNumbers) {
      try {
        const response = await fetch('/api/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ mobile })
        });

        const result = await response.json();
        const ok = result.success;
        statusDiv.innerHTML += `<div class="status ${ok ? 'success' : 'error'}">${ok ? '✅' : '❌'} ${mobile} - ${result.message || `Journey Count: ${result.journeyCount}, Loyalty: ${result.loyaltyCouponSent ? 'YES' : 'NO'}`}</div>`;
      } catch (error) {
        statusDiv.innerHTML += `<div class="status error">❌ ${mobile} - ${error.message}</div>`;
      }
    }

    await fetchAnalytics();
  };

  reader.readAsArrayBuffer(file);
}

function setupNavigation() {
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.section');

  links.forEach(link => {
    link.addEventListener('click', () => {
      links.forEach(l => l.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      link.classList.add('active');
      document.getElementById(link.dataset.section).classList.add('active');
    });
  });
}

document.getElementById('processBtn').addEventListener('click', processExcel);
setupNavigation();
fetchAnalytics();
