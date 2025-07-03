export class ItemRenderer {
  constructor(uiUtils, tooltipHandler, itemFormHandler) {
    this.uiUtils = uiUtils;
    this.tooltipHandler = tooltipHandler;
    this.itemFormHandler = itemFormHandler;
  }

  createItemElement(item, itemManager) {
    if (this.uiUtils.isMobile()) {
      return this.createMobileItemElement(item, itemManager);
    } else {
      return this.createDesktopItemElement(item, itemManager);
    }
  }

  createMobileItemElement(item, itemManager) {
    const li = document.createElement('li');
    li.dataset.itemId = item.id;
    li.classList.add('item');
    li.style.padding = '12px 15px';
    li.style.gap = '8px';

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

    const questionSpan = this.tooltipHandler.createTooltip(item);
    titleLinkContainer.appendChild(questionSpan);

    li.appendChild(titleLinkContainer);

    const middleDiv = document.createElement('div');
    middleDiv.style.display = 'flex';
    middleDiv.style.justifyContent = 'space-between';
    middleDiv.style.alignItems = 'center';
    middleDiv.style.width = '100%';
    middleDiv.style.marginLeft = '15px';

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

    const controlsDiv = this.createItemControls(item, li, itemManager);
    middleDiv.appendChild(controlsDiv);
    li.appendChild(middleDiv);

    return li;
  }

  createDesktopItemElement(item, itemManager) {
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

    const explanationButton = this.tooltipHandler.createTooltip(item);
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
    rightControls.appendChild(this.createItemControls(item, listItem, itemManager));

    listItem.appendChild(leftContent);
    listItem.appendChild(rightControls);

    return listItem;
  }
  
  createItemControls(item, listItem, itemManager) {
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
      this.itemFormHandler.toggleEditForm(item, listItem, this);
    });
    itemOptions.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.textContent = 'X';
    deleteButton.addEventListener('click', (event) => {
      event.stopPropagation();
      itemManager.deleteCurrentItem(item.id);
    });
    itemOptions.appendChild(deleteButton);

    if (this.uiUtils.isMobile()) {
      controlsDiv.appendChild(itemOptions);
      return controlsDiv;
    } else {
      return itemOptions;
    }
  }
}

