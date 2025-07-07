import { getItems, deleteItem, updateItemOrder, getAllItems } from '../js/firebase.js';

export class ItemManager {
  constructor(getCurrentTabId, itemRenderer, itemFormHandler) {
    this.getCurrentTabId = getCurrentTabId;
    this.itemRenderer = itemRenderer;
    this.itemFormHandler = itemFormHandler;
  }

  createItemList(topicId) {
    const itemList = document.createElement('ul');
    itemList.classList.add('item-list');
    itemList.dataset.topicId = topicId;
    const loadingPromise = this.loadItemsForList(itemList, topicId);
    return { itemList, loadingPromise };
  }

  async loadItemsForList(itemList, topicId) {
    const items = await getItems(this.getCurrentTabId(), topicId);
    itemList.innerHTML = '';
    items.forEach(item => {
      const listItem = this.itemRenderer.createItemElement(item, this);
      itemList.appendChild(listItem);
    });
    Sortable.create(itemList, {
      group: 'items',
      animation: 150,
      handle: '.drag-handle',
      onEnd: async (evt) => {
        await this.updateAllItemOrders();
      }
    });
  }

  async deleteCurrentItem(itemId) {
    const confirmDelete = confirm('Tem certeza que deseja excluir este item?');
    if (confirmDelete) {
      await deleteItem(this.getCurrentTabId(), itemId);
      const itemElement = document.querySelector(`li[data-item-id="${itemId}"]`);
      if (itemElement) itemElement.remove();
    }
  }

  async validateUniqueTitle(title, currentItemId = null) {
    const allItems = await getAllItems();
    for (const item of allItems) {
      if (currentItemId && item.id === currentItemId) continue;
      if (item.title.toLowerCase().trim() === title.toLowerCase().trim()) {
        return false;
      }
    }
    return true;
  }

  async validateUniqueLink(link, currentItemId = null) {
    const allItems = await getAllItems();
    for (const item of allItems) {
      if (currentItemId && item.id === currentItemId) continue;
      if (item.link.toLowerCase().trim() === link.toLowerCase().trim()) {
        return false;
      }
    }
    return true;
  }

  renderItemForm(topicId) {
    return this.itemFormHandler.renderAddItemForm(topicId);
  }

  async updateAllItemOrders() {
    const itemLists = document.querySelectorAll('.item-list');
    const promises = [];
    itemLists.forEach(list => {
      const newTopicId = list.dataset.topicId;
      Array.from(list.children).forEach((child, index) => {
        const itemId = child.dataset.itemId;
        if (itemId) { 
            promises.push(updateItemOrder(itemId, newTopicId, index));
        }
      });
    });
    await Promise.all(promises);
  }
}
