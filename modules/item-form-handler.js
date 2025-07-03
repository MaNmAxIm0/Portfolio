import { addItem, updateItem } from '../js/firebase.js';

export class ItemFormHandler {
  constructor(getCurrentTabId) {
    this.getCurrentTabId = getCurrentTabId;
    this.itemManager = null;
  }

  setItemManager(itemManager) {
    this.itemManager = itemManager;
  }

  toggleEditForm(item, listItem, itemRenderer) {
    const existingForm = listItem.querySelector('.item-form');
    if (existingForm) {
      existingForm.remove();
      return;
    }

    const editForm = document.createElement('div');
    editForm.classList.add('item-form');
    editForm.innerHTML = `
      <div class="form-group">
        <label for="edit-item-title-${item.id}">Título:</label>
        <input type="text" id="edit-item-title-${item.id}" name="edit-item-title" value="${item.title}">
      </div>
      <div class="form-group">
        <label for="edit-item-link-${item.id}">Link:</label>
        <input type="text" id="edit-item-link-${item.id}" name="edit-item-link" value="${item.link}">
      </div>
      <div class="form-group">
        <label for="edit-item-fonte-${item.id}">Fonte:</label>
        <input type="text" id="edit-item-fonte-${item.id}" name="edit-item-fonte" value="${item.fonte || ''}">
      </div>
      <div class="form-group">
        <label for="edit-item-description-${item.id}">Explicação:</label>
        <textarea id="edit-item-description-${item.id}" name="edit-item-description">${item.description || ''}</textarea>
      </div>
      <button id="save-edit-button-${item.id}">✓</button>
    `;
    editForm.querySelector(`#save-edit-button-${item.id}`).addEventListener('click', async () => {
      const newTitle = editForm.querySelector(`#edit-item-title-${item.id}`).value.trim();
      const newLink = editForm.querySelector(`#edit-item-link-${item.id}`).value.trim();
      const newFonte = editForm.querySelector(`#edit-item-fonte-${item.id}`).value.trim();
      const newDescription = editForm.querySelector(`#edit-item-description-${item.id}`).value.trim();
      
      if (newTitle && newLink) {
        const isTitleUnique = await this.itemManager.validateUniqueTitle(newTitle, item.id);
        if (!isTitleUnique) {
          alert('Já existe um item com este título. Por favor, escolha um título diferente.');
          return;
        }
        const isLinkUnique = await this.itemManager.validateUniqueLink(newLink, item.id);
        if (!isLinkUnique) {
          alert('Já existe um item com este link. Por favor, use um link diferente.');
          return;
        }
        await updateItem(this.getCurrentTabId(), item.id, item.topicId, newTitle, newLink, newFonte, newDescription);

        item.title = newTitle;
        item.link = newLink;
        item.fonte = newFonte;
        item.description = newDescription;

        const newItemElement = itemRenderer.createItemElement(item, this.itemManager);
        listItem.replaceWith(newItemElement);
      } else {
        alert('Por favor, preencha o título e o link.');
      }
    });
    listItem.appendChild(editForm);
  }

  renderAddItemForm(topicId) {
    const itemForm = document.createElement('div');
    itemForm.classList.add('item-form');
    itemForm.innerHTML = `
      <div class="form-group">
        <label for="item-title-${topicId}">Título:</label>
        <input type="text" id="item-title-${topicId}" name="item-title">
      </div>
      <div class="form-group">
        <label for="item-link-${topicId}">Link:</label>
        <input type="text" id="item-link-${topicId}" name="item-link">
      </div>
      <div class="form-group">
        <label for="item-fonte-${topicId}">Fonte:</label>
        <input type="text" id="item-fonte-${topicId}" name="item-fonte">
      </div>
      <div class="form-group">
        <label for="item-description-${topicId}">Explicação:</label>
        <textarea id="item-description-${topicId}" name="item-description"></textarea>
      </div>
      <button id="save-item-button-${topicId}">✓</button>
    `;
    itemForm.querySelector(`#save-item-button-${topicId}`).addEventListener('click', async () => {
      const title = document.getElementById(`item-title-${topicId}`).value.trim();
      const link = document.getElementById(`item-link-${topicId}`).value.trim();
      const fonte = document.getElementById(`item-fonte-${topicId}`).value.trim();
      const description = document.getElementById(`item-description-${topicId}`).value.trim() || '';
      
      if (title && link) {
        const isTitleUnique = await this.itemManager.validateUniqueTitle(title);
        if (!isTitleUnique) {
          alert('Já existe um item com este título. Por favor, escolha um título diferente.');
          return;
        }
        const isLinkUnique = await this.itemManager.validateUniqueLink(link);
        if (!isLinkUnique) {
          alert('Já existe um item com este link. Por favor, use um link diferente.');
          return;
        }
        const newItemId = await addItem(this.getCurrentTabId(), topicId, title, link, fonte, description);

        document.getElementById(`item-title-${topicId}`).value = '';
        document.getElementById(`item-link-${topicId}`).value = '';
        document.getElementById(`item-fonte-${topicId}`).value = '';
        document.getElementById(`item-description-${topicId}`).value = '';

        const topicElement = document.querySelector(`.topic[data-topic-id="${topicId}"]`);
        const itemList = topicElement.querySelector('.item-list');
        const newItem = { id: newItemId, title, link, fonte, description, topicId, order: itemList.children.length };

        const { ItemRenderer } = await import('./item-renderer.js');
        const { UIUtils } = await import('./ui-utils.js');
        const { TooltipHandler } = await import('./tooltip-handler.js');
        const uiUtils = new UIUtils();
        const tooltipHandler = new TooltipHandler(uiUtils);
        const itemRenderer = new ItemRenderer(uiUtils, tooltipHandler, this);

        const listItem = itemRenderer.createItemElement(newItem, this.itemManager);
        itemList.appendChild(listItem);
      } else {
        alert('Por favor, preencha o título e o link.');
      }
    });
    return itemForm;
  }
}

