import { getAllItems } from '../js/firebase.js';

export class SearchManager {
  constructor() {
    this.currentSearchTerm = '';
    this.tabManager = null;
    this.secretSequence = '';
    this.targetSequence = 'bia';
    this.secretTabShown = false;
    this.secretCodeActive = false;
    this.debounceTimer = null;
  }

  setTabManager(tabManager) {
    this.tabManager = tabManager;
  }

  initialize() {
    const searchInput = document.getElementById('search-input');
    const clearSearch = document.getElementById('clear-search');

    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();

      if (this.targetSequence.startsWith(term) && term.length < this.targetSequence.length) {
        return;
      }

      if (term === this.targetSequence) {
        if (!this.secretCodeActive) {
          this.secretCodeActive = true;
          this.tabManager.showSecretTab();
          this.tabManager.showTab('secret-tab');
          this.secretTabShown = true;
        }
        this.currentSearchTerm = '';
        clearSearch.style.display = 'none';
        return;
      }

      if (this.secretCodeActive) {
        this.secretCodeActive = false;
        if (this.secretTabShown) {
          this.tabManager.hideSecretTab();
          this.secretTabShown = false;
        }
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
      this.secretCodeActive = false;
      this.filterContent();
      clearSearch.style.display = 'none';
      if (this.secretTabShown) {
        this.tabManager.hideSecretTab();
        this.secretTabShown = false;
      }
    });
  }

  checkSecretSequence(searchTerm) {
    if (searchTerm === this.targetSequence) {
      if (this.tabManager) {
        this.tabManager.showSecretTab();
        this.secretTabShown = true;
      }
    }
  }

  async filterContent() {
    if (this.secretCodeActive) return;

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
    const matches = allItems.filter(item => {
      const term = searchTerm;
      return (item.title || '').toLowerCase().includes(term) ||
             (item.link || '').toLowerCase().includes(term) ||
             (item.description || '').toLowerCase().includes(term) ||
             (item.fonte || '').toLowerCase().includes(term);
    });

    if (matches.length > 0) {
      const counts = {};
      matches.forEach(item => {
        counts[item.tabId] = (counts[item.tabId] || 0) + 1;
      });
      const targetTabId = Object.keys(counts).reduce((a, b) =>
        counts[a] >= counts[b] ? a : b
      );
      await this.tabManager.showTab(targetTabId);
    }

    let hasVisibleContent = false;
    document.querySelectorAll('.topic').forEach(topic => {
      let hasVisibleItems = false;
      topic.querySelectorAll('.item-list li').forEach(itemEl => {
        const title    = itemEl.querySelector('.item-title')?.textContent.toLowerCase() || '';
        const link     = itemEl.querySelector('.item-link')?.textContent.toLowerCase() || '';
        const desc     = itemEl.querySelector('.tooltip div')?.textContent.toLowerCase() || '';
        const fonte    = itemEl.querySelector('.item-source')?.textContent.toLowerCase() || '';
        const visible = title.includes(searchTerm) ||
                        link.includes(searchTerm) ||
                        desc.includes(searchTerm) ||
                        fonte.includes(searchTerm);
        itemEl.style.display = visible ? '' : 'none';
        if (visible) {
          hasVisibleItems = true;
          hasVisibleContent = true;
        }
      });
      if (hasVisibleItems) {
        topic.style.display = '';
        const content = topic.querySelector('.topic-content');
        if (content) {
          content.style.display = 'block';
          topic.classList.remove('collapsed');
        }
      } else {
        topic.style.display = 'none';
      }
    });

    noResultsMsg = document.getElementById('no-results-message');
    if (matches.length === 0) {
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

