import { getItems, addItem, updateItem, deleteItem, updateItemOrder } from 'modules/firebase.js';

export class ItemManager {
  constructor(currentTabId, uiUtils) {
    this.currentTabId = currentTabId;
    this.uiUtils = uiUtils;
    this.getCurrentTabId = null; 
  }

  setCurrentTabIdGetter(getter) {
    this.getCurrentTabId = getter;
  }
 
  createItemList(topicId) {
    const itemList = document.createElement('ul');
    itemList.classList.add('item-list');
    itemList.dataset.topicId = topicId;

    getItems(this.getCurrentTabId(), topicId).then(items => {
      items.forEach(item => {
        const listItem = this.createItemElement(item);
        itemList.appendChild(listItem);
      });
      Sortable.create(itemList, {
        group: 'items',
        animation: 150,
        handle: '.drag-handle',
        onEnd: async function(evt) {
          await this.updateAllItemOrders();
        }.bind(this)
      });
    });

    return itemList;
  }

  createItemElement(item) {
    if (this.uiUtils.isMobile()) {
      return this.createMobileItemElement(item);
    } else {
      return this.createDesktopItemElement(item);
    }
  }

  createMobileItemElement(item) {
    const li = document.createElement('li');
    li.dataset.itemId = item.id;
    li.classList.add('item');
    li.style.padding = '12px 15px';
    li.style.gap = '8px';

    // Linha 1: Título + Link + Explicação
    const titleLinkContainer = document.createElement('div');
    titleLinkContainer.style.display = 'flex';
    titleLinkContainer.style.gap = '8px';
    titleLinkContainer.style.alignItems = 'center';
    titleLinkContainer.style.marginBottom = '8px';
    titleLinkContainer.style.width = '100%';

    const titleSpan = document.createElement('span');
    titleSpan.classList.add('item-title');
    titleSpan.textContent = item.title;
    titleLinkContainer.appendChild(titleSpan);

    const mainLink = document.createElement('a');
    mainLink.classList.add('item-link');
    mainLink.href = item.link;
    mainLink.target = '_blank';
    mainLink.textContent = this.uiUtils.extractDomain(item.link);
    titleLinkContainer.appendChild(mainLink);

    // Botão de explicação na mesma linha do link
    const questionSpan = this.createMobileTooltip(item);
    titleLinkContainer.appendChild(questionSpan);

    li.appendChild(titleLinkContainer);

    // Linha 2: Fonte + Controles
    const middleDiv = document.createElement('div');
    middleDiv.style.display = 'flex';
    middleDiv.style.justifyContent = 'space-between';
    middleDiv.style.alignItems = 'center';
    middleDiv.style.width = '100%';
    middleDiv.style.marginLeft = '15px';

    // Container fonte
    const fonteContainer = document.createElement('div');
    fonteContainer.style.display = 'flex';
    fonteContainer.style.alignItems = 'center';
    fonteContainer.style.gap = '8px';

    const fonteLink = document.createElement('a');
    fonteLink.classList.add('item-source');
    fonteLink.target = '_blank';
    if (item.fonte) {
      fonteLink.href = item.fonte;
      fonteLink.textContent = this.uiUtils.extractDomain(item.fonte);
    }
    fonteContainer.appendChild(fonteLink);

    middleDiv.appendChild(fonteContainer);

    // Controles
    const controlsDiv = this.createItemControls(item, li);
    middleDiv.appendChild(controlsDiv);
    li.appendChild(middleDiv);

    return li;
  }

  createDesktopItemElement(item) {
    const listItem = document.createElement('li');
    listItem.dataset.itemId = item.id;

    const leftContent = document.createElement('div');
    leftContent.classList.add('item-left');
    leftContent.style.display = 'flex';
    leftContent.style.alignItems = 'center';
    leftContent.style.gap = '10px';

    const titleElement = document.createElement('span');
    titleElement.classList.add('item-title');
    titleElement.textContent = item.title;
    leftContent.appendChild(titleElement);

    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('item-details');
    detailsContainer.style.display = 'flex';
    detailsContainer.style.alignItems = 'center';
    detailsContainer.style.gap = '4px';

    const mainLink = document.createElement('a');
    mainLink.classList.add('item-link');
    mainLink.target = '_blank';
    mainLink.href = item.link;
    mainLink.textContent = this.uiUtils.extractDomain(item.link);
    detailsContainer.appendChild(mainLink);

    const explanationButton = this.createDesktopTooltip(item);
    detailsContainer.appendChild(explanationButton);

    const fonteLink = document.createElement('a');
    fonteLink.classList.add('item-source');
    fonteLink.target = '_blank';
    if (item.fonte) {
      fonteLink.href = item.fonte;
      fonteLink.textContent = this.uiUtils.extractDomain(item.fonte);
    } else {
      fonteLink.textContent = '';
    }
    detailsContainer.appendChild(fonteLink);

    leftContent.appendChild(detailsContainer);

    const rightControls = document.createElement('div');
    rightControls.classList.add('item-right-controls');
    rightControls.appendChild(this.uiUtils.createDragHandle());
    rightControls.appendChild(this.createItemControls(item, listItem));

    listItem.appendChild(leftContent);
    listItem.appendChild(rightControls);

    return listItem;
  }

  createMobileTooltip(item) {
    const questionSpan = document.createElement('span');
    questionSpan.classList.add('item-description');
    questionSpan.textContent = '?';

    const tooltipBackdrop = document.createElement('div');
    tooltipBackdrop.classList.add('tooltip-backdrop');
    document.body.appendChild(tooltipBackdrop);

    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltip');

    const closeButton = document.createElement('button');
    closeButton.classList.add('tooltip-close');
    closeButton.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 1L1 13M1 1l12 12" stroke="#666" stroke-width="2" stroke-linecap="round"/>
    </svg>`;

    const tooltipText = document.createElement('div');
    tooltipText.textContent = item.description || 'Sem descrição';

    tooltip.appendChild(closeButton);
    tooltip.appendChild(tooltipText);
    document.body.appendChild(tooltip);

    const closeTooltip = () => {
      tooltip.classList.remove('active');
      tooltipBackdrop.classList.remove('active');
      questionSpan.classList.remove('active');
    };

    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTooltip();
    });

    tooltipBackdrop.addEventListener('click', closeTooltip);

    questionSpan.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasActive = tooltip.classList.contains('active');
      
      if (wasActive) {
        closeTooltip();
      } else {
        tooltip.classList.add('active');
        tooltipBackdrop.classList.add('active');
        questionSpan.classList.add('active');
      }
    });

    return questionSpan;
  }

  createDesktopTooltip(item) {
    const explanationButton = document.createElement('span');
    explanationButton.classList.add('item-description');
    explanationButton.textContent = '?';
    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltip');
    tooltip.innerHTML = `<div>${item.description || 'Sem descrição'}</div>`;
    explanationButton.appendChild(tooltip);
    return explanationButton;
  }

  createItemControls(item, listItem) {
    const controlsDiv = document.createElement('div');
    controlsDiv.style.display = 'flex';
    controlsDiv.style.gap = '8px';

    if (this.uiUtils.isMobile()) {
      controlsDiv.appendChild(this.uiUtils.createDragHandle());
    }

    const itemOptions = document.createElement('div');
    itemOptions.classList.add('item-options');

    const editButton = document.createElement('button');
    editButton.classList.add('edit-button');
    editButton.textContent = 'Editar';
    editButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.toggleEditForm(item, listItem);
    });
    itemOptions.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.textContent = 'X';
    deleteButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.deleteCurrentItem(item.id);
    });
    itemOptions.appendChild(deleteButton);

    if (this.uiUtils.isMobile()) {
      return controlsDiv.appendChild(itemOptions) && controlsDiv;
    } else {
      return itemOptions;
    }
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
    // Get all topics for current tab
    const { getTopics, getItems } = await import('../firebase.js');
    const topics = await getTopics(this.getCurrentTabId());
    
    // Check all items across all topics in current tab
    for (const topic of topics) {
      const items = await getItems(this.getCurrentTabId(), topic.id);
      for (const item of items) {
        // Skip current item when editing
        if (currentItemId && item.id === currentItemId) continue;
        
        if (item.title.toLowerCase().trim() === title.toLowerCase().trim()) {
          return false;
        }
      }
    }
    return true;
  }

  toggleEditForm(item, listItem) {
    const existingForm = listItem.querySelector('.item-form');
    if (existingForm) {
      existingForm.remove();
      return;
    }

    const editForm = document.createElement('div');
    editForm.classList.add('item-form');
    editForm.innerHTML = `
      <div class="form-group">
        <label for="edit-item-title">Título:</label>
        <input type="text" id="edit-item-title" name="edit-item-title" value="${item.title}">
      </div>
      <div class="form-group">
        <label for="edit-item-link">Link:</label>
        <input type="text" id="edit-item-link" name="edit-item-link" value="${item.link}">
      </div>
      <div class="form-group">
        <label for="edit-item-fonte">Fonte:</label>
        <input type="text" id="edit-item-fonte" name="edit-item-fonte" value="${item.fonte || ''}">
      </div>
      <div class="form-group">
        <label for="edit-item-description">Explicação:</label>
        <textarea id="edit-item-description" name="edit-item-description">${item.description || ''}</textarea>
      </div>
      <button id="save-edit-button">✓</button>
    `;
    editForm.querySelector('#save-edit-button').addEventListener('click', async () => {
      const newTitle = editForm.querySelector('#edit-item-title').value.trim();
      const newLink = editForm.querySelector('#edit-item-link').value;
      const newFonte = editForm.querySelector('#edit-item-fonte').value;
      const newDescription = editForm.querySelector('#edit-item-description').value;
      
      if (newTitle && newLink) {
        // Check for duplicate title (excluding current item)
        const isUnique = await this.validateUniqueTitle(newTitle, item.id);
        if (!isUnique) {
          alert('Já existe um item com este título. Por favor, escolha um título diferente.');
          return;
        }
        
        await updateItem(this.getCurrentTabId(), item.id, item.topicId, newTitle, newLink, newFonte, newDescription);
        listItem.querySelector('.item-title').textContent = newTitle;
        const mainLink = listItem.querySelector('a.item-link');
        mainLink.href = newLink;
        mainLink.textContent = this.uiUtils.extractDomain(newLink);
        listItem.querySelector('.tooltip').textContent = newDescription || 'Sem descrição';
        const fonteLink = listItem.querySelector('a.item-source');
        fonteLink.href = newFonte;
        fonteLink.textContent = newFonte ? this.uiUtils.extractDomain(newFonte) : '';
        editForm.remove();
      } else {
        alert('Por favor, preencha o título e o link.');
      }
    });
    listItem.appendChild(editForm);
  }

  renderItemForm(topicId) {
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
      const link = document.getElementById(`item-link-${topicId}`).value;
      const fonte = document.getElementById(`item-fonte-${topicId}`).value;
      const description = document.getElementById(`item-description-${topicId}`).value || '';
      
      if (title && link) {
        // Check for duplicate title
        const isUnique = await this.validateUniqueTitle(title);
        if (!isUnique) {
          alert('Já existe um item com este título. Por favor, escolha um título diferente.');
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
        const listItem = this.createItemElement(newItem);
        itemList.appendChild(listItem);
      } else {
        alert('Por favor, preencha o título e o link.');
      }
    });
    return itemForm;
  }

  async updateAllItemOrders() {
    const itemLists = document.querySelectorAll('.item-list');
    const promises = [];
    itemLists.forEach(list => {
      const newTopicId = list.dataset.topicId;
      Array.from(list.children).forEach((child, index) => {
        const itemId = child.dataset.itemId;
        promises.push(updateItemOrder(itemId, newTopicId, index));
      });
    });
    await Promise.all(promises);
  }
}
