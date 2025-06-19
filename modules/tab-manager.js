import { getTabs, addTab, updateTab, deleteTab, updateTabOrder } from '../js/firebase.js';

export class TabManager {
  constructor(tabs, currentTabId, tabList, tabContent, topicManager, uiUtils) {
    this.tabs = tabs;
    this.currentTabId = currentTabId;
    this.tabList = tabList;
    this.tabContent = tabContent;
    this.topicManager = topicManager;
    this.uiUtils = uiUtils;
    this.onTabChange = null;
  }

  async loadTabs() {
    this.tabs = await getTabs();
    this.tabList.innerHTML = '';
    
    this.tabs.forEach(tab => {
      const listItem = this.createTabElement(tab);
      this.tabList.appendChild(listItem);
    });

    this.addPlusButton();

    if (this.tabs.length > 0) {
      if (!this.currentTabId) this.currentTabId = this.tabs[0].id;
      this.showTab(this.currentTabId);
    } else {
      this.tabContent.innerHTML = '<p>Nenhuma aba encontrada. Clique no botão "+" para criar uma nova aba.</p>';
    }
  }

  createTabElement(tab) {
    const listItem = document.createElement('li');
    listItem.dataset.tabId = tab.id;
    
    const tabContainer = document.createElement('div');
    tabContainer.classList.add('tab-container');
    if (tab.id === this.currentTabId) tabContainer.classList.add('active');
    
    const tabButton = document.createElement('button');
    tabButton.classList.add('tab-button');
    tabButton.textContent = tab.name;
    tabButton.addEventListener('click', async () => {
      if (tab.id === this.currentTabId) {
        this.enableTabNameEditing(tab, tabButton);
      } else {
        this.showTab(tab.id);
      }
    });
    tabContainer.appendChild(tabButton);
    
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('tab-delete-button');
    deleteButton.textContent = 'X';
    deleteButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.deleteCurrentTab(tab.id);
    });
    tabContainer.appendChild(deleteButton);

    listItem.appendChild(tabContainer);
    return listItem;
  }

  addPlusButton() {
    const addTabLi = document.createElement('li');
    addTabLi.classList.add('no-drag');
    const addTabButton = document.createElement('button');
    addTabButton.textContent = '+';
    addTabButton.id = 'add-tab-button';
    addTabButton.addEventListener('click', async () => {
      await this.addNewTab();
    });
    addTabLi.appendChild(addTabButton);
    this.tabList.appendChild(addTabLi);
  }

  async showTab(tabId) {
    this.currentTabId = tabId;
    if (this.onTabChange) this.onTabChange(tabId);
    
    this.tabList.querySelectorAll('li[data-tab-id]').forEach(li => {
      const container = li.querySelector('.tab-container');
      if (li.dataset.tabId === tabId) {
        container.classList.add('active');
      } else {
        container.classList.remove('active');
      }
    });
    
    this.tabContent.innerHTML = '<div class="loading">Carregando conteúdo...</div>';
    const topicsContainer = await this.topicManager.renderTopics(tabId);
    this.tabContent.innerHTML = '';
    this.tabContent.appendChild(topicsContainer);
  }

  enableTabNameEditing(tab, tabButton) {
    const container = tabButton.parentElement;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = tab.name;
    input.style.backgroundColor = 'lightblue';
    input.style.border = '1px solid red';
    input.style.fontSize = '1em';
    input.style.width = `${input.value.length + 1}ch`;

    input.addEventListener('input', () => {
      input.style.width = `${input.value.length + 1}ch`;
    });

    const saveName = async () => {
      const newName = input.value.trim();
      if (newName && newName !== tab.name) {
        await updateTab(tab.id, newName);
        tab.name = newName;
      }
      const newButton = document.createElement('button');
      newButton.classList.add('tab-button');
      newButton.textContent = newName;
      newButton.addEventListener('click', async () => {
        if (tab.id === this.currentTabId) {
          this.enableTabNameEditing(tab, newButton);
        } else {
          this.showTab(tab.id);
        }
      });
      container.replaceChild(newButton, input);
    };

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveName();
      }
    });
    input.addEventListener('blur', saveName);

    container.replaceChild(input, tabButton);
    input.focus();
  }

  async deleteCurrentTab(tabId) {
    const confirmDelete = confirm('Tem certeza que deseja excluir esta aba?');
    if (confirmDelete) {
      await deleteTab(tabId);
      const li = this.tabList.querySelector(`[data-tab-id="${tabId}"]`);
      if (li) li.remove();
      this.tabs = this.tabs.filter(t => t.id !== tabId);
      if (this.currentTabId === tabId) {
        if (this.tabs.length > 0) {
          this.currentTabId = this.tabs[0].id;
          this.showTab(this.currentTabId);
        } else {
          this.tabContent.innerHTML = '<p>Nenhuma aba encontrada. Clique no botão "+" para criar uma nova aba.</p>';
          this.currentTabId = null;
        }
      }
    }
  }

  async addNewTab() {
    const defaultName = "Nova aba";
    const newOrder = this.tabs.length;
    const newTabId = await addTab(defaultName, newOrder);
    const newTab = { id: newTabId, name: defaultName, order: newOrder };
    this.tabs.push(newTab);
    this.currentTabId = newTabId;
    
    const addTabLi = this.tabList.querySelector('li.no-drag');
    const listItem = this.createTabElement(newTab);
    this.tabList.insertBefore(listItem, addTabLi);
    this.showTab(newTabId);
    
    setTimeout(() => {
      const tabButton = listItem.querySelector('.tab-button');
      this.enableTabNameEditing(newTab, tabButton);
    }, 300);
  }

  async updateTabOrder() {
    const children = Array.from(this.tabList.children).filter(child => child.dataset.tabId);
    for (let i = 0; i < children.length; i++) {
      const tabId = children[i].dataset.tabId;
      await updateTabOrder(tabId, i);
    }
  }
}
