// Browser extension to focus on search inputs with keyboard shortcut

// Add CSS for the pulse effect
const style = document.createElement('style');
style.textContent = `
  .search-focus-pulse {
    animation: searchPulse 0.4s ease-in-out 3;
    outline: none;
  }

  @keyframes searchPulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(157, 0, 255, 0);
    }
    50% {
      box-shadow:
        0 0 8px 2px #ff00ff,
        0 0 16px 4px #9d00ff;
    }
  }
`;

try {
  document.head.appendChild(style);
} catch (error) {
  console.error('Failed to add search shortcut styles:', error);
}

// Content script that runs on web pages
document.addEventListener('keydown', (event) => {
  // Check for Ctrl+K or Cmd+K (common search shortcut)
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault(); // Prevent default browser behavior

    // Try to find search input on the page
    const searchInput = findSearchInput();

    if (searchInput) {
      searchInput.focus();

      searchInput.classList.add('search-focus-pulse');

      const removePulse = () => {
        searchInput.classList.remove('search-focus-pulse');
        searchInput.removeEventListener('animationend', removePulse);
      };
      searchInput.addEventListener('animationend', removePulse);
    }
  }
});

// Function to find search input elements
function findSearchInput(): HTMLElement | null {
  // Try various selectors that commonly identify search inputs
  const selectors = [
    // Standard HTML5 and ARIA patterns
    'input[type="search"]',
    'input[role="search"]',
    'input[role="combobox"]',
    'input[aria-label*="search" i]',
    'input[aria-label*="hae" i]',  // Finnish word for search
    'input[aria-label*="sök" i]',  // Swedish word for search
    'input[aria-label*="suche" i]', // German word for search
    'input[aria-label*="recherche" i]', // French word for search
    'input[aria-label*="buscar" i]', // Spanish word for search
    
    // Common input attributes
    'input[name*="search" i]',
    'input[id*="search" i]',
    'input[class*="search" i]',
    'input[placeholder*="search" i]',
    'input[placeholder*="hae" i]',  // Finnish variant
    'input[placeholder*="etsi" i]', // Finnish variant
    'input[placeholder*="hakusana" i]', // Finnish word for search term
    'input[placeholder*="sök" i]',  // Swedish variant
    'input[placeholder*="suche" i]', // German variant
    'input[placeholder*="recherche" i]', // French variant
    'input[placeholder*="buscar" i]', // Spanish variant
    'input[type="text"][name*="q" i]',
    'input[type="text"][name*="query" i]',
    'input[type="text"][name*="s" i]',
    'input[type="text"][name*="search" i]',
    
    // Common form patterns
    'form[role="search"] input',
    'form[name*="search" i] input',
    'form[class*="search" i] input',
    'form[action*="search" i] input',
    'form[method="get"] input[type="text"]',
    'form[action*="search" i] input[type="text"]',
    'form[action*="/search"] input',
    'form[action*="/haku"] input',  // Finnish search action
    'form[action*="query" i] input[type="text"]',
    'form[name="site-search"] input',
    'form.search-input-form input',
    'form.searchform input',

    // Common wrapper patterns
    '[class*="search"] input',
    '[id*="search"] input',
    '[id*="searchbar"] input',
    '[id*="searchform"] input',
    '[id*="nav-search"] input',
    '[role="search"] input',
    '[class*="search-bar"] input',
    '[class*="searchbox"] input',
    '[class*="search-box"] input',
    '[class*="searchform"] input',
    '[class*="search-form"] input',
    '[class*="searchfield"] input',
    '[class*="search-field"] input',
    
    // Common class names
    '.search-input',
    '.search-field',
    '.search-box',
    '.search-form input',
    '.searchbar input',
    '.search-bar input',
    '.searchbox input',
    '.search-box input',
    '.searchform input',
    '.search-form input',
    '.searchfield input',
    '.search-field input',
    '.form-search-header input',
    '.search-trigger__input',
    '.menu-search button',
    '.form-keyword input',
    '.input-container input[type="text"]',
    '#site-search input',

    // Common data attributes
    '[data-testid*="search" i] input',
    '[data-test*="search" i] input',
    '[data-cy*="search" i] input',  // Cypress testing
    '[data-testid*="query" i] input',
    '[data-test*="query" i] input',
    '[data-cy*="query" i] input',
    
    // Common e-commerce patterns
    'input[name="field-keywords"]',
    'input[name="q"]',
    'input[name="query"]',
    'input[name="search_query"]',
    'input[name="searchTerm"]',
    'input[name="searchterm"]',
    'input[name="searchQuery"]',
    'input[name="s"]',  // WordPress search
    'input[name="keyword"]',

    // Button and icon patterns
    'button[aria-label*="search" i]',
    'button[aria-label*="hae" i]',
    'svg[icon-name*="search"] ~ input',
    'label:has(svg[icon-name*="search"]) input',

    // Finnish-specific patterns
    'input[aria-label="Haku"]',

    // Generic and UI framework patterns
    'form[class*="search"] input',
    '[class*="ant-input-search"] input'  // Ant Design
  ];

  // First try to find visible search inputs
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const htmlElement = element as HTMLElement;
      if (htmlElement && isElementVisible(htmlElement)) {
        return htmlElement;
      }
    }
  }

  // If no visible search input is found, return the first match
  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) return element;
  }

  return null;
}

// Helper function to check if an element is visible
function isElementVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         element.offsetWidth > 0 &&
         element.offsetHeight > 0;
}
