const API = "http://localhost:4000";

// Load categories dynamically
async function loadCategories() {
  const res = await fetch(`${API}/categories`);
  const categories = await res.json();

  const filterBar = document.querySelector('.filter-bar');
  filterBar.innerHTML = `<button class="filter-btn active" data-category="all">All</button>` +
    categories.map(cat => `<button class="filter-btn" data-category="${cat.name.toLowerCase().replace(/\s+/g, '-')}">${cat.name}</button>`).join('');
}

// Load books
async function loadBooks() {
  const res = await fetch(`${API}/books`);
  const books = await res.json();
  const grid = document.getElementById('booksGrid');

  grid.innerHTML = books.map(book => {
    const shortDesc = book.description.length > 120 ? book.description.slice(0, 120) + '...' : book.description;
    return `
      <div class="book-card" data-category="${book.category.name.toLowerCase().replace(/\s+/g, '-')}">
        <div class="book-img-wrapper">
          <img src="${book.imageUrl ? API + book.imageUrl : 'default.jpg'}" alt="Book Cover">
        </div>
        <div class="book-content">
          <h3>${book.title}</h3>
          <p class="book-desc" data-full="${book.description}" data-short="${shortDesc}">${shortDesc}${book.description.length > 120 ? ' <span class="read-more">Read more</span>' : ''}</p>
          <a href="${API + book.fileUrl}" target="_blank" class="btn primary">Read PDF</a>
        </div>
      </div>
    `;
  }).join('');

  initBookFilters();
  initReadMore();
  animateBooks();
}

// ===== CATEGORY FILTER =====
function initBookFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  const books = document.querySelectorAll('.book-card');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.getAttribute('data-category');

      books.forEach(book => {
        if (category === 'all' || book.dataset.category === category) {
          book.style.display = 'flex';
          // trigger animation
          requestAnimationFrame(() => book.classList.add('show'));
        } else {
          book.classList.remove('show');
          setTimeout(() => { book.style.display = 'none'; }, 300);
        }
      });
    });
  });
}

// ===== READ MORE TOGGLE =====
function initReadMore() {
  const readMoreBtns = document.querySelectorAll('.read-more');
  readMoreBtns.forEach(btn => {
    btn.addEventListener('click', e => {
      const p = e.target.closest('.book-desc');
      if (p.textContent.includes('Read less')) {
        p.innerHTML = p.dataset.short + ' <span class="read-more">Read more</span>';
      } else {
        p.innerHTML = p.dataset.full + ' <span class="read-more">Read less</span>';
      }
      initReadMore(); // reattach events
    });
  });
}

// ===== ANIMATE BOOKS ON LOAD =====
function animateBooks() {
  const books = document.querySelectorAll('.book-card');
  books.forEach((book, index) => {
    setTimeout(() => book.classList.add('show'), index * 100);
  });
}

// Initialize library
(async function initLibrary() {
  await loadCategories();
  await loadBooks();
})();
