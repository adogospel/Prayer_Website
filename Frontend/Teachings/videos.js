// ===== BASE URL OF BACKEND =====
const API= "http://localhost:4000";

    // Convert YouTube / Vimeo URL to embed URL
    function getEmbedUrl(url) {
      // YouTube
      if (url.includes("youtube.com/watch")) {
        const videoId = url.split("v=")[1].split("&")[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      // Short YouTube URLs
      if (url.includes("youtu.be/")) {
        const videoId = url.split("youtu.be/")[1].split("?")[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      // Vimeo
      if (url.includes("vimeo.com/")) {
        const videoId = url.split("vimeo.com/")[1].split("?")[0];
        return `https://player.vimeo.com/video/${videoId}`;
      }
      // Fallback: return original URL
      return url;
    }

async function loadTeachingCategories() {
  const res = await fetch(`${API}/teaching-categories`);
  const cats = await res.json();

  const bar = document.querySelector(".filter-bar");
  bar.innerHTML =
    `<button class="filter-btn active" data-cat="all">All</button>` +
    cats.map(c =>
      `<button class="filter-btn" data-cat="${c.name.toLowerCase()}">${c.name}</button>`
    ).join("");
}

async function loadTeachings() {
  const res = await fetch(`${API}/teachings`);
  const teachings = await res.json();
  const container = document.getElementById("teachingsList");

  if (!teachings.length) {
    container.innerHTML = "<p class='empty'>No teachings available.</p>";
    return;
  }

  container.innerHTML = teachings.map(t => {
    const shortDesc =
      t.description && t.description.length > 120
        ? t.description.slice(0, 120) + "..."
        : t.description || "";

    return `
      <div class="teaching-card" data-cat="${t.category?.name?.toLowerCase() || 'all'}">
        <div class="video-wrapper">
          <div class="play-overlay">
            ▶
          </div>
          <iframe src="${getEmbedUrl(t.videoUrl)}" allowfullscreen></iframe>
        </div>

        <div class="teaching-content">
          <h3>${t.title}</h3>
          <p class="speaker">${t.speaker || ""}</p>

          ${t.description ? `
            <p class="description"
               data-full="${t.description}"
               data-short="${shortDesc}">
              ${shortDesc}
              ${t.description.length > 120 ? `<span class="read-more"> Read more</span>` : ""}
            </p>
          ` : ""}
        </div>
      </div>
    `;
  }).join("");

  initTeachingFilters();
  initReadMore();
}

function initReadMore() {
  document.querySelectorAll(".read-more").forEach(btn => {
    btn.onclick = e => {
      const p = e.target.closest(".description");

      if (p.textContent.includes("Read less")) {
        p.innerHTML = p.dataset.short + ' <span class="read-more">Read more</span>';
      } else {
        p.innerHTML = p.dataset.full + ' <span class="read-more">Read less</span>';
      }

      initReadMore(); // rebind
    };
  });
}


function initTeachingFilters() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const cat = btn.dataset.cat;
      document.querySelectorAll(".teaching-card").forEach(card => {
        card.style.display =
          cat === "all" || card.dataset.cat === cat ? "block" : "none";
      });
    };
  });
}

(async function init() {
  await loadTeachingCategories();
  await loadTeachings();
})();

