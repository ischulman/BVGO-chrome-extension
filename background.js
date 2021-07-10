console.log('background service worker page');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('background service worker: runtime.onMessage:', request, sender, sendResponse);
  sendResponse();
});