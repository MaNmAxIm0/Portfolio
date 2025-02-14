import { initializeFirebase, getTabs, addTab, updateTab, deleteTab, getItems, addItem, updateItem, deleteItem, updateTabOrder, getTopics, addTopic, updateTopic, deleteTopic, updateTopicOrder } from './firebase.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Firebase
  await initializeFirebase();

  const tabList = document.getElementById('tab-list');
  const tabContent = document.getElementById('tab-content');

  let tabs = [];
  let currentTabId = null;
  let autoEditTabId = null;  // Flag para edição automática da aba recém-criada
  let sortable;
  let currentTopicId = null;
  let autoEditTopicId = null;
  let topicSortable;

  // Renderiza as abas na área de navegação
  function renderTabs() {
    tabList.innerHTML = '';
    tabs.forEach(tab => {
      const listItem = document.createElement('li');
      listItem.dataset.tabId = tab.id;

      const tabContainer = document.createElement('div');
      tabContainer.classList.add('tab-container');
      if (tab.id === currentTabId) {
        tabContainer.classList.add('active');
      }

      const tabButton = document.createElement('button');
      tabButton.classList.add('tab-button');
      tabButton.textContent = tab.name;
      tabButton.addEventListener('click', async () => {
        if (tab.id === currentTabId) {
          // Se a aba já estiver ativa, ativa a edição inline do nome
          enableTabNameEditing(tab, tabButton);
        } else {
          showTab(tab.id);
        }
      });

      tabContainer.appendChild(tabButton);

      // Apenas para a aba ativa, exibe o botão "X" para exclusão
      if (tab.id === currentTabId) {
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('tab-delete-button');
        deleteButton.textContent = 'X';
        deleteButton.addEventListener('click', (event) => {
          event.stopPropagation();
          deleteCurrentTab(tab.id);
        });
        tabContainer.appendChild(deleteButton);
      }

      listItem.appendChild(tabContainer);
      tabList.appendChild(listItem);

      // Se esta aba foi marcada para edição automática, ativa a edição inline após 300ms
      if (autoEditTabId && tab.id === autoEditTabId) {
        setTimeout(() => {
          enableTabNameEditing(tab, tabButton);
          autoEditTabId = null;
        }, 300);
      }
    });

    // Adiciona o botão "+" para criar uma nova aba (não arrastável)
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
  }

  // Renderiza a lista de itens para a aba atual
  function renderItems(items) {
    const itemList = document.createElement('ul');
    itemList.classList.add('item-list');

    items.forEach(item => {
      const listItem = document.createElement('li');

      const titleElement = document.createElement('span');
      titleElement.classList.add('item-title');
      titleElement.textContent = item.title;
      listItem.appendChild(titleElement);

      const linkElement = document.createElement('span');
      linkElement.classList.add('item-link');
      const domain = new URL(item.link).hostname;
      linkElement.innerHTML = `<a href="${item.link}" target="_blank">${domain}</a>`;
      listItem.appendChild(linkElement);

      const descriptionElement = document.createElement('span');
      descriptionElement.classList.add('item-description');
      descriptionElement.textContent = '?';
      
      const tooltip = document.createElement('div');
      tooltip.classList.add('tooltip');
      tooltip.textContent = item.description || 'Sem descrição';
      descriptionElement.appendChild(tooltip);

      listItem.appendChild(descriptionElement);

      const itemOptions = document.createElement('div');
      itemOptions.classList.add('item-options');

      const editButton = document.createElement('button');
      editButton.textContent = 'Editar';
      editButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleEditForm(item, listItem);
      });

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'X';
      deleteButton.classList.add('delete-button');
      deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        deleteCurrentItem(item.id);
      });

      itemOptions.appendChild(editButton);
      itemOptions.appendChild(deleteButton);

      listItem.appendChild(itemOptions);
      itemList.appendChild(listItem);
    });

    return itemList;
  }

  // Função para alternar o formulário de edição
  function toggleEditForm(item, listItem) {
    // Remove qualquer formulário de edição existente
    const existingForm = listItem.querySelector('.item-form');
    if (existingForm) {
      listItem.removeChild(existingForm);
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
        <label for="edit-item-description">Explicação:</label>
        <textarea id="edit-item-description" name="edit-item-description">${item.description || ''}</textarea>
      </div>

      <button id="save-edit-button">✓</button>
    `;

    editForm.querySelector('#save-edit-button').addEventListener('click', async () => {
      const newTitle = editForm.querySelector('#edit-item-title').value;
      const newLink = editForm.querySelector('#edit-item-link').value;
      const newDescription = editForm.querySelector('#edit-item-description').value;

      if (newTitle && newLink) {
        await updateItem(currentTabId, item.id, item.topicId, newTitle, newLink, newDescription);
        loadTabData(currentTabId);
      } else {
        alert('Por favor, preencha o título e o link.');
      }
    });

    listItem.appendChild(editForm);
  }

  // Renderiza os tópicos e seus itens
  async function renderTopics(tabId) {
    const topics = await getTopics(tabId);
    const topicsContainer = document.createElement('div');
    topicsContainer.id = 'topics-container';

    for (const topic of topics) {
      const topicElement = document.createElement('div');
      topicElement.classList.add('topic');
      topicElement.dataset.topicId = topic.id;

      const topicHeader = document.createElement('div');
      topicHeader.classList.add('topic-header');

      const topicName = document.createElement('div');
      topicName.classList.add('topic-name');
      topicName.textContent = topic.name;

      const deleteButton = document.createElement('button');
      deleteButton.classList.add('topic-delete-button');
      deleteButton.textContent = 'X';
      deleteButton.onclick = (e) => {
        e.stopPropagation();
        deleteCurrentTopic(topic.id);
      };

      topicHeader.appendChild(topicName);
      topicHeader.appendChild(deleteButton);

      // Toggle collapse on click
      topicHeader.onclick = () => {
        const content = topicElement.querySelector('.topic-content');
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
        topicElement.classList.toggle('collapsed');
      };

      // Double click to edit topic name
      topicName.ondblclick = (e) => {
        e.stopPropagation();
        enableTopicNameEditing(topic, topicName);
      };

      const topicContent = document.createElement('div');
      topicContent.classList.add('topic-content');

      // Render items for this topic
      const items = await getItems(tabId, topic.id);
      const itemList = renderItems(items);
      topicContent.appendChild(itemList);
      topicContent.appendChild(renderItemForm(topic.id));

      topicElement.appendChild(topicHeader);
      topicElement.appendChild(topicContent);
      topicsContainer.appendChild(topicElement);

      // Initially collapse the topic content
      topicElement.classList.add('collapsed');
      topicContent.style.display = 'none';
    }

    // Add "+" button for new topic
    const addTopicButton = document.createElement('button');
    addTopicButton.id = 'add-topic-button';
    addTopicButton.textContent = '+';
    addTopicButton.onclick = () => addNewTopic(tabId);
    topicsContainer.appendChild(addTopicButton);

    return topicsContainer;
  }

  // Enable topic name editing
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
      }
      loadTabData(currentTabId);
    };

    input.addEventListener('blur', saveName);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveName();
      }
    });

    topicNameElement.textContent = '';
    topicNameElement.appendChild(input);
    input.focus();
  }

  // Add new topic
  async function addNewTopic(tabId) {
    const defaultName = "Novo tópico";
    const topics = await getTopics(tabId);
    const newOrder = topics.length;
    const newTopicId = await addTopic(tabId, defaultName, newOrder);
    autoEditTopicId = newTopicId;
    loadTabData(tabId);
  }

  // Delete topic
  async function deleteCurrentTopic(topicId) {
    const confirmDelete = confirm('Tem certeza que deseja excluir este tópico?');
    if (confirmDelete) {
      await deleteTopic(topicId);
      loadTabData(currentTabId);
    }
  }

  // Renderiza o formulário para adicionar um novo item
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
        <label for="item-description-${topicId}">Explicação:</label>
        <textarea id="item-description-${topicId}" name="item-description"></textarea>
      </div>

      <button id="save-item-button-${topicId}">✓</button>
    `;

    itemForm.querySelector(`#save-item-button-${topicId}`).addEventListener('click', async () => {
      const title = document.getElementById(`item-title-${topicId}`).value;
      const link = document.getElementById(`item-link-${topicId}`).value;
      const description = document.getElementById(`item-description-${topicId}`).value || ''; // Make description optional

      if (title && link) { // Remove description from validation
        await addItem(currentTabId, topicId, title, link, description);
        loadTabData(currentTabId);
      } else {
        alert('Por favor, preencha o título e o link.');
      }
    });

    return itemForm;
  }

  // Exibe uma aba específica e carrega seus dados
  async function showTab(tabId) {
    currentTabId = tabId;
    await loadTabData(tabId);
    renderTabs();
  }

  // Carrega os itens de uma aba específica
  async function loadTabData(tabId) {
    tabContent.innerHTML = '';
    const topicsContent = await renderTopics(tabId);
    tabContent.appendChild(topicsContent);

    // Initialize Sortable for topics
    const topicsContainer = document.getElementById('topics-container');
    topicSortable = Sortable.create(topicsContainer, {
      handle: '.topic-header',
      animation: 150,
      onEnd: async function(evt) {
        const topics = Array.from(topicsContainer.querySelectorAll('.topic'));
        for (let i = 0; i < topics.length; i++) {
          const topicId = topics[i].dataset.topicId;
          await updateTopicOrder(topicId, i);
        }
      }
    });
  }

  // Cria uma nova aba com o nome default "Nova aba" e ativa a edição do nome
  async function addNewTab() {
    const defaultName = "Nova aba";
    const newOrder = tabs.length;
    const newTabId = await addTab(defaultName, newOrder);
    currentTabId = newTabId;
    loadTabs().then(() => {
      autoEditTabId = newTabId;
      renderTabs();
    });
  }

  // Exclui a aba atual após confirmação
  async function deleteCurrentTab(tabId) {
    const confirmDelete = confirm('Tem certeza que deseja excluir esta aba?');
    if (confirmDelete) {
      await deleteTab(tabId);
      loadTabs();
    }
  }

  // Edita os detalhes de um item utilizando diálogos prompt
  async function editItemDetails(item) {
    const newTitle = prompt('Digite o novo título do item:', item.title);
    const newLink = prompt('Digite o novo link do item:', item.link);
    const newDescription = prompt('Digite a nova descrição do item:', item.description);

    if (newTitle && newLink && newDescription) {
      await updateItem(currentTabId, item.id, newTitle, newLink, newDescription);
      loadTabData(currentTabId);
    }
  }

  // Exclui um item após confirmação
  async function deleteCurrentItem(itemId) {
    const confirmDelete = confirm('Tem certeza que deseja excluir este item?');
    if (confirmDelete) {
      await deleteItem(currentTabId, itemId);
      loadTabData(currentTabId);
    }
  }

  // Carrega todas as abas e exibe a primeira, se disponível
  async function loadTabs() {
    tabs = await getTabs();
    renderTabs();
    if (tabs.length > 0) {
      let tabToShow = currentTabId ? tabs.find(tab => tab.id === currentTabId) : tabs[0];
      if (tabToShow) {
        showTab(tabToShow.id);
      }
    } else {
      tabContent.innerHTML = '<p>Nenhuma aba encontrada. Clique no botão "+" para criar uma nova aba.</p>';
      currentTabId = null;
    }
  }

  // Função para habilitar a edição inline do nome da aba
  function enableTabNameEditing(tab, tabButton) {
    tabButton.innerHTML = '';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = tab.name;
    input.style.backgroundColor = 'lightblue';
    input.style.border = '1px solid red';
    input.style.fontSize = '1em';
    // Ajusta o tamanho do campo conforme o conteúdo
    input.style.width = `${input.value.length + 1}ch`;

    // Atualiza dinamicamente o tamanho do input na edição
    input.addEventListener('input', () => {
      input.style.width = `${input.value.length + 1}ch`;
    });

    const saveName = async () => {
      const newName = input.value.trim();
      if (newName && newName !== tab.name) {
        await updateTab(tab.id, newName);
      }
      autoEditTabId = null; // Limpa a flag de edição automática
      loadTabs();
    };

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveName();
      }
    });
    input.addEventListener('blur', saveName);
    tabButton.appendChild(input);
    input.focus();
  }

  // Carregamento inicial das abas
  await loadTabs();

  // Inicia a funcionalidade de arrastar e ordenar abas usando SortableJS
  sortable = Sortable.create(tabList, {
    filter: '.no-drag',
    ghostClass: 'sortable-ghost',
    onEnd: async function(evt) {
      const children = Array.from(tabList.children).filter(child => child.dataset.tabId);
      for (let i = 0; i < children.length; i++) {
        const tabId = children[i].dataset.tabId;
        await updateTabOrder(tabId, i);
      }
      await loadTabs();
    }
  });
});
