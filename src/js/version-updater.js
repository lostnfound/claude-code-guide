// Version configuration and updater
export const VERSION_CONFIG = {
  // API endpoints for checking latest versions
  sources: {
    'claude-code': {
      api: 'https://api.npms.io/v2/package/claude-code',
      selector: '.claude-version',
      extract: (data) => data.collected.metadata.version
    },
    'node': {
      api: 'https://nodejs.org/dist/index.json',
      selector: '.node-version',
      extract: (data) => {
        // Get latest LTS version
        const lts = data.find(v => v.lts);
        return lts ? lts.version : data[0].version;
      }
    },
    'homebrew': {
      api: 'https://formulae.brew.sh/api/formula/homebrew.json',
      selector: '.homebrew-version',
      extract: (data) => data.versions.stable
    },
    'git-windows': {
      api: 'https://api.github.com/repos/git-for-windows/git/releases/latest',
      selector: '.git-windows-version',
      extract: (data) => data.tag_name.replace('v', '')
    },
    'npm': {
      api: 'https://registry.npmjs.org/npm',
      selector: '.npm-version',
      extract: (data) => data['dist-tags'].latest
    }
  },
  
  // Cache duration (24 hours)
  cacheTime: 24 * 60 * 60 * 1000,
  
  // Storage key prefix
  storagePrefix: 'version_cache_'
};

// Check if cached version is still valid
function isCacheValid(timestamp) {
  return Date.now() - timestamp < VERSION_CONFIG.cacheTime;
}

// Get version from cache
function getCachedVersion(key) {
  const cached = localStorage.getItem(VERSION_CONFIG.storagePrefix + key);
  if (!cached) return null;
  
  const { version, timestamp } = JSON.parse(cached);
  if (isCacheValid(timestamp)) {
    return version;
  }
  return null;
}

// Save version to cache
function setCachedVersion(key, version) {
  localStorage.setItem(VERSION_CONFIG.storagePrefix + key, JSON.stringify({
    version,
    timestamp: Date.now()
  }));
}

// Fetch latest version from API
async function fetchLatestVersion(key, config) {
  try {
    const response = await fetch(config.api);
    if (!response.ok) throw new Error('API request failed');
    
    const data = await response.json();
    const version = config.extract(data);
    
    setCachedVersion(key, version);
    return version;
  } catch (error) {
    console.error(`Failed to fetch ${key} version:`, error);
    return null;
  }
}

// Update version in DOM
function updateVersionInDOM(selector, version) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    // Handle different element types
    if (el.tagName === 'SPAN' && el.classList.contains('output')) {
      // Terminal output examples
      const text = el.textContent;
      el.textContent = text.replace(/v?\d+\.\d+\.\d+(\.\w+\.\d+)?/, version);
    } else if (el.classList.contains('result-desc')) {
      // Result description examples
      const text = el.textContent;
      el.textContent = text.replace(/v?\d+\.\d+\.\d+(\.\w+\.\d+)?/, version);
    }
  });
}

// Initialize version updater
export async function initVersionUpdater() {
  // Only run on guide and FAQ pages
  if (!window.location.pathname.includes('/guide.html') && 
      !window.location.pathname.includes('/faq.html')) {
    return;
  }
  
  // Check and update each version
  for (const [key, config] of Object.entries(VERSION_CONFIG.sources)) {
    // Try cache first
    let version = getCachedVersion(key);
    
    // If no cache or expired, fetch new version
    if (!version) {
      version = await fetchLatestVersion(key, config);
    }
    
    // Update DOM if version found
    if (version) {
      updateVersionInDOM(config.selector, version);
    }
  }
}

// Manual update function for development
export async function forceUpdateVersions() {
  // Clear cache
  Object.keys(VERSION_CONFIG.sources).forEach(key => {
    localStorage.removeItem(VERSION_CONFIG.storagePrefix + key);
  });
  
  // Re-run updater
  await initVersionUpdater();
}