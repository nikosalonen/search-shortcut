// Browser extension to focus on search inputs with keyboard shortcut

// Content script that runs on web pages
document.addEventListener('keydown', (event) => {
  // Check for Ctrl+K or Cmd+K (common search shortcut)
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault(); // Prevent default browser behavior

    // Try to find search input on the page
    const searchInput = findSearchInput();

    if (searchInput) {
      searchInput.focus();
    }

  }
});

// Function to find search input elements
function findSearchInput(): HTMLElement | null {
  // Try various selectors that commonly identify search inputs
  const selectors = [
    'input[type="search"]',
    'input[name="search"]',
    'input[id*="search"]',
    'input[class*="search"]',
    'input[placeholder*="search" i]',
    'input[aria-label*="search" i]',
    'form[role="search"] input[type="text"]',
    'input[role="combobox"]',
    'input[aria-label*="hae" i]',  // Finnish word for search
    'input[placeholder*="hae" i]',  // Finnish variant
    '.search-input',  // Common class name for search inputs
    '.form-search-header input',  // Parent container pattern
    '#site-search input',  // Common ID pattern
    'form.search-input-form input',  // Form with search-specific class
    'input[name="field-keywords"]',  // Common on e-commerce sites
    'form[name="site-search"] input',  // Forms specifically named for site search
    '[id*="searchbar"] input',  // Common ID pattern for search containers
    '[id*="nav-search"] input',  // Common navigation search pattern
    'form.ng-valid input[type="text"]'  // Angular forms with validation classes
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) return element;
  }

  return null;
}
