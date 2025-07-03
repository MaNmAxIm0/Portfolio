export class UIUtils {
  extractDomain(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (error) {
      return url.replace(/^www\./, '');
    }
  }

  isMobile() {
    return window.innerWidth <= 768;
  }

  createDragHandle() {
    const dragHandle = document.createElement('span');
    dragHandle.classList.add('drag-handle');
    dragHandle.innerHTML = `<svg width="24" height="24" viewBox="0 0 8 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="1" cy="6" r="3" opacity="0.3"/>
      <circle cx="7" cy="6" r="3" opacity="0.3"/>
      <circle cx="1" cy="12" r="3" opacity="0.3"/>
      <circle cx="7" cy="12" r="3" opacity="0.3"/>
      <circle cx="1" cy="18" r="3" opacity="0.3"/>
      <circle cx="7" cy="18" r="3" opacity="0.3"/>
    </svg>`;
    return dragHandle;
  }

  createTopicDragHandle() {
    const topicDragHandle = document.createElement('span');
    topicDragHandle.classList.add('topic-drag-handle');
    topicDragHandle.innerHTML = `<svg width="24" height="24" viewBox="0 0 8 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="1" cy="6" r="3" opacity="0.3"/>
      <circle cx="7" cy="6" r="3" opacity="0.3"/>
      <circle cx="1" cy="12" r="3" opacity="0.3"/>
      <circle cx="7" cy="12" r="3" opacity="0.3"/>
      <circle cx="1" cy="18" r="3" opacity="0.3"/>
      <circle cx="7" cy="18" r="3" opacity="0.3"/>
    </svg>`;
    topicDragHandle.addEventListener('click', (e) => { e.stopPropagation(); });
    return topicDragHandle;
  }
}
