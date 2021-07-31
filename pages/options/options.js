const bvgoLink = document.getElementById('bvgo-link');

bvgoLink.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        window.postMessage({ type: 'bvgo-extension-trigger-bvgo' });
      },
    });
  });
});

chrome.storage.local.get(null, options => {
  options = Object.assign({}, defaultOptions, options);

  // set the state for the option controls based on setting in chrome storage
  Object.entries(options).forEach(([option, optionValue]) => {
    const optionItem = document.querySelector(`[storage-key="${option}"]`)
    
    if(optionItem) {
      optionItem.control.setInitialState(optionValue);
    }
  });
});