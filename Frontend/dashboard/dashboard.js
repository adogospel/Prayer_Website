const API = "http://localhost:4000";
let token = localStorage.getItem('adminToken');

// If token exists, show main dashboard
if (token) {
  document.getElementById('loginPanel').style.display = 'none';
  document.getElementById('mainDashboard').style.display = 'block';
  loadCategories();
}

// Login admin
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(e.target));

  const res = await fetch(`${API}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });

  const data = await res.json();
  document.getElementById('loginMsg').textContent = data.message;

  if (res.ok) {
    localStorage.setItem('adminToken', data.token);
    location.reload();
  }
});

// Load categories
async function loadCategories() {
  const res = await fetch(`${API}/categories`);
  const categories = await res.json();
  const select = document.getElementById('bookCategory');
  select.innerHTML = categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
}

// Add category
document.getElementById('categoryForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('categoryName').value.trim();

  const res = await fetch(`${API}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
    },
    body: JSON.stringify({ name })
  });

  const data = await res.json();
  document.getElementById('msg').textContent = data.message;
  if (res.ok) loadCategories();
});

// Upload book
document.getElementById('bookForm').addEventListener('submit', async e => {
  e.preventDefault();

  const formData = new FormData(e.target);

  const res = await fetch(`${API}/books`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
    },
    body: formData
  });

  const data = await res.json();
  document.getElementById('msg').textContent = data.message;
  e.target.reset();
});

// Logout admin
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('adminToken');
  location.reload();
});
