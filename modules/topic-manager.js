import { getTopics, addTopic, updateTopic, deleteTopic, updateTopicOrder } from 'js/firebase.js';

export class TopicManager { 
  constructor(currentTabId, itemManager, uiUtils) {
    this.currentTabId = currentTabId;
    this.itemManager = itemManager;
    this.uiUtils = uiUtils;
    this.getCurrentTabId = null;
  }

  setCurrentTabIdGetter(getter) {
    this.getCurrentTabId = getter;
  }

  async renderTopics(tabId) {
    const topics = await getTopics(tabId);
    const topicsContainer = document.createElement('div');
    topicsContainer.id = 'topics-container';
    
    topics.forEach(topic => {
      const topicElement = this.createTopicElement(topic);
      topicsContainer.appendChild(topicElement);
    });
    
    const addTopicButton = document.createElement('button');
    addTopicButton.id = 'add-topic-button';
    addTopicButton.textContent = '+';
    addTopicButton.onclick = () => this.addNewTopic(tabId);
    topicsContainer.appendChild(addTopicButton);
    
    Sortable.create(topicsContainer, {
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

  createTopicElement(topic) {
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
      this.enableTopicNameEditing(topic, topicName);
    };

    const topicTitleContainer = document.createElement('div');
    topicTitleContainer.classList.add('topic-title-container');
    topicTitleContainer.appendChild(topicName);
    topicTitleContainer.appendChild(this.uiUtils.createTopicDragHandle());

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('topic-delete-button');
    deleteButton.textContent = 'X';
    deleteButton.onclick = (e) => {
      e.stopPropagation();
      this.deleteCurrentTopic(topic.id);
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

    const itemList = this.itemManager.createItemList(topic.id);
    topicContent.appendChild(itemList);
    topicContent.appendChild(this.itemManager.renderItemForm(topic.id));
    topicElement.appendChild(topicContent);

    return topicElement;
  }

  async deleteCurrentTopic(topicId) {
    const confirmDelete = confirm('Tem certeza que deseja excluir este tópico?');
    if (confirmDelete) {
      await deleteTopic(topicId);
      const topicElement = document.querySelector(`.topic[data-topic-id="${topicId}"]`);
      if (topicElement) topicElement.remove();
    }
  }

  enableTopicNameEditing(topic, topicNameElement) {
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
        this.enableTopicNameEditing(topic, newDiv);
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

  async addNewTopic(tabId) {
    const defaultName = "Novo tópico";
    const topics = await getTopics(tabId);
    const newOrder = topics.length;
    const newTopicId = await addTopic(tabId, defaultName, newOrder);
    const newTopic = { id: newTopicId, name: defaultName, order: newOrder, tabId };
    
    const topicsContainer = document.getElementById('topics-container');
    if (topicsContainer) {
      const addTopicButton = document.getElementById('add-topic-button');
      const newTopicElement = this.createTopicElement(newTopic);
      topicsContainer.insertBefore(newTopicElement, addTopicButton);
      const topicNameElement = newTopicElement.querySelector('.topic-name');
      setTimeout(() => {
        this.enableTopicNameEditing(newTopic, topicNameElement);
      }, 300);
    }
  }
}
