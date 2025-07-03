import { getAllItems } from '../js/firebase.js';

export class SearchManager {
  constructor() {
    this.currentSearchTerm = '';
    this.tabManager = null;
    this.secretSequence = 'bia';
    this.debounceTimer = null;
    this._hasSecretCodeBeenActivated = false; 
  }

  setTabManager(tabManager) {
    this.tabManager = tabManager;
  }

  initialize() {
    const searchInput = document.getElementById('search-input');
    const clearSearch = document.getElementById('clear-search');

    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();

      
      if (this.secretSequence.startsWith(term) && term.length < this.secretSequence.length) {
        clearTimeout(this.debounceTimer);
        this.currentSearchTerm = term;
        clearSearch.style.display = term ? 'block' : 'none';
        return;
      }

      
      if (term === this.secretSequence) {
        if (!this._hasSecretCodeBeenActivated) {
            this._hasSecretCodeBeenActivated = true; 
            this.tabManager.showSecretTab(); 
        }
        this.tabManager.showTab('secret-tab'); 
        
        
        this.currentSearchTerm = term; 
        clearSearch.style.display = 'block'; 
        return; 
      }

      
      this.currentSearchTerm = term;
      clearSearch.style.display = term ? 'block' : 'none';
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.filterContent();
      }, 200);
    });

    clearSearch.addEventListener('click', () => {
      searchInput.value = '';
      this.currentSearchTerm = '';
      
      this.filterContent(); 
      clearSearch.style.display = 'none';
    });
  }

  async filterContent() {
    const searchTerm = this.currentSearchTerm;
    const tabContent = document.getElementById('tab-content');
    let noResultsMsg = document.getElementById('no-results-message');

    if (!searchTerm) {
      if (noResultsMsg) noResultsMsg.remove();
      
      document.querySelectorAll('.topic').forEach(topic => {
        topic.style.display = '';
        topic.querySelectorAll('.item-list li').forEach(itemEl => {
          itemEl.style.display = '';
        });
      });
      return;
    }

    
    const allItems = await getAllItems(); 
    
    
    const filteredItemIds = new Set(allItems.filter(item => {
      const term = searchTerm;
      return (item.title || '').toLowerCase().includes(term) ||
             (item.link || '').toLowerCase().includes(term) ||
             (item.description || '').toLowerCase().includes(term) ||
             (item.fonte || '').toLowerCase().includes(term);
    }).map(item => item.id));

    
    if (filteredItemIds.size > 0) {
      const counts = {};
      allItems.forEach(item => { 
        if (filteredItemIds.has(item.id)) { 
          counts[item.tabId] = (counts[item.tabId] || 0) + 1;
        }
      });

      const targetTabId = Object.keys(counts).reduce((a, b) =>
        counts[a] >= counts[b] ? a : b
      );
      if (this.tabManager.currentTabId !== targetTabId) {
        await this.tabManager.showTab(targetTabId);
      }
    }

    noResultsMsg = document.getElementById('no-results-message');
    let hasContentOnCurrentTab = false; 

    
    document.querySelectorAll('.topic').forEach(topic => {
      let hasVisibleItemsInTopic = false;
      topic.querySelectorAll('.item-list li').forEach(itemEl => {
        const itemId = itemEl.dataset.itemId;
        const visible = filteredItemIds.has(itemId); 
        
        itemEl.style.display = visible ? '' : 'none';
        if (visible) {
          hasVisibleItemsInTopic = true;
          hasContentOnCurrentTab = true; 
        }
      });

      
      if (hasVisibleItemsInTopic) {
        topic.style.display = 'block';
        const content = topic.querySelector('.topic-content'); 
        if (content) {
          content.style.display = 'block'; 
          topic.classList.remove('collapsed');
        }
      } else {
        topic.style.display = 'none';
      }
    });

    
    if (!hasContentOnCurrentTab) {
      if (!noResultsMsg) {
        const msg = document.createElement('div');
        msg.id = 'no-results-message';
        msg.textContent = 'Nenhum resultado encontrado.';
        Object.assign(msg.style, {
          textAlign: 'center',
          padding: '20px',
          color: '#666'
        });
        tabContent.appendChild(msg);
      }
    } else if (noResultsMsg) {
      noResultsMsg.remove();
    }
  }
}

