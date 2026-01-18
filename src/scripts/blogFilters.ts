// Blog filtering with pagination and dynamic rendering

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  pubDate: string;
}

interface FilterState {
  tags: string[];
  month: string;
  search: string;
}

// Pagination settings
const POSTS_PER_PAGE = 20;

let filterState: FilterState = {
  tags: [],
  month: '',
  search: '',
};

let allPosts: BlogPost[] = [];
let filteredPosts: BlogPost[] = [];
let currentPage = 1;
let searchDebounceTimer: number | null = null;

// Initialize filters from URL on page load
function initializeFilters(): void {
  const params = new URLSearchParams(window.location.search);

  // Parse tags
  const tagsParam = params.get('tags');
  if (tagsParam) {
    filterState.tags = tagsParam.split(',').filter(Boolean);
  }

  // Parse month
  const monthParam = params.get('month');
  if (monthParam) {
    filterState.month = monthParam;
  }

  // Parse search
  const searchParam = params.get('search');
  if (searchParam) {
    filterState.search = searchParam;
  }

  // Load post data from embedded JSON
  const dataElement = document.getElementById('blog-posts-data');
  if (dataElement && dataElement.textContent) {
    try {
      allPosts = JSON.parse(dataElement.textContent);
    } catch (e) {
      console.error('Failed to parse blog posts data:', e);
    }
  }

  // Apply initial filter state to UI
  applyFiltersToUI();

  // Apply filters and render
  applyFilters();
}

// Apply filter state to UI controls
function applyFiltersToUI(): void {
  // Set search input
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  if (searchInput) {
    searchInput.value = filterState.search;
    updateClearSearchButton();
  }

  // Set selected tags
  const tagButtons = document.querySelectorAll('.tag-filter-btn');
  tagButtons.forEach((button) => {
    const tag = button.getAttribute('data-tag');
    if (tag && filterState.tags.includes(tag)) {
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
    }
  });

  // Set selected month
  const monthButtons = document.querySelectorAll('.month-filter-item');
  monthButtons.forEach((button) => {
    const month = button.getAttribute('data-month');
    if (month === filterState.month) {
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
    } else {
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
    }
  });
}

// Update URL with current filter state
function updateURL(): void {
  const params = new URLSearchParams();

  if (filterState.tags.length > 0) {
    params.set('tags', filterState.tags.join(','));
  }

  if (filterState.month) {
    params.set('month', filterState.month);
  }

  if (filterState.search) {
    params.set('search', filterState.search);
  }

  const newURL = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;

  window.history.replaceState({}, '', newURL);
}

// Format month from Date for comparison
function formatMonth(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Create a post element from post data
function createPostElement(post: BlogPost): HTMLElement {
  const article = document.createElement('article');
  article.className = 'blog-card blog-post-item';
  article.setAttribute('data-tags', post.tags.join(','));
  article.setAttribute('data-month', formatMonth(post.pubDate));
  article.setAttribute('data-title', post.title.toLowerCase());
  article.setAttribute('data-description', post.description.toLowerCase());
  article.setAttribute('data-slug', post.slug);

  const link = document.createElement('a');
  link.href = `/blog/${post.slug}`;
  link.className = 'block group';

  // Title
  const title = document.createElement('h2');
  title.className = 'text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors';
  title.textContent = post.title;
  link.appendChild(title);

  // Meta info (date)
  const meta = document.createElement('div');
  meta.className = 'flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3';

  const time = document.createElement('time');
  time.className = 'blog-date';
  time.setAttribute('datetime', post.pubDate);
  time.textContent = formatDate(post.pubDate);
  meta.appendChild(time);

  link.appendChild(meta);

  // Description
  const description = document.createElement('p');
  description.className = 'text-gray-700 dark:text-gray-300 mb-4';
  description.textContent = post.description;
  link.appendChild(description);

  // Tags
  if (post.tags.length > 0) {
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'flex flex-wrap gap-2';

    post.tags.forEach((tag) => {
      const tagSpan = document.createElement('span');
      tagSpan.className = 'blog-tag';
      tagSpan.textContent = tag;
      tagsContainer.appendChild(tagSpan);
    });

    link.appendChild(tagsContainer);
  }

  article.appendChild(link);
  return article;
}

// Filter posts based on current filter state
function applyFilters(): void {
  currentPage = 1; // Reset to first page

  filteredPosts = allPosts.filter((post) => {
    // Tag filter: AND logic (must have all selected tags)
    const tagMatch = filterState.tags.length === 0 ||
      filterState.tags.every(tag => post.tags.includes(tag));

    // Month filter: exact match
    const monthMatch = !filterState.month || formatMonth(post.pubDate) === filterState.month;

    // Search filter: case-insensitive in title, description, or tags
    const searchMatch = !filterState.search ||
      post.title.toLowerCase().includes(filterState.search.toLowerCase()) ||
      post.description.toLowerCase().includes(filterState.search.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(filterState.search.toLowerCase()));

    return tagMatch && monthMatch && searchMatch;
  });

  // Render filtered posts
  renderPosts();

  // Update UI
  updateResultsCount();
  updateActiveFilters();
  updateURL();
}

// Render posts (paginated)
function renderPosts(): void {
  const container = document.getElementById('blog-posts-container');
  if (!container) return;

  // Clear container
  container.innerHTML = '';

  // Calculate posts to show
  const postsToShow = filteredPosts.slice(0, currentPage * POSTS_PER_PAGE);

  if (postsToShow.length === 0) {
    // Show no results message
    showNoResults();
    return;
  }

  // Create document fragment for better performance
  const fragment = document.createDocumentFragment();

  postsToShow.forEach((post) => {
    fragment.appendChild(createPostElement(post));
  });

  container.appendChild(fragment);

  // Update pagination UI
  updatePagination();
  hideNoResults();
}

// Show more posts (next page)
function showMorePosts(): void {
  currentPage++;
  renderPosts();
}

// Update pagination UI
function updatePagination(): void {
  const showMoreContainer = document.getElementById('show-more-container');
  const paginationInfo = document.getElementById('pagination-info');

  if (!showMoreContainer || !paginationInfo) return;

  const displayedCount = Math.min(currentPage * POSTS_PER_PAGE, filteredPosts.length);
  const hasMore = displayedCount < filteredPosts.length;

  if (hasMore) {
    showMoreContainer.classList.remove('hidden');
    paginationInfo.textContent = `Showing ${displayedCount} of ${filteredPosts.length} posts`;
  } else {
    showMoreContainer.classList.add('hidden');
  }
}

// Update results count display
function updateResultsCount(): void {
  const resultsCountElement = document.getElementById('results-count');
  if (resultsCountElement) {
    const totalCount = allPosts.length;
    const displayedCount = Math.min(currentPage * POSTS_PER_PAGE, filteredPosts.length);

    if (filteredPosts.length === totalCount) {
      resultsCountElement.textContent = `Showing ${displayedCount} of ${totalCount} posts`;
    } else {
      resultsCountElement.textContent = `Found ${filteredPosts.length} of ${totalCount} posts`;
    }
  }
}

// Show no results message
function showNoResults(): void {
  const noResultsElement = document.getElementById('no-results');
  const postsContainer = document.getElementById('blog-posts-container');
  const showMoreContainer = document.getElementById('show-more-container');

  if (noResultsElement) {
    noResultsElement.classList.remove('hidden');
  }
  if (postsContainer) {
    postsContainer.style.display = 'none';
  }
  if (showMoreContainer) {
    showMoreContainer.classList.add('hidden');
  }
}

// Hide no results message
function hideNoResults(): void {
  const noResultsElement = document.getElementById('no-results');
  const postsContainer = document.getElementById('blog-posts-container');

  if (noResultsElement) {
    noResultsElement.classList.add('hidden');
  }
  if (postsContainer) {
    postsContainer.style.display = '';
  }
}

// Update active filters display
function updateActiveFilters(): void {
  const activeFiltersSection = document.getElementById('active-filters-section');
  const activeFiltersList = document.getElementById('active-filters-list');

  if (!activeFiltersSection || !activeFiltersList) return;

  const hasActiveFilters = filterState.tags.length > 0 || filterState.month || filterState.search;

  if (hasActiveFilters) {
    activeFiltersSection.classList.remove('hidden');

    // Build active filter pills
    const pills: string[] = [];

    // Add tag pills
    filterState.tags.forEach(tag => {
      pills.push(`
        <button class="active-filter-pill" data-filter-type="tag" data-filter-value="${tag}">
          ${tag}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-3 h-3 ml-1">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      `);
    });

    // Add month pill
    if (filterState.month) {
      const activeMonthButton = document.querySelector(`.month-filter-item[data-month="${filterState.month}"]`);
      const monthLabel = activeMonthButton?.querySelector('.month-filter-label')?.textContent?.trim() || filterState.month;
      pills.push(`
        <button class="active-filter-pill" data-filter-type="month" data-filter-value="${filterState.month}">
          ${monthLabel}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-3 h-3 ml-1">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      `);
    }

    // Add search pill
    if (filterState.search) {
      pills.push(`
        <button class="active-filter-pill" data-filter-type="search" data-filter-value="${filterState.search}">
          "${filterState.search}"
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-3 h-3 ml-1">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      `);
    }

    activeFiltersList.innerHTML = pills.join('');

    // Add click handlers to remove individual filters
    activeFiltersList.querySelectorAll('.active-filter-pill').forEach(pill => {
      pill.addEventListener('click', handleRemoveFilter);
    });
  } else {
    activeFiltersSection.classList.add('hidden');
  }
}

// Handle removing individual filters
function handleRemoveFilter(event: Event): void {
  const button = event.currentTarget as HTMLElement;
  const filterType = button.getAttribute('data-filter-type');
  const filterValue = button.getAttribute('data-filter-value');

  if (filterType === 'tag' && filterValue) {
    filterState.tags = filterState.tags.filter(t => t !== filterValue);

    // Update tag button state
    const tagButton = document.querySelector(`.tag-filter-btn[data-tag="${filterValue}"]`);
    if (tagButton) {
      tagButton.classList.remove('active');
      tagButton.setAttribute('aria-pressed', 'false');
    }
  } else if (filterType === 'month') {
    filterState.month = '';

    // Update month buttons - set "All months" as active
    const monthButtons = document.querySelectorAll('.month-filter-item');
    monthButtons.forEach((btn) => {
      const month = btn.getAttribute('data-month');
      if (month === '') {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  } else if (filterType === 'search') {
    filterState.search = '';

    // Update search input
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
      updateClearSearchButton();
    }
  }

  applyFilters();
}

// Handle tag button clicks
function handleTagClick(event: Event): void {
  const button = event.currentTarget as HTMLElement;
  const tag = button.getAttribute('data-tag');

  if (!tag) return;

  const isActive = button.classList.contains('active');

  if (isActive) {
    // Remove tag
    filterState.tags = filterState.tags.filter(t => t !== tag);
    button.classList.remove('active');
    button.setAttribute('aria-pressed', 'false');
  } else {
    // Add tag
    filterState.tags.push(tag);
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
  }

  applyFilters();
}

// Handle month button click
function handleMonthClick(event: Event): void {
  const button = event.currentTarget as HTMLElement;
  const month = button.getAttribute('data-month') || '';

  // Update all month buttons
  const monthButtons = document.querySelectorAll('.month-filter-item');
  monthButtons.forEach((btn) => {
    btn.classList.remove('active');
    btn.setAttribute('aria-pressed', 'false');
  });

  // Set active state
  button.classList.add('active');
  button.setAttribute('aria-pressed', 'true');

  filterState.month = month;
  applyFilters();
}

// Handle search input with debouncing
function handleSearchInput(event: Event): void {
  const input = event.target as HTMLInputElement;

  updateClearSearchButton();

  if (searchDebounceTimer !== null) {
    clearTimeout(searchDebounceTimer);
  }

  searchDebounceTimer = window.setTimeout(() => {
    filterState.search = input.value.trim();
    applyFilters();
  }, 300);
}

// Update clear search button visibility
function updateClearSearchButton(): void {
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const clearButton = document.getElementById('clear-search');

  if (searchInput && clearButton) {
    if (searchInput.value) {
      clearButton.classList.remove('hidden');
    } else {
      clearButton.classList.add('hidden');
    }
  }
}

// Handle clear search button
function handleClearSearch(): void {
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  if (searchInput) {
    searchInput.value = '';
    filterState.search = '';
    updateClearSearchButton();
    applyFilters();
  }
}

// Handle clear all filters
function handleClearAllFilters(): void {
  // Reset filter state
  filterState = {
    tags: [],
    month: '',
    search: '',
  };

  // Reset UI
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  if (searchInput) {
    searchInput.value = '';
    updateClearSearchButton();
  }

  const tagButtons = document.querySelectorAll('.tag-filter-btn');
  tagButtons.forEach(button => {
    button.classList.remove('active');
    button.setAttribute('aria-pressed', 'false');
  });

  // Reset month buttons - set "All months" as active
  const monthButtons = document.querySelectorAll('.month-filter-item');
  monthButtons.forEach(button => {
    const month = button.getAttribute('data-month');
    if (month === '') {
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
    } else {
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
    }
  });

  applyFilters();
}

// Handle load more tags button
function handleLoadMoreTags(): void {
  const hiddenTags = document.getElementById('hidden-tags');
  const loadMoreBtn = document.getElementById('load-more-tags');
  const tagFilterContainer = document.querySelector('.tag-filter-container');

  if (hiddenTags && loadMoreBtn && tagFilterContainer) {
    // Move all hidden tags to the visible container
    const hiddenButtons = hiddenTags.querySelectorAll('.tag-filter-btn');
    hiddenButtons.forEach(button => {
      tagFilterContainer.appendChild(button);
      button.addEventListener('click', handleTagClick);
    });

    // Hide the load more button and remove hidden container
    loadMoreBtn.style.display = 'none';
    hiddenTags.remove();
  }
}

// Setup event listeners
function setupEventListeners(): void {
  // Tag buttons (both visible and hidden initially)
  const tagButtons = document.querySelectorAll('.tag-filter-btn');
  tagButtons.forEach(button => {
    button.addEventListener('click', handleTagClick);
  });

  // Month buttons
  const monthButtons = document.querySelectorAll('.month-filter-item');
  monthButtons.forEach(button => {
    button.addEventListener('click', handleMonthClick);
  });

  // Search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearchInput);
  }

  // Clear search button
  const clearSearchButton = document.getElementById('clear-search');
  if (clearSearchButton) {
    clearSearchButton.addEventListener('click', handleClearSearch);
  }

  // Clear all filters button
  const clearAllButton = document.getElementById('clear-all-filters');
  if (clearAllButton) {
    clearAllButton.addEventListener('click', handleClearAllFilters);
  }

  // Clear filters from no results section
  const clearFiltersNoResults = document.getElementById('clear-filters-no-results');
  if (clearFiltersNoResults) {
    clearFiltersNoResults.addEventListener('click', handleClearAllFilters);
  }

  // Show more button
  const showMoreBtn = document.getElementById('show-more-btn');
  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', showMorePosts);
  }

  // Load more tags button
  const loadMoreTagsBtn = document.getElementById('load-more-tags');
  if (loadMoreTagsBtn) {
    loadMoreTagsBtn.addEventListener('click', handleLoadMoreTags);
  }

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    initializeFilters();
  });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeFilters();
    setupEventListeners();
  });
} else {
  initializeFilters();
  setupEventListeners();
}
