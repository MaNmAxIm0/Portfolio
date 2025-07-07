import { addItem, updateItem } from '../js/firebase.js';
import { UIUtils } from './ui-utils.js';

export class ItemFormHandler {
  constructor(getCurrentTabId, uiUtils) {
    this.getCurrentTabId = getCurrentTabId;
    this.itemManager = null;
    this.uiUtils = uiUtils;
    this.debounceTimers = {};
  }

  setItemManager(itemManager) {
    this.itemManager = itemManager;
  }

  _setupRealtimeValidation(inputElement, validationFunction, errorMessage, itemId = null) {
    inputElement.addEventListener('input', () => {
      clearTimeout(this.debounceTimers[inputElement.id]);
      this.debounceTimers[inputElement.id] = setTimeout(async () => {
        const value = inputElement.value.trim();
        if (value) {
          const isUnique = await validationFunction(value, itemId);
          if (!isUnique) {
            this.uiUtils.showInputError(inputElement, errorMessage);
          } else {
            this.uiUtils.clearInputError(inputElement);
          }
        } else {
          this.uiUtils.clearInputError(inputElement);
        }
      }, 500);
    });
  }

  toggleEditForm(item, listItem, itemRenderer) {
    const existingForm = listItem.querySelector('.item-form');
    if (existingForm) {
      existingForm.remove();
      return;
    }

    const editForm = document.createElement('div');
    editForm.classList.add('item-form', 'edit-form');
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
    
    const titleInput = editForm.querySelector(`#edit-item-title-${item.id}`);
    const linkInput = editForm.querySelector(`#edit-item-link-${item.id}`);

    this._setupRealtimeValidation(
      titleInput,
      (title, id) => this.itemManager.validateUniqueTitle(title, id),
      'Já existe um item com este título.',
      item.id
    );

    this._setupRealtimeValidation(
      linkInput,
      (link, id) => this.itemManager.validateUniqueLink(link, id),
      'Já existe um item com este link.',
      item.id
    );

    editForm.querySelector(`#save-edit-button-${item.id}`).addEventListener('click', async () => {
      this.uiUtils.clearInputError(titleInput);
      this.uiUtils.clearInputError(linkInput);

      const newTitle = titleInput.value.trim();
      const newLink = linkInput.value.trim();
      const newFonte = editForm.querySelector(`#edit-item-fonte-${item.id}`).value.trim();
      const newDescription = editForm.querySelector(`#edit-item-description-${item.id}`).value.trim();
      
      if (!newTitle) {
        this.uiUtils.showInputError(titleInput, 'O título não pode estar vazio.');
      }
      if (!newLink) {
        this.uiUtils.showInputError(linkInput, 'O link não pode estar vazio.');
      }
      if (!newTitle || !newLink) {
        return;
      }
      
      const isTitleUnique = await this.itemManager.validateUniqueTitle(newTitle, item.id);
      if (!isTitleUnique) {
        this.uiUtils.showInputError(titleInput, 'Já existe um item com este título.');
        return;
      }
      const isLinkUnique = await this.itemManager.validateUniqueLink(newLink, item.id);
      if (!isLinkUnique) {
        this.uiUtils.showInputError(linkInput, 'Já existe um item com este link.');
        return;
      }

      await updateItem(this.getCurrentTabId(), item.id, item.topicId, newTitle, newLink, newFonte, newDescription);

      item.title = newTitle;
      item.link = newLink;
      item.fonte = newFonte;
      item.description = newDescription;

      const newItemElement = itemRenderer.createItemElement(item, this.itemManager);
      listItem.replaceWith(newItemElement);
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

    const titleInput = itemForm.querySelector(`#item-title-${topicId}`);
    const linkInput = itemForm.querySelector(`#item-link-${topicId}`);

    this._setupRealtimeValidation(
      titleInput,
      (title) => this.itemManager.validateUniqueTitle(title),
      'Já existe um item com este título.'
    );

    this._setupRealtimeValidation(
      linkInput,
      (link) => this.itemManager.validateUniqueLink(link),
      'Já existe um item com este link.'
    );

    itemForm.querySelector(`#save-item-button-${topicId}`).addEventListener('click', async () => {
      this.uiUtils.clearInputError(titleInput);
      this.uiUtils.clearInputError(linkInput);

      const title = titleInput.value.trim();
      const link = linkInput.value.trim();
      const fonte = itemForm.querySelector(`#item-fonte-${topicId}`).value.trim();
      const description = itemForm.querySelector(`#item-description-${topicId}`).value.trim() || '';
      
      if (!title) {
        this.uiUtils.showInputError(titleInput, 'O título não pode estar vazio.');
      }
      if (!link) {
        this.uiUtils.showInputError(linkInput, 'O link não pode estar vazio.');
      }
      if (!title || !link) {
        return;
      }

      const isTitleUnique = await this.itemManager.validateUniqueTitle(title);
      if (!isTitleUnique) {
        this.uiUtils.showInputError(titleInput, 'Já existe um item com este título.');
        return;
      }
      const isLinkUnique = await this.itemManager.validateUniqueLink(link);
      if (!isLinkUnique) {
        this.uiUtils.showInputError(linkInput, 'Já existe um item com este link.');
        return;
      }
      
      const newItemId = await addItem(this.getCurrentTabId(), topicId, title, link, fonte, description);

      titleInput.value = '';
      linkInput.value = '';
      itemForm.querySelector(`#item-fonte-${topicId}`).value = '';
      itemForm.querySelector(`#item-description-${topicId}`).value = '';

      this.uiUtils.clearInputError(titleInput);
      this.uiUtils.clearInputError(linkInput);

      const topicElement = document.querySelector(`.topic[data-topic-id="${topicId}"]`);
      const itemList = topicElement.querySelector('.item-list');
      const newItem = { id: newItemId, title, link, fonte, description, topicId, order: itemList.children.length };

      const listItem = this.itemManager.itemRenderer.createItemElement(newItem, this.itemManager);
      itemList.appendChild(listItem);
    });
    return itemForm;
  }
}
