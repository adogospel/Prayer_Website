// ===== BASE URL OF BACKEND =====
const API_BASE = "http://localhost:4000";

// ===== PRAYER GLOBAL ELEMENTS =====
document.addEventListener("DOMContentLoaded", () => {

  /* ================= PRAYER GLOBAL ELEMENTS ================= */

  const prayerBtn = document.getElementById("open-prayer-btn");
  const prayerModal = document.getElementById("prayer-modal");
  const closePrayer = document.getElementById("close-prayer-modal");
  const prayerForm = document.getElementById("prayer-form");
  const wall = document.querySelector(".wall");

  function showPrayerModal() {
    prayerModal.classList.add("show");
  }

  function hidePrayerModal() {
    prayerModal.classList.remove("show");
  }

  prayerBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    showPrayerModal();
  });

  closePrayer?.addEventListener("click", hidePrayerModal);

  prayerModal?.addEventListener("click", (e) => {
    if (e.target === prayerModal) hidePrayerModal();
  });

  /* ================= SUBMIT PRAYER ================= */

  prayerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const category = document.getElementById("prayer-category").value;
    const request = document.getElementById("prayer-text").value.trim();
    const token = localStorage.getItem("auth_token");

    if (!token) return alert("Login required");
    if (!request) return alert("Write a prayer");

    const res = await fetch(`${API_BASE}/prayers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ category, request }),
    });

    const prayer = await res.json();
    if (!res.ok) return alert(prayer.message);

    addPrayerToWall(prayer);
    prayerForm.reset();
    hidePrayerModal();
  });

  /* ================= RENDER PRAYER ================= */
  function addPrayerToWall(prayer) {
  const dateStr = new Date(prayer.date).toLocaleDateString();

  const div = document.createElement("div");
  div.className = "post";

  div.innerHTML = `
  <div class="pray-info">
    <span class="pray-count">Prayed for ${prayer.prayCount} times.</span>
    <span class="share-count">${prayer.shareCount || 0} shares</span>

    <div class="pray-actions">
      <i class='bx bx-share-alt share-icon' title="Share"></i>
      <i class='bx bx-comment comment-icon' title="Comments"></i>
      <button class="btn primary pray-btn">I PRAYED FOR THIS</button>
    </div>
  </div>

  <h4>${prayer.user} requests prayer...</h4>
  <p>🙏 ${prayer.request}</p>
  <small>${dateStr} — ${prayer.category}</small>

  <div class="comments"></div>

  <div class="add-comment-container" style="display:none;">
    <input type="text" class="comment-input" placeholder="Write your prayer..." />
    <button class="btn submit-comment">Send</button>
  </div>

  <div class="share-modal" style="display:none;">
  <div class="share-box">
    <h3>Share this prayer 🙏</h3>

    <div class="share-buttons">
      <a class="share-whatsapp" target="_blank">WhatsApp</a>
      <a class="share-facebook" target="_blank">Facebook</a>
      <button class="share-copy">Copy link</button>
    </div>

    <button class="share-close">Close</button>
  </div>
</div>

`;


  wall.prepend(div);

  const prayBtn = div.querySelector(".pray-btn");
  const prayCount = div.querySelector(".pray-count");
  const commentIcon = div.querySelector(".comment-icon");
  const commentsDiv = div.querySelector(".comments");
  const addCommentContainer = div.querySelector(".add-comment-container");
  const commentInput = div.querySelector(".comment-input");
  const submitCommentBtn = div.querySelector(".submit-comment");
  const shareCountSpan = div.querySelector(".share-count");
  const shareIcon = div.querySelector(".share-icon");
  const shareModal = div.querySelector(".share-modal");
  const shareClose = div.querySelector(".share-close");
  const shareWhatsapp = div.querySelector(".share-whatsapp");
  const shareFacebook = div.querySelector(".share-facebook");
  const shareCopy = div.querySelector(".share-copy");
  const shareUrl = `${window.location.origin}/prayer/${prayer._id}`;
  const shareText = `🙏 Prayer request from ${prayer.user}:\n"${prayer.request}"`;


  let prayed = false;

  // Toggle comments
  commentIcon.addEventListener("click", () => {
    addCommentContainer.style.display =
      addCommentContainer.style.display === "none" ? "flex" : "none";
  });

  // Submit comment
  submitCommentBtn.addEventListener("click", async () => {
    const text = commentInput.value.trim();
    const token = localStorage.getItem("auth_token");

    if (!token) return alert("Login required");
    if (!text) return alert("Write a comment");

    const res = await fetch(`${API_BASE}/prayers/${prayer._id}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message);

    commentsDiv.innerHTML += `<div class="comment"><b>${localStorage.getItem(
      "auth_user"
    )}</b>: ${text}</div>`;

    prayCount.textContent = `Prayed for ${data.prayCount} times.`;
    commentInput.value = "";
    prayed = true;
    prayBtn.disabled = true;
  });

shareIcon.addEventListener("click", () => {
  shareWhatsapp.href = `https://wa.me/?text=${shareText}%20${shareUrl}`;
  shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
  shareModal.style.display = "flex";
});

shareClose.onclick = () => shareModal.style.display = "none";

shareCopy.onclick = async () => {
  await navigator.clipboard.writeText(shareUrl);
  incrementShare(prayer._id, shareCountSpan);
  shareModal.style.display = "none";
};



  // Pray button
  prayBtn.addEventListener("click", async () => {
    if (prayed) return;

    const token = localStorage.getItem("auth_token");
    if (!token) return alert("Login required");

    const res = await fetch(`${API_BASE}/prayers/${prayer._id}/pray`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message);

    prayCount.textContent = `Prayed for ${data.prayCount} times.`;
    prayed = true;
    prayBtn.disabled = true;
  });

  // Load existing comments from DB
  if (prayer.comments && prayer.comments.length) {
    prayer.comments.forEach((c) => {
      commentsDiv.innerHTML += `<div class="comment"><b>${c.user}</b>: ${c.text}</div>`;
    });
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  });
}

async function incrementShare(id, el) {
  const res = await fetch(`${API_BASE}/prayers/${id}/share`, {
    method: "POST",
  });

  const data = await res.json();
  el.textContent = `${data.shareCount ?? 0} shares`;
}


  /* ================= LOAD PRAYERS ================= */

  async function loadPrayers() {
    const res = await fetch(`${API_BASE}/prayers`);
    const prayers = await res.json();
    wall.innerHTML = "";
    prayers.forEach(addPrayerToWall);
  }

  loadPrayers();
});



/* -------------------------------------------------------------------------- */
/*                                NAVBAR + UI                                 */
/* -------------------------------------------------------------------------- */

// Menu toggle
let menu = document.querySelector("#menu-icon");
let navbar = document.querySelector(".navbar");

menu.onclick = () => {
  navbar.classList.toggle("active");
};

// Change header background when scrolling
window.addEventListener("scroll", () => {
  const header = document.querySelector("header");
  header.classList.toggle("scrolled", window.scrollY > 50);
});

/* -------------------------------------------------------------------------- */
/*                                  AUTH MODAL                                */
/* -------------------------------------------------------------------------- */

const openBtn = document.getElementById("open-signin");
const modal = document.getElementById("auth-modal");
const closeBtn = document.getElementById("auth-close");
const tabSignin = document.getElementById("tab-signin");
const tabSignup = document.getElementById("tab-signup");
const formSignin = document.getElementById("signin-form");
const formSignup = document.getElementById("signup-form");
const toSignup = document.getElementById("to-signup");
const toSignin = document.getElementById("to-signin");
const forgotLink = document.getElementById("forgot-link");

function showModal() {
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => {
    const first = modal.querySelector("input, button");
    if (first) first.focus();
  }, 50);
}

function hideModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  openBtn.focus();
}

openBtn.addEventListener("click", showModal);
closeBtn.addEventListener("click", hideModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) hideModal();
});

/* Tabs */
tabSignin.addEventListener("click", () => {
  tabSignin.classList.add("active");
  tabSignup.classList.remove("active");
  formSignin.classList.add("active");
  formSignup.classList.remove("active");
});
tabSignup.addEventListener("click", () => {
  tabSignup.classList.add("active");
  tabSignin.classList.remove("active");
  formSignup.classList.add("active");
  formSignin.classList.remove("active");
});

toSignup.addEventListener("click", () => tabSignup.click());
toSignin.addEventListener("click", () => tabSignin.click());

/* -------------------------------------------------------------------------- */
/*                           PASSWORD SHOW/HIDE ICON                           */
/* -------------------------------------------------------------------------- */

document.querySelectorAll(".toggle-password").forEach((icon) => {
  icon.addEventListener("click", () => {
    const input = document.getElementById(icon.dataset.target);
    if (!input) return;

    if (input.type === "password") {
      input.type = "text";
      icon.classList.replace("bx-hide", "bx-show");
    } else {
      input.type = "password";
      icon.classList.replace("bx-show", "bx-hide");
    }
  });
});

/* -------------------------------------------------------------------------- */
/*                            SIGNIN + SIGNUP FORMS                            */
/* -------------------------------------------------------------------------- */

formSignin.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signin-email").value.trim();
  const password = document.getElementById("signin-password").value;
  const keep = document.getElementById("keep-signed").checked;

  try {
    const res = await fetch(`${API_BASE}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, keep }),
    });

    const data = await res.json();

    if (res.ok) {
      if (data.token) localStorage.setItem("auth_token", data.token);
      if (data.user) localStorage.setItem("auth_user", data.user.name);

      alert("Signed in successfully");
      hideModal();
      window.location.reload();
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Network error");
  }
});

formSignup.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;

  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Account created. You can now sign in.");
      tabSignin.click();
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Network error");
  }
});

/* -------------------------------------------------------------------------- */
/*                             FORGOT PASSWORD MODAL                           */
/* -------------------------------------------------------------------------- */

const forgotModal = document.getElementById("forgot-modal");
const closeForgot = document.getElementById("close-forgot");
const step2 = document.getElementById("step2");

forgotLink.addEventListener("click", (e) => {
  e.preventDefault();
  modal.classList.remove("show");
  forgotModal.classList.add("show");
});

closeForgot.addEventListener("click", () => {
  forgotModal.classList.remove("show");
});

// Send code
document.getElementById("fp-send").addEventListener("click", async () => {
  const email = document.getElementById("fp-email").value;

  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  alert(data.message);

  if (res.ok) step2.style.display = "block";
});

// Verify code + reset
document.getElementById("fp-reset").addEventListener("click", async () => {
  const email = document.getElementById("fp-email").value;
  const code = document.getElementById("fp-code").value;
  const newPassword = document.getElementById("fp-newpass").value;

  const res = await fetch(`${API_BASE}/auth/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, newPassword }),
  });

  const data = await res.json();
  alert(data.message);

  if (res.ok) {
    forgotModal.classList.remove("show");
    tabSignin.click();
    showModal();
  }
});

/* -------------------------------------------------------------------------- */
/*                          GOOGLE LOGIN (REAL OAUTH)                          */
/* -------------------------------------------------------------------------- */

document.getElementById("google-login").addEventListener("click", () => {
  window.location.href = `${API_BASE}/auth/google`;
});

// Capture redirect after Google sign-in
(function readGoogleToken() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const name = params.get("name");

  if (token) {
    localStorage.setItem("auth_token", token);
    if (name) localStorage.setItem("auth_user", name);

    history.replaceState({}, document.title, window.location.pathname);

    alert("Signed in with Google");
    window.location.reload();
  }
})();

/* -------------------------------------------------------------------------- */
/*                           AUTO SIGN-IN (JWT /me)                           */
/* -------------------------------------------------------------------------- */

(async function tryAutoSignIn() {
  const token = localStorage.getItem("auth_token");
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) localStorage.removeItem("auth_token");
  } catch {
    localStorage.removeItem("auth_token");
  }
})();

/* -------------------------------------------------------------------------- */
/*                            PRAYER SYSTEM (BACKEND)                          */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                       3D Infinite Carousel (book section)                  */
/* -------------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  const carousel = document.querySelector(".book-carousel");
  if (!carousel) return;
  carousel.innerHTML += carousel.innerHTML;
});
