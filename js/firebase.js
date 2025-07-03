import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, get, update, remove, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://portfolio-maximo-default-rtdb.europe-west1.firebasedatabase.app/",
};

let app;
let database;

export async function initializeFirebase() {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
}

export async function getTabs() {
  const tabsRef = ref(database, 'tabs');
  const snapshot = await get(tabsRef);
  if (snapshot.exists()) {
    return Object.entries(snapshot.val())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
  return [];
}

export async function addTab(name, order) {
  const tabsRef = ref(database, 'tabs');
  const newTabRef = push(tabsRef);
  await set(newTabRef, { name, order });
  return newTabRef.key;
}

export async function updateTab(id, name) {
  await update(ref(database, `tabs/${id}`), { name });
}

export async function updateTabOrder(tabId, order) {
  await update(ref(database, `tabs/${tabId}`), { order });
}

export async function deleteTab(id) {
  await remove(ref(database, `tabs/${id}`));
  const itemsRef = ref(database, 'items');
  const snapshot = await get(itemsRef);
  if (snapshot.exists()) {
    const items = snapshot.val();
    for (const itemId in items) {
      if (items[itemId].tabId === id) {
        await remove(ref(database, `items/${itemId}`));
      }
    }
  }
}

export async function getItems(tabId, topicId) {
  const itemsRef = ref(database, 'items');
  const snapshot = await get(itemsRef);
  if (snapshot.exists()) {
    return Object.entries(snapshot.val())
      .filter(([, item]) => item.tabId === tabId && item.topicId === topicId)
      .map(([id, item]) => ({ id, ...item }))
      .sort((a, b) => ((a.order ?? 9999) - (b.order ?? 9999)));
  }
  return [];
}

export async function addItem(tabId, topicId, title, link, fonte, description) {
  const itemsRef = ref(database, 'items');
  const newItemRef = push(itemsRef);
  await set(newItemRef, { tabId, topicId, title, link, fonte, description });
  return newItemRef.key;
}

export async function updateItem(tabId, itemId, topicId, title, link, fonte, description) {
  await update(ref(database, `items/${itemId}`), { tabId, topicId, title, link, fonte, description });
}

export async function deleteItem(tabId, itemId) {
  await remove(ref(database, `items/${itemId}`));
}

export async function updateItemOrder(itemId, topicId, order) {
  await update(ref(database, `items/${itemId}`), { topicId, order });
}

export async function getAllItems() {
  const itemsRef = ref(database, 'items');
  const snapshot = await get(itemsRef);
  if (snapshot.exists()) {
    return Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
  }
  return [];
}

export async function getTopics(tabId) {
  const topicsRef = ref(database, 'topics');
  const snapshot = await get(topicsRef);
  if (snapshot.exists()) {
    return Object.entries(snapshot.val())
      .filter(([, topic]) => topic.tabId === tabId)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
  return [];
}

export async function addTopic(tabId, name, order) {
  const topicsRef = ref(database, 'topics');
  const newTopicRef = push(topicsRef);
  await set(newTopicRef, { tabId, name, order });
  return newTopicRef.key;
}

export async function updateTopic(id, name) {
  await update(ref(database, `topics/${id}`), { name });
}

export async function updateTopicOrder(topicId, order) {
  await update(ref(database, `topics/${topicId}`), { order });
}

export async function deleteTopic(id) {
  await remove(ref(database, `topics/${id}`));
  const itemsRef = ref(database, 'items');
  const snapshot = await get(itemsRef);
  if (snapshot.exists()) {
    const items = snapshot.val();
    for (const itemId in items) {
      if (items[itemId].topicId === id) {
        await remove(ref(database, `items/${itemId}`));
      }
    }
  }
}
