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

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Firebase
  await initializeFirebase();

  const tabList = document.getElementById('tab-list');
  const tabContent = document.getElementById('tab-content');

  let tabs = [];
  let currentTabId = null;
  let sortable;
  let topicSortable;
  const isMobile = window.innerWidth <= 768;

  // Helper: Extract domain from a URL and remove "www." if present.
  function extractDomain(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (error) {
      return url.replace(/^www\./, '');
    }
  }

  // Delete Topic
  async function deleteCurrentTopic(topicId) {
    const confirmDelete = confirm('Tem certeza que deseja excluir este tópico?');
    if (confirmDelete) {
      await deleteTopic(topicId);
      const topicElement = document.querySelector(`.topic[data-topic-id="${topicId}"]`);
      if (topicElement) topicElement.remove();
    }
  }

  // Delete Item
  async function deleteCurrentItem(itemId) {
    const confirmDelete = confirm('Tem certeza que deseja excluir este item?');
    if (confirmDelete) {
      await deleteItem(currentTabId, itemId);
      const itemElement = document.querySelector(`li[data-item-id="${itemId}"]`);
      if (itemElement) itemElement.remove();
    }
  }

  // Create Item Element (mobile and desktop layouts)
  function createItemElement(item) {
    if (window.innerWidth <= 768) {
      // Mobile layout
      const li = document.createElement('li');
      li.dataset.itemId = item.id;
      li.classList.add('item');

      // Container para título e link
      const titleLinkContainer = document.createElement('div');
      titleLinkContainer.style.display = 'flex';
      titleLinkContainer.style.gap = '8px';
      titleLinkContainer.style.alignItems = 'center';
      titleLinkContainer.style.marginBottom = '8px';

      const titleSpan = document.createElement('span');
      titleSpan.classList.add('item-title');
      titleSpan.textContent = item.title;
      titleLinkContainer.appendChild(titleSpan);

      const mainLink = document.createElement('a');
      mainLink.classList.add('item-link');
      mainLink.href = item.link;
      mainLink.target = '_blank';
      mainLink.textContent = extractDomain(item.link);
      titleLinkContainer.appendChild(mainLink);

      li.appendChild(titleLinkContainer);

      // Container para explicação e fonte
      const middleDiv = document.createElement('div');
      middleDiv.classList.add('item-middle');

      // Container para explicação
      const explanationDiv = document.createElement('div');
      explanationDiv.classList.add('item-description-container');

      const questionSpan = document.createElement('span');
      questionSpan.classList.add('item-description');
      questionSpan.textContent = '?';
      const tooltip = document.createElement('div');
      tooltip.classList.add('tooltip');
      tooltip.textContent = item.description || 'Sem descrição';
      questionSpan.appendChild(tooltip);
      explanationDiv.appendChild(questionSpan);

      middleDiv.appendChild(explanationDiv);

      // Container para fonte
      const fonteDiv = document.createElement('div');
      fonteDiv.classList.add('item-fonte-container');

      const fonteLink = document.createElement('a');
      fonteLink.classList.add('item-source');
      fonteLink.target = '_blank';
      if (item.fonte) {
        fonteLink.href = item.fonte;
        fonteLink.textContent = extractDomain(item.fonte);
      } else {
        fonteLink.textContent = '';
      }
      fonteDiv.appendChild(fonteLink);
      middleDiv.appendChild(fonteDiv);

      li.appendChild(middleDiv);

      // Controles: arrastar, editar e eliminar
      const controlsDiv = document.createElement('div');
      controlsDiv.classList.add('item-controls');

      const dragHandle = document.createElement('span');
      dragHandle.classList.add('drag-handle');
      dragHandle.innerHTML = `<svg width="16" height="16" viewBox="0 0 4 16" xmlns="http://www.w3.org/2000/svg">
        <circle cx="2" cy="2" r="2"/>
        <circle cx="2" cy="8" r="2"/>
        <circle cx="2" cy="14" r="2"/>
      </svg>`;
      controlsDiv.appendChild(dragHandle);

      const editButton = document.createElement('button');
      editButton.classList.add('edit-button');
      editButton.textContent = 'Editar';
      editButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleEditForm(item, li);
      });
      controlsDiv.appendChild(editButton);

      const deleteButton = document.createElement('button');
      deleteButton.classList.add('delete-button');
      deleteButton.textContent = 'X';
      deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        deleteCurrentItem(item.id);
      });
      controlsDiv.appendChild(deleteButton);

      li.appendChild(controlsDiv);

      return li;
    } else {
      // Desktop layout: nos desktops o título fica à esquerda e, imediatamente à direita, um container com:
      // o link, o botão de explicação e, à direita deste, a fonte.
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
      detailsContainer.style.gap = '8px';

      const mainLink = document.createElement('a');
      mainLink.classList.add('item-link');
      mainLink.target = '_blank';
      mainLink.href = item.link;
      mainLink.textContent = extractDomain(item.link);
      detailsContainer.appendChild(mainLink);

      const explanationButton = document.createElement('span');
      explanationButton.classList.add('item-description');
      explanationButton.textContent = '?';
      const tooltip = document.createElement('div');
      tooltip.classList.add('tooltip');
      tooltip.textContent = item.description || 'Sem descrição';
      explanationButton.appendChild(tooltip);
      detailsContainer.appendChild(explanationButton);

      const fonteLink = document.createElement('a');
      fonteLink.classList.add('item-source');
      fonteLink.target = '_blank';
      if (item.fonte) {
        fonteLink.href = item.fonte;
        fonteLink.textContent = extractDomain(item.fonte);
      } else {
        fonteLink.textContent = '';
      }
      detailsContainer.appendChild(fonteLink);

      leftContent.appendChild(detailsContainer);

      const rightControls = document.createElement('div');
      rightControls.classList.add('item-right-controls');

      const dragHandle = document.createElement('span');
      dragHandle.classList.add('drag-handle');
      dragHandle.innerHTML = `<svg width="16" height="16" viewBox="0 0 4 16" xmlns="http://www.w3.org/2000/svg">
        <circle cx="2" cy="2" r="2"/>
        <circle cx="2" cy="8" r="2"/>
        <circle cx="2" cy="14" r="2"/>
      </svg>`;
      rightControls.appendChild(dragHandle);

      const itemOptions = document.createElement('div');
      itemOptions.classList.add('item-options');

      const editButton = document.createElement('button');
      editButton.classList.add('edit-button');
      editButton.textContent = 'Editar';
      editButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleEditForm(item, listItem);
      });
      itemOptions.appendChild(editButton);

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'X';
      deleteButton.classList.add('delete-button');
      deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        deleteCurrentItem(item.id);
      });
      itemOptions.appendChild(deleteButton);
      rightControls.appendChild(itemOptions);

      listItem.appendChild(leftContent);
      listItem.appendChild(rightControls);

      return listItem;
    }
  }

  // Create Topic Element with adjusted drag button placement
  function createTopicElement(topic) {
    const topicElement = document.createElement('div');
    topicElement.classList.add('topic');
    topicElement.dataset.topicId = topic.id;

    const topicHeader = document.createElement('div');
    topicHeader.classList.add('topic-header');

    const topicName = document.createElement('div');
    topicName.classList.add('topic-name');
    topicName.textContent = topic.name;
    topicName.ondblclick = (e) => {
      e.stopPropagation();
      enableTopicNameEditing(topic, topicName);
    };

    const topicTitleContainer = document.createElement('div');
    topicTitleContainer.classList.add('topic-title-container');
    topicTitleContainer.appendChild(topicName);

    const topicDragHandle = document.createElement('span');
    topicDragHandle.classList.add('topic-drag-handle');
    topicDragHandle.innerHTML = `<svg width="16" height="16" viewBox="0 0 4 16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="2" cy="2" r="2"/>
      <circle cx="2" cy="8" r="2"/>
      <circle cx="2" cy="14" r="2"/>
    </svg>`;
    topicDragHandle.addEventListener('click', (e) => { e.stopPropagation(); });
    topicTitleContainer.appendChild(topicDragHandle);

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('topic-delete-button');
    deleteButton.textContent = 'X';
    deleteButton.onclick = (e) => {
      e.stopPropagation();
      deleteCurrentTopic(topic.id);
    };

    topicHeader.appendChild(topicTitleContainer);
    topicHeader.appendChild(deleteButton);

    topicHeader.onclick = () => {
      const content = topicElement.querySelector('.topic-content');
      if (content.style.display === 'none') {
        content.style.display = 'block';
        topicElement.classList.remove('collapsed');
      } else {
        content.style.display = 'none';
        topicElement.classList.add('collapsed');
      }
    };

    topicElement.appendChild(topicHeader);

    const topicContent = document.createElement('div');
    topicContent.classList.add('topic-content');
    topicContent.style.display = 'none';
    topicElement.classList.add('collapsed');

    const itemList = document.createElement('ul');
    itemList.classList.add('item-list');
    itemList.dataset.topicId = topic.id;

    getItems(currentTabId, topic.id).then(items => {
      items.forEach(item => {
        const listItem = createItemElement(item);
        itemList.appendChild(listItem);
      });
      Sortable.create(itemList, {
        group: 'items',
        animation: 150,
        handle: '.drag-handle',
        onEnd: async function(evt) {
          await updateAllItemOrders();
        }
      });
    });

    topicContent.appendChild(itemList);
    topicContent.appendChild(renderItemForm(topic.id));
    topicElement.appendChild(topicContent);

    return topicElement;
  }

  // Update only the affected item in the DOM after editing
  function toggleEditForm(item, listItem) {
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
      const newTitle = editForm.querySelector('#edit-item-title').value;
      const newLink = editForm.querySelector('#edit-item-link').value;
      const newFonte = editForm.querySelector('#edit-item-fonte').value;
      const newDescription = editForm.querySelector('#edit-item-description').value;
      if (newTitle && newLink) {
        await updateItem(currentTabId, item.id, item.topicId, newTitle, newLink, newFonte, newDescription);
        listItem.querySelector('.item-title').textContent = newTitle;
        const mainLink = listItem.querySelector('a.item-link');
        mainLink.href = newLink;
        mainLink.textContent = extractDomain(newLink);
        listItem.querySelector('.tooltip').textContent = newDescription || 'Sem descrição';
        const fonteLink = listItem.querySelector('a.item-source');
        fonteLink.href = newFonte;
        fonteLink.textContent = newFonte ? extractDomain(newFonte) : '';
        editForm.remove();
      } else {
        alert('Por favor, preencha o título e o link.');
      }
    });
    listItem.appendChild(editForm);
  }

  function enableTabNameEditing(tab, tabButton) {
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
        if (tab.id === currentTabId) {
          enableTabNameEditing(tab, newButton);
        } else {
          showTab(tab.id);
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

  async function deleteCurrentTab(tabId) {
    const confirmDelete = confirm('Tem certeza que deseja excluir esta aba?');
    if (confirmDelete) {
      await deleteTab(tabId);
      const li = tabList.querySelector(`[data-tab-id="${tabId}"]`);
      if (li) li.remove();
      tabs = tabs.filter(t => t.id !== tabId);
      if (currentTabId === tabId) {
        if (tabs.length > 0) {
          currentTabId = tabs[0].id;
          showTab(currentTabId);
        } else {
          tabContent.innerHTML = '<p>Nenhuma aba encontrada. Clique no botão "+" para criar uma nova aba.</p>';
          currentTabId = null;
        }
      }
    }
  }

  async function addNewTab() {
    const defaultName = "Nova aba";
    const newOrder = tabs.length;
    const newTabId = await addTab(defaultName, newOrder);
    const newTab = { id: newTabId, name: defaultName, order: newOrder };
    tabs.push(newTab);
    currentTabId = newTabId;
    const addTabLi = tabList.querySelector('li.no-drag');
    const listItem = document.createElement('li');
    listItem.dataset.tabId = newTabId;
    const tabContainer = document.createElement('div');
    tabContainer.classList.add('tab-container', 'active');
    const tabButton = document.createElement('button');
    tabButton.classList.add('tab-button');
    tabButton.textContent = defaultName;
    tabButton.addEventListener('click', async () => {
      if (newTabId === currentTabId) {
        enableTabNameEditing(newTab, tabButton);
      } else {
        showTab(newTabId);
      }
    });
    tabContainer.appendChild(tabButton);
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('tab-delete-button');
    deleteButton.textContent = 'X';
    deleteButton.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteCurrentTab(newTabId);
    });
    tabContainer.appendChild(deleteButton);
    listItem.appendChild(tabContainer);
    tabList.insertBefore(listItem, addTabLi);
    showTab(newTabId);
    setTimeout(() => {
      enableTabNameEditing(newTab, tabButton);
    }, 300);
  }

  async function showTab(tabId) {
    currentTabId = tabId;
    tabList.querySelectorAll('li[data-tab-id]').forEach(li => {
      const container = li.querySelector('.tab-container');
      if (li.dataset.tabId === tabId) {
        container.classList.add('active');
      } else {
        container.classList.remove('active');
      }
    });
    tabContent.innerHTML = '<div class="loading">Carregando conteúdo...</div>';
    const topicsContainer = await renderTopics(tabId);
    tabContent.innerHTML = '';
    tabContent.appendChild(topicsContainer);
  }

  async function loadTabs() {
    tabs = await getTabs();
    tabList.innerHTML = '';
    tabs.forEach(tab => {
      const listItem = document.createElement('li');
      listItem.dataset.tabId = tab.id;
      const tabContainer = document.createElement('div');
      tabContainer.classList.add('tab-container');
      if (tab.id === currentTabId) tabContainer.classList.add('active');
      const tabButton = document.createElement('button');
      tabButton.classList.add('tab-button');
      tabButton.textContent = tab.name;
      tabButton.addEventListener('click', async () => {
        if (tab.id === currentTabId) {
          enableTabNameEditing(tab, tabButton);
        } else {
          showTab(tab.id);
        }
      });
      tabContainer.appendChild(tabButton);
      const deleteButton = document.createElement('button');
      deleteButton.classList.add('tab-delete-button');
      deleteButton.textContent = 'X';
      deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        deleteCurrentTab(tab.id);
      });
      tabContainer.appendChild(deleteButton);

      listItem.appendChild(tabContainer);
      tabList.appendChild(listItem);
    });
    const addTabLi = document.createElement('li');
    addTabLi.classList.add('no-drag');
    const addTabButton = document.createElement('button');
    addTabButton.textContent = '+';
    addTabButton.id = 'add-tab-button';
    addTabButton.addEventListener('click', async () => {
      await addNewTab();
    });
    addTabLi.appendChild(addTabButton);
    tabList.appendChild(addTabLi);

    if (tabs.length > 0) {
      if (!currentTabId) currentTabId = tabs[0].id;
      showTab(currentTabId);
    } else {
      tabContent.innerHTML = '<p>Nenhuma aba encontrada. Clique no botão "+" para criar uma nova aba.</p>';
    }
  }

  async function renderTopics(tabId) {
    const topics = await getTopics(tabId);
    const topicsContainer = document.createElement('div');
    topicsContainer.id = 'topics-container';
    topics.forEach(topic => {
      const topicElement = createTopicElement(topic);
      topicsContainer.appendChild(topicElement);
    });
    const addTopicButton = document.createElement('button');
    addTopicButton.id = 'add-topic-button';
    addTopicButton.textContent = '+';
    addTopicButton.onclick = () => addNewTopic(tabId);
    topicsContainer.appendChild(addTopicButton);
    topicSortable = Sortable.create(topicsContainer, {
      handle: '.topic-drag-handle',
      animation: 150,
      onEnd: async function(evt) {
        const topicElements = Array.from(topicsContainer.querySelectorAll('.topic'));
        for (let i = 0; i < topicElements.length; i++) {
          const topicId = topicElements[i].dataset.topicId;
          await updateTopicOrder(topicId, i);
        }
      }
    });
    return topicsContainer;
  }

  function enableTopicNameEditing(topic, topicNameElement) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = topic.name;
    input.classList.add('topic-name-input');
    input.style.width = `${input.value.length + 1}ch`;
    input.addEventListener('input', () => {
      input.style.width = `${input.value.length + 1}ch`;
    });
    const saveName = async () => {
      const newName = input.value.trim();
      if (newName && newName !== topic.name) {
        await updateTopic(topic.id, newName);
        topic.name = newName;
      }
      const newDiv = document.createElement('div');
      newDiv.classList.add('topic-name');
      newDiv.textContent = newName;
      newDiv.ondblclick = (e) => {
        e.stopPropagation();
        enableTopicNameEditing(topic, newDiv);
      };
      input.parentElement.replaceChild(newDiv, input);
    };
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveName();
      }
    });
    input.addEventListener('blur', saveName);
    topicNameElement.parentElement.replaceChild(input, topicNameElement);
    input.focus();
  }

  async function addNewTopic(tabId) {
    const defaultName = "Novo tópico";
    const topics = await getTopics(tabId);
    const newOrder = topics.length;
    const newTopicId = await addTopic(tabId, defaultName, newOrder);
    const newTopic = { id: newTopicId, name: defaultName, order: newOrder, tabId };
    const topicsContainer = document.getElementById('topics-container');
    if (topicsContainer) {
      const addTopicButton = document.getElementById('add-topic-button');
      const newTopicElement = createTopicElement(newTopic);
      topicsContainer.insertBefore(newTopicElement, addTopicButton);
      const topicNameElement = newTopicElement.querySelector('.topic-name');
      setTimeout(() => {
        enableTopicNameEditing(newTopic, topicNameElement);
      }, 300);
    }
  }

  async function updateAllItemOrders() {
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

  function renderItemForm(topicId) {
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
      const title = document.getElementById(`item-title-${topicId}`).value;
      const link = document.getElementById(`item-link-${topicId}`).value;
      const fonte = document.getElementById(`item-fonte-${topicId}`).value;
      const description = document.getElementById(`item-description-${topicId}`).value || '';
      if (title && link) {
        const newItemId = await addItem(currentTabId, topicId, title, link, fonte, description);
        document.getElementById(`item-title-${topicId}`).value = '';
        document.getElementById(`item-link-${topicId}`).value = '';
        document.getElementById(`item-fonte-${topicId}`).value = '';
        document.getElementById(`item-description-${topicId}`).value = '';
        const topicElement = document.querySelector(`.topic[data-topic-id="${topicId}"]`);
        const itemList = topicElement.querySelector('.item-list');
        const newItem = { id: newItemId, title, link, fonte, description, topicId, order: itemList.children.length };
        const listItem = createItemElement(newItem);
        itemList.appendChild(listItem);
      } else {
        alert('Por favor, preencha o título e o link.');
      }
    });
    return itemForm;
  }

  await loadTabs();

  const isMobileScreen = window.innerWidth <= 768;
  sortable = Sortable.create(tabList, {
    filter: '.no-drag',
    ghostClass: 'sortable-ghost',
    disabled: isMobileScreen,
    onEnd: async function(evt) {
      const children = Array.from(tabList.children).filter(child => child.dataset.tabId);
      for (let i = 0; i < children.length; i++) {
        const tabId = children[i].dataset.tabId;
        await updateTabOrder(tabId, i);
      }
    }
  });
});
