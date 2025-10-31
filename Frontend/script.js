// ===== BASE URL OF BACKEND =====
const API_BASE = 'http://localhost:4000';

// Menu toggle
let menu = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

menu.onclick = () => {
  navbar.classList.toggle('active');
};

// Change header background when scrolling
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  header.classList.toggle('scrolled', window.scrollY > 50);
});

// ===== AUTH MODAL JS =====
const openBtn = document.getElementById('open-signin');
const modal = document.getElementById('auth-modal');
const closeBtn = document.getElementById('auth-close');
const tabSignin = document.getElementById('tab-signin');
const tabSignup = document.getElementById('tab-signup');
const formSignin = document.getElementById('signin-form');
const formSignup = document.getElementById('signup-form');
const toSignup = document.getElementById('to-signup');
const toSignin = document.getElementById('to-signin');
const forgotLink = document.getElementById('forgot-link');

function showModal() {
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}
function hideModal() {
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

openBtn.addEventListener('click', showModal);
closeBtn.addEventListener('click', hideModal);
modal.addEventListener('click', e => {
  if (e.target === modal) hideModal();
});

/* Tabs */
tabSignin.addEventListener('click', () => {
  tabSignin.classList.add('active');
  tabSignup.classList.remove('active');
  formSignin.classList.add('active');
  formSignup.classList.remove('active');
});
tabSignup.addEventListener('click', () => {
  tabSignup.classList.add('active');
  tabSignin.classList.remove('active');
  formSignup.classList.add('active');
  formSignin.classList.remove('active');
});

toSignup.addEventListener('click', () => tabSignup.click());
toSignin.addEventListener('click', () => tabSignin.click());

/* FORGOT LINK */
forgotLink.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = prompt('Enter your email to reset password:');
  if (!email) return;

  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    alert(data.message || 'If your email exists, we sent reset instructions.');
  } catch (err) {
    console.error(err);
    alert('Network error');
  }
});

/* SIGNIN */
formSignin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signin-email').value.trim();
  const password = document.getElementById('signin-password').value;
  const keep = document.getElementById('keep-signed').checked;

  try {
    const res = await fetch(`${API_BASE}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, keep })
    });

    const data = await res.json();

    if (res.ok) {
      // ✅ Save the token and user info
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('auth_user', data.user.name || data.user.email);
      }

      alert('✅ Signed in successfully');
      hideModal();
      window.location.reload();
    } else {
      alert(data.message || '❌ Sign in failed');
    }
  } catch (err) {
    console.error(err);
    alert('Network error');
  }
});



/* SIGNUP */
formSignup.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      alert('Account created. You can now sign in.');
      tabSignin.click();
    } else {
      alert(data.message || 'Sign up failed');
    }
  } catch (err) {
    console.error(err);
    alert('Network error');
  }
});

/* Auto sign-in if token in localStorage */
(async function tryAutoSignIn() {
  const token = localStorage.getItem('auth_token');
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (res.ok) {
      const user = await res.json();
      console.log('Auto signed in as', user.email);
    } else {
      localStorage.removeItem('auth_token');
    }
  } catch (e) {
    console.warn('auto sign-in failed', e);
  }
})();

// ===== PRAYER REQUEST MODAL WITH BACKEND =====
document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('open-prayer-btn');
  const modal = document.getElementById('prayer-modal');
  const closeBtn = document.getElementById('close-prayer-modal');
  const prayerForm = document.getElementById('prayer-form');
  const wall = document.querySelector('.wall');
  const API_BASE = 'http://localhost:4000';

  function showModal() {
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
  }
  function hideModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showModal();
  });
  closeBtn.addEventListener('click', hideModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
  });

  // SUBMIT NEW PRAYER
prayerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const category = document.getElementById('prayer-category').value;
  const request = document.getElementById('prayer-text').value.trim();
  const token = localStorage.getItem('auth_token');

  if (!token) return alert('You must be signed in to submit a prayer.');
  if (!category || !request) return alert('Please fill in all fields.');

  try {
    const res = await fetch(`${API_BASE}/prayers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ category, request }) // user is taken from token
    });

    const prayer = await res.json();
    if (!res.ok) throw new Error(prayer.message || 'Failed to submit prayer');
    addPrayerToWall(prayer);
    prayerForm.reset();
    hideModal();
    alert('🙏 Your prayer request has been posted.');
  } catch (err) {
    console.error(err);
    alert('Error saving prayer: ' + err.message);
  }
});


  // FETCH & DISPLAY PRAYERS
  async function loadPrayers() {
    try {
      const res = await fetch(`${API_BASE}/prayers`);
      const prayers = await res.json();
      wall.innerHTML = '';
      prayers.forEach(addPrayerToWall);
    } catch (err) {
      console.error(err);
    }
  }

  // ADD PRAYER CARD TO WALL
  function addPrayerToWall(prayer) {
  const dateStr = new Date(prayer.date).toLocaleDateString();
  const div = document.createElement('div');
  div.className = 'post';
  div.innerHTML = `
    <div class="pray-info">
      <span class="pray-count">Prayed for ${prayer.prayCount} times.</span>
      <i class='bx bx-comment comment-icon' title="Add a prayer"></i>
      <button class="btn primary pray-btn">I PRAYED FOR THIS</button>
    </div>
    <h4>${prayer.user} requests prayer...</h4>
    <p>🙏 ${prayer.request}</p>
    <small>${dateStr} — Found in: ${prayer.category}</small>
    <div class="comments"></div>
    <div class="add-comment-container" style="display:none;">
      <input type="text" class="comment-input" placeholder="Write your prayer..." />
      <button class="btn submit-comment">Send</button>
    </div>
  `;
  wall.prepend(div);

  const prayBtn = div.querySelector('.pray-btn');
  const commentIcon = div.querySelector('.comment-icon');
  const prayCount = div.querySelector('.pray-count');
  const commentsDiv = div.querySelector('.comments');
  const addCommentContainer = div.querySelector('.add-comment-container');
  const commentInput = div.querySelector('.comment-input');
  const submitCommentBtn = div.querySelector('.submit-comment');

  let prayed = false; // only one click per session

  // Toggle comment input
  commentIcon.addEventListener('click', () => {
    addCommentContainer.style.display = addCommentContainer.style.display === 'none' ? 'flex' : 'none';
  });

  // Send comment
  submitCommentBtn.addEventListener('click', async () => {
    const text = commentInput.value.trim();
    if (!text) return alert('Enter a prayer.');

    const token = localStorage.getItem('auth_token');
    if (!token) return alert('You must be signed in to comment.');

    const res = await fetch(`${API_BASE}/prayers/${prayer._id}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });

    const data = await res.json();
    if (res.ok) {
      // Update UI
      commentsDiv.innerHTML += `<div class="comment"><b>${localStorage.getItem('auth_user')}</b>: ${text}</div>`;
      prayCount.textContent = `Prayed for ${data.prayCount} times.`;
      commentInput.value = '';

      // If user didn't click "I PRAYED FOR THIS", count it as prayed
      prayed = true;
      prayBtn.disabled = true;
    } else {
      alert(data.message);
    }
  });

  // Pray button
  prayBtn.addEventListener('click', async () => {
    if (prayed) return; // only once
    const token = localStorage.getItem('auth_token');
    if (!token) return alert('You must be signed in to pray.');

    const res = await fetch(`${API_BASE}/prayers/${prayer._id}/pray`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();
    if (res.ok) {
      prayCount.textContent = `Prayed for ${data.prayCount} times.`;
      prayed = true;
      prayBtn.disabled = true;
    } else {
      alert(data.message);
    }
  });

  // Load existing comments
  if (prayer.comments && prayer.comments.length > 0) {
    prayer.comments.forEach(c => {
      commentsDiv.innerHTML += `<div class="comment"><b>${c.user}</b>: ${c.text}</div>`;
    });
  }
}

  loadPrayers();
});
