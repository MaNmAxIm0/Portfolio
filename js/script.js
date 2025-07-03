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
} from '../js/firebase.js';

import { TabManager } from '../modules/tab-manager.js';
import { TopicManager } from '../modules/topic-manager.js';
import { ItemManager } from '../modules/item-manager.js';
import { ItemRenderer } from '../modules/item-renderer.js';
import { ItemFormHandler } from '../modules/item-form-handler.js';
import { TooltipHandler } from '../modules/tooltip-handler.js';
import { SearchManager } from '../modules/search-manager.js';
import { UIUtils } from '../modules/ui-utils.js';

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
  const tooltipHandler = new TooltipHandler(uiUtils);
  const itemFormHandler = new ItemFormHandler(() => currentTabId);
  const itemRenderer = new ItemRenderer(uiUtils, tooltipHandler, itemFormHandler);
  const itemManager = new ItemManager(() => currentTabId, itemRenderer, itemFormHandler);
  const topicManager = new TopicManager(currentTabId, itemManager, uiUtils);
  const tabManager = new TabManager(tabs, currentTabId, tabList, tabContent, topicManager, uiUtils);
  const searchManager = new SearchManager();

  // Set up manager dependencies
  itemFormHandler.setItemManager(itemManager);
  topicManager.setCurrentTabIdGetter(() => currentTabId);

  // Initialize search functionality (assign tabManager before calling initialize)
  searchManager.setTabManager(tabManager);
  searchManager.initialize();

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
