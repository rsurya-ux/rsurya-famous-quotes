/**
 * QuoteWise - Plain Vanilla JavaScript Controller
 * No external libraries or frameworks required.
 */
document.addEventListener("DOMContentLoaded", () => {
  // State
  let allQuotes = [];
  let currentHeroQuote = null;
  let activeCategory = "all";
  let activeAuthor = "";
  let searchDebounceTimer = null;

  // DOM Elements
  const heroCard = document.getElementById("hero-card");
  const heroCategory = document.getElementById("hero-category");
  const heroId = document.getElementById("hero-id");
  const heroText = document.getElementById("hero-text");
  const heroAuthor = document.getElementById("hero-author");
  const btnRandomQuote = document.getElementById("btn-random-quote");
  const btnCopy = document.getElementById("btn-copy");
  const btnSpeak = document.getElementById("btn-speak");

  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("clear-search");
  const authorSelect = document.getElementById("author-select");
  const categoryFilters = document.getElementById("category-filters");
  const resultsCount = document.getElementById("results-count");
  const btnResetFilters = document.getElementById("btn-reset-filters");
  const quotesGrid = document.getElementById("quotes-grid");
  const emptyState = document.getElementById("empty-state");
  const btnEmptyReset = document.getElementById("btn-empty-reset");
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");
  const totalBadge = document.getElementById("total-quotes-badge");

  // Utilities
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  let toastTimeout;
  function showToast(message) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastMessage.textContent = message;
    toast.classList.add("show");
    toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }

  function copyQuoteToClipboard(quoteText, authorText) {
    const textToCopy = `"${quoteText}" — ${authorText}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => showToast("Quote copied to clipboard!"))
        .catch(() => fallbackCopy(textToCopy));
    } else {
      fallbackCopy(textToCopy);
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      showToast("Quote copied to clipboard!");
    } catch (e) {
      showToast("Could not copy quote");
    }
    document.body.removeChild(textarea);
  }

  function speakQuote(text, author) {
    if (!('speechSynthesis' in window)) {
      showToast("Text-to-speech is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${text}. By ${author}.`);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    showToast("Reading quote aloud...");
  }

  // Update Hero Section
  function renderHeroQuote(quote) {
    if (!quote) return;
    currentHeroQuote = quote;

    // Smooth transition
    heroCard.style.opacity = "0.4";
    heroCard.style.transform = "scale(0.99)";

    setTimeout(() => {
      heroCategory.textContent = quote.category;
      heroId.textContent = `#${quote.id}`;
      heroText.textContent = quote.quote;
      heroAuthor.textContent = `— ${quote.author}`;

      heroCard.style.opacity = "1";
      heroCard.style.transform = "scale(1)";
    }, 150);
  }

  // Fetch Random Quote from Server API
  async function fetchRandomQuote() {
    try {
      const params = new URLSearchParams();
      if (activeCategory && activeCategory !== "all") {
        params.append("category", activeCategory);
      }
      if (activeAuthor) {
        params.append("author", activeAuthor);
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`/api/quotes/random${queryString}`);
      if (res.ok) {
        const quote = await res.json();
        renderHeroQuote(quote);
      } else {
        // Fallback to client pool if API returned 404 (e.g. no match with active filters)
        getRandomFromClientPool();
      }
    } catch (err) {
      console.warn("Falling back to local quotes pool:", err);
      getRandomFromClientPool();
    }
  }

  function getRandomFromClientPool() {
    let pool = allQuotes;
    if (activeCategory && activeCategory !== "all") {
      pool = pool.filter(q => q.category.toLowerCase() === activeCategory.toLowerCase());
    }
    if (activeAuthor) {
      pool = pool.filter(q => q.author.toLowerCase().includes(activeAuthor.toLowerCase()));
    }
    if (pool.length === 0) pool = allQuotes;
    if (pool.length > 0) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      renderHeroQuote(pool[randomIndex]);
    }
  }

  // Fetch Categories from Server API
  async function loadCategories() {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const categories = await res.json();
      
      // Update 'All' count
      const totalCount = categories.reduce((sum, c) => sum + c.count, 0);
      const allCountSpan = document.getElementById("count-all");
      if (allCountSpan) allCountSpan.textContent = totalCount;
      if (totalBadge) totalBadge.textContent = `${totalCount} Quotes`;

      // Render category pill buttons
      categories.forEach(cat => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cat-pill";
        btn.dataset.category = cat.name.toLowerCase();
        btn.innerHTML = `${escapeHtml(cat.name)} <span class="pill-count">${cat.count}</span>`;
        btn.addEventListener("click", () => handleCategoryClick(cat.name.toLowerCase(), btn));
        categoryFilters.appendChild(btn);
      });
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  }

  // Fetch Authors from Server API
  async function loadAuthors() {
    try {
      const res = await fetch("/api/authors");
      if (!res.ok) throw new Error("Failed to load authors");
      const authors = await res.json();

      authors.forEach(author => {
        const option = document.createElement("option");
        option.value = author;
        option.textContent = author;
        authorSelect.appendChild(option);
      });
    } catch (err) {
      console.error("Error loading authors:", err);
    }
  }

  // Fetch All Quotes
  async function loadAllQuotes() {
    try {
      const res = await fetch("/api/quotes");
      if (!res.ok) throw new Error("Failed to load quotes");
      const data = await res.json();
      allQuotes = data.quotes || [];
      renderGrid(allQuotes);

      // Select initial random quote
      if (allQuotes.length > 0) {
        fetchRandomQuote();
      }
    } catch (err) {
      console.error("Error loading all quotes:", err);
    }
  }

  // Query Server API for filtered results
  async function searchQuotes() {
    const query = searchInput.value.trim();
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (activeAuthor) params.append("author", activeAuthor);
    if (activeCategory && activeCategory !== "all") params.append("category", activeCategory);

    try {
      const res = await fetch(`/api/quotes/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search request failed");
      const data = await res.json();
      renderGrid(data.quotes || []);
    } catch (err) {
      console.warn("API search error, falling back to client filter:", err);
      clientSideFilter();
    }
  }

  function clientSideFilter() {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = allQuotes.filter(q => {
      const matchesCategory = (activeCategory === "all") || (q.category.toLowerCase() === activeCategory.toLowerCase());
      const matchesAuthor = (!activeAuthor) || (q.author.toLowerCase().includes(activeAuthor.toLowerCase()));
      const matchesQuery = (!query) || (q.quote.toLowerCase().includes(query) || q.author.toLowerCase().includes(query));
      return matchesCategory && matchesAuthor && matchesQuery;
    });
    renderGrid(filtered);
  }

  // Render Quote Cards in Grid
  function renderGrid(quotes) {
    quotesGrid.innerHTML = "";

    resultsCount.innerHTML = `Showing <strong>${quotes.length}</strong> quote${quotes.length === 1 ? "" : "s"}`;

    if (quotes.length === 0) {
      emptyState.classList.remove("hidden");
      quotesGrid.style.display = "none";
      return;
    }

    emptyState.classList.add("hidden");
    quotesGrid.style.display = "grid";

    const fragment = document.createDocumentFragment();

    quotes.forEach(quote => {
      const card = document.createElement("article");
      card.className = "quote-card";
      card.setAttribute("tabindex", "0");
      card.innerHTML = `
        <div class="card-header">
          <span class="card-category">${escapeHtml(quote.category)}</span>
          <span class="card-id">#${quote.id}</span>
        </div>
        <blockquote class="card-quote">&ldquo;${escapeHtml(quote.quote)}&rdquo;</blockquote>
        <div class="card-footer">
          <cite class="card-author">&mdash; ${escapeHtml(quote.author)}</cite>
          <button type="button" class="card-copy-btn" title="Copy quote" aria-label="Copy quote">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      `;

      // Copy button on card
      const copyBtn = card.querySelector(".card-copy-btn");
      copyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        copyQuoteToClipboard(quote.quote, quote.author);
      });

      // Clicking card promotes it to the hero
      card.addEventListener("click", () => {
        renderHeroQuote(quote);
        heroCard.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      fragment.appendChild(card);
    });

    quotesGrid.appendChild(fragment);
  }

  // Event Handlers
  function handleCategoryClick(category, targetButton) {
    activeCategory = category;
    document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
    if (targetButton) {
      targetButton.classList.add("active");
    }
    searchQuotes();
  }

  // All Category Pill
  const allCategoryPill = document.querySelector('.cat-pill[data-category="all"]');
  if (allCategoryPill) {
    allCategoryPill.addEventListener("click", () => handleCategoryClick("all", allCategoryPill));
  }

  // Search Input with Debounce
  searchInput.addEventListener("input", () => {
    clearSearchBtn.style.display = searchInput.value ? "block" : "none";
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      searchQuotes();
    }, 250);
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    searchInput.focus();
    searchQuotes();
  });

  // Author Select Dropdown
  authorSelect.addEventListener("change", (e) => {
    activeAuthor = e.target.value;
    searchQuotes();
  });

  // Reset Filters
  function resetAllFilters() {
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    authorSelect.value = "";
    activeAuthor = "";
    activeCategory = "all";
    document.querySelectorAll(".cat-pill").forEach(p => {
      p.classList.toggle("active", p.dataset.category === "all");
    });
    searchQuotes();
  }

  btnResetFilters.addEventListener("click", resetAllFilters);
  btnEmptyReset.addEventListener("click", resetAllFilters);

  // Hero Actions
  btnRandomQuote.addEventListener("click", fetchRandomQuote);

  btnCopy.addEventListener("click", () => {
    if (currentHeroQuote) {
      copyQuoteToClipboard(currentHeroQuote.quote, currentHeroQuote.author);
    }
  });

  btnSpeak.addEventListener("click", () => {
    if (currentHeroQuote) {
      speakQuote(currentHeroQuote.quote, currentHeroQuote.author);
    }
  });

  // Keyboard Shortcuts: Press 'R' or Space for Next Quote when not typing
  document.addEventListener("keydown", (e) => {
    const isTyping = ["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName);
    if (!isTyping) {
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        fetchRandomQuote();
      } else if (e.code === "Space") {
        e.preventDefault();
        fetchRandomQuote();
      }
    }
  });

  // Initialize
  loadCategories();
  loadAuthors();
  loadAllQuotes();
});
