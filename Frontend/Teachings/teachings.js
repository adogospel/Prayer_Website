const API = "http://localhost:4000";
const token = localStorage.getItem("adminToken");

// Load categories
async function loadTeachingCategories() {
  const res = await fetch(`${API}/teaching-categories`);
  const cats = await res.json();

  document.getElementById("teachingCategorySelect").innerHTML =
    cats.map(c => `<option value="${c._id}">${c.name}</option>`).join("");
}

loadTeachingCategories();

// Add category
document.getElementById("teachingCategoryForm").addEventListener("submit", async e => {
  e.preventDefault();

  const name = document.getElementById("teachingCategoryName").value.trim();

  const res = await fetch(`${API}/teaching-categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ name })
  });

  const data = await res.json();
  document.getElementById("msg").textContent = data.message;
  loadTeachingCategories();
});

// Publish teaching ✅
document.getElementById("teachingForm").addEventListener("submit", async e => {
  e.preventDefault();

  const formData = Object.fromEntries(new FormData(e.target));

  const res = await fetch(`${API}/teachings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify(formData)
  });

  const result = await res.json();
  document.getElementById("msg").textContent = result.message;

  if (res.ok) e.target.reset();
});
