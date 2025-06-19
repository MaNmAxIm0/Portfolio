import {
  initializeFirebase, 
  getTabs,
  addTab,
  updateTab,
  deleteTab,
  getItems,
  addItem,
  updateItem,
  deleteItem,
  updateTabOrder,
  getTopics,
  addTopic,
  updateTopic,
  deleteTopic,
  updateTopicOrder,
  updateItemOrder
} from './firebase.js';

import { TabManager } from './modules/tab-manager.js';
import { TopicManager } from './modules/topic-manager.js';
import { ItemManager } from './modules/item-manager.js';
import { SearchManager } from './modules/search-manager.js';
import { UIUtils } from './modules/ui-utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Firebase
  await initializeFirebase();

  const tabList = document.getElementById('tab-list');
  const tabContent = document.getElementById('tab-content');

  let tabs = [];
  let currentTabId = null;
  let sortable;
  let topicSortable;

  // Initialize managers
  const uiUtils = new UIUtils();
  const itemManager = new ItemManager(currentTabId, uiUtils);
  const topicManager = new TopicManager(currentTabId, itemManager, uiUtils);
  const tabManager = new TabManager(tabs, currentTabId, tabList, tabContent, topicManager, uiUtils);
  const searchManager = new SearchManager();

  // Set up manager dependencies
  itemManager.setCurrentTabIdGetter(() => currentTabId);
  topicManager.setCurrentTabIdGetter(() => currentTabId);
  
  // Initialize search functionality
  searchManager.initialize();
  searchManager.setTabManager(tabManager);

  // Load initial tabs
  await tabManager.loadTabs();

  // Initialize tab sorting (disabled on mobile)
  const isMobileScreen = window.innerWidth <= 768;
  sortable = Sortable.create(tabList, {
    filter: '.no-drag',
    ghostClass: 'sortable-ghost',
    disabled: isMobileScreen,
    onEnd: async function(evt) {
      await tabManager.updateTabOrder();
    }
  });

  // Update current tab reference when it changes
  tabManager.onTabChange = (newTabId) => {
    currentTabId = newTabId;
  };
});
