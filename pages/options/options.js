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