// Browser extension to focus on search inputs with keyboard shortcut

// Add CSS for the glow effect
const style = document.createElement('style');
style.textContent = `
  .search-focus-glow {
    position: relative;
    animation: neonPulse 2s ease-in-out;
    outline: none;
  }
  
  .search-focus-glow::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(
      45deg,
      #ff00ff,
      #9d00ff,
      #ff00ff,
      #9d00ff
    );
    background-size: 400% 400%;
    animation: rotateGradient 2s linear infinite;
    z-index: -1;
    border-radius: 4px;
  }
  
  .search-focus-glow::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: inherit;
    border-radius: 2px;
    z-index: -1;
  }
  
  @keyframes rotateGradient {
    0% {
      background-position: 0% 0%;
    }
    25% {
      background-position: 100% 0%;
    }
    50% {
      background-position: 100% 100%;
    }
    75% {
      background-position: 0% 100%;
    }
    100% {
      background-position: 0% 0%;
    }
  }

  @keyframes neonPulse {
    0% {
      box-shadow: 
        0 0 5px #ff00ff,
        0 0 10px #ff00ff,
        0 0 15px #9d00ff;
    }
    50% {
      box-shadow: 
        0 0 10px #ff00ff,
        0 0 20px #ff00ff,
        0 0 30px #9d00ff;
    }
    100% {
      box-shadow: 
        0 0 5px #ff00ff,
        0 0 10px #ff00ff,
        0 0 15px #9d00ff;
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
      // Add glow effect class
      searchInput.classList.add('search-focus-glow');
      
      // Remove the class after animation completes using animationend event
      const removeGlow = () => {
        searchInput.classList.remove('search-focus-glow');
        searchInput.removeEventListener('animationend', removeGlow);
      };
      searchInput.addEventListener('animationend', removeGlow);
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
    'form[action*="query" i] input[type="text"]',
    
    // Common wrapper patterns
    '[class*="search"] input',
    '[id*="search"] input',
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
    'input[name="search_query"]',
    'input[name="searchQuery"]',
    
    // Framework specific patterns
    // React
    'form[class*="react-search"] input',
    '[class*="react-search"] input',
    '[data-reactroot] input[type="search"]',
    // Angular
    'form.ng-valid input[type="text"]',
    'form[class*="ng-"] input[type="search"]',
    '[class*="ng-search"] input',
    // Vue
    'form[class*="vue-search"] input',
    '[class*="vue-search"] input',
    // Next.js
    '[class*="next-search"] input',
    '[data-nextjs*="search"] input',
    // Svelte
    '[class*="svelte-search"] input',
    // Generic framework
    'form[class*="search"] input',
    'form[data-*="search"] input',
    // Common UI frameworks
    '[class*="ant-input-search"] input',  // Ant Design
    '[class*="mui-search"] input',        // Material-UI
    '[class*="bootstrap-search"] input',  // Bootstrap
    '[class*="chakra-search"] input',     // Chakra UI
    '[class*="tailwind-search"] input',   // Tailwind
    '[class*="bulma-search"] input'       // Bulma
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
