console.log('background service worker page');

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  const tab = sender.tab;
  
  // listen for message sent from app code targeting the extension
  // and indicating the wizard object is initialized
  if(request.type === 'bvgo-app-wizard-ready') {
    // call sendResponse which the app waits for before adding wizard manager on window
    sendResponse();

    // forward message from background to current tab's content script (bvgo-overlay-init.js)
    chrome.tabs.sendMessage(tab.id, {type: 'bvgo-app-wizard-ready'});
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('background service worker: runtime.onMessage:', request, sender, sendResponse);
  sendResponse();
});