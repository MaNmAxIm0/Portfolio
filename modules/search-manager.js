export class SearchManager {
  constructor() {
    this.currentSearchTerm = '';
    this.tabManager = null;
  }

  setTabManager(tabManager) {
    this.tabManager = tabManager;
  }

  initialize() {
    const searchInput = document.getElementById('search-input');
    const clearSearch = document.getElementById('clear-search');

    searchInput.addEventListener('input', (e) => {
      this.currentSearchTerm = e.target.value.toLowerCase().trim();
      this.filterContentAndSwitchTab();
      clearSearch.style.display = this.currentSearchTerm ? 'block' : 'none';
    });

    clearSearch.addEventListener('click', () => {
      searchInput.value = '';
      this.currentSearchTerm = '';
      this.filterContent();
      clearSearch.style.display = 'none';
    });
  }

  async filterContentAndSwitchTab() {
    if (!this.currentSearchTerm || !this.tabManager) {
      this.filterContent();
      return;
    }

    // Count matches in each tab
    const tabCounts = await this.countMatchesInAllTabs();
    
    // Find tab with most matches
    let bestTabId = null;
    let maxCount = 0;
    
    for (const [tabId, count] of Object.entries(tabCounts)) {
      if (count > maxCount) {
        maxCount = count;
        bestTabId = tabId;
      }
    }

    // Switch to best tab if it has matches and is different from current
    if (bestTabId && maxCount > 0 && bestTabId !== this.tabManager.currentTabId) {
      await this.tabManager.showTab(bestTabId);
    }

    // Filter content in current tab
    this.filterContent();
  }

  async countMatchesInAllTabs() {
    const tabs = this.tabManager.tabs;
    const counts = {};
    
    for (const tab of tabs) {
      counts[tab.id] = await this.countMatchesInTab(tab.id);
    }
    
    return counts;
  }

  async countMatchesInTab(tabId) {
    // Import getTopics and getItems dynamically to avoid circular imports
    const { getTopics, getItems } = await import('../firebase.js');
    
    const topics = await getTopics(tabId);
    let totalMatches = 0;
    
    for (const topic of topics) {
      const items = await getItems(tabId, topic.id);
      
      for (const item of items) {
        const title = (item.title || '').toLowerCase();
        const link = (item.link || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        const fonte = (item.fonte || '').toLowerCase();
        
        if (title.includes(this.currentSearchTerm) || 
            link.includes(this.currentSearchTerm) || 
            description.includes(this.currentSearchTerm) ||
            fonte.includes(this.currentSearchTerm)) {
          totalMatches++;
        }
      }
    }
    
    return totalMatches;
  }

  filterContent() {
    const topics = document.querySelectorAll('.topic');
    let hasVisibleContent = false;

    topics.forEach(topic => {
      const items = topic.querySelectorAll('.item-list li');
      let hasVisibleItems = false;

      items.forEach(item => {
        const titleElement = item.querySelector('.item-title');
        const linkElement = item.querySelector('.item-link');
        const tooltipElement = item.querySelector('.tooltip div');
        const sourceElement = item.querySelector('.item-source');
        
        const title = titleElement ? titleElement.textContent.toLowerCase() : '';
        const link = linkElement ? linkElement.textContent.toLowerCase() : '';
        const description = tooltipElement ? tooltipElement.textContent.toLowerCase() : '';
        const fonte = sourceElement ? sourceElement.textContent.toLowerCase() : '';
        
        if (!this.currentSearchTerm || 
            title.includes(this.currentSearchTerm) || 
            link.includes(this.currentSearchTerm) ||
            description.includes(this.currentSearchTerm) ||
            fonte.includes(this.currentSearchTerm)) {
          item.style.display = '';
          hasVisibleItems = true;
          hasVisibleContent = true;
        } else {
          item.style.display = 'none';
        }
      });

      if (!this.currentSearchTerm || hasVisibleItems) {
        topic.style.display = '';
        if (this.currentSearchTerm && hasVisibleItems) {
          // Auto-expand topics with matching items
          const content = topic.querySelector('.topic-content');
          content.style.display = 'block';
          topic.classList.remove('collapsed');
        }
      } else {
        topic.style.display = 'none';
      }
    });

    // Show message if no results found
    const tabContent = document.getElementById('tab-content');
    let noResultsMsg = document.getElementById('no-results-message');
    if (this.currentSearchTerm && !hasVisibleContent) {
      if (!noResultsMsg) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.id = 'no-results-message';
        noResultsMsg.textContent = 'Nenhum resultado encontrado.';
        noResultsMsg.style.textAlign = 'center';
        noResultsMsg.style.padding = '20px';
        noResultsMsg.style.color = '#666';
        tabContent.appendChild(noResultsMsg);
      }
    } else if (noResultsMsg) {
      noResultsMsg.remove();
    }
  }
}
