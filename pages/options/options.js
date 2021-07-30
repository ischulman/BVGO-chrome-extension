chrome.storage.local.get(null, options => {
  const defaults = {
    enabled: true,
  };

  // if any default options don't exist in storage, add it to the options object
  Object.entries(defaults).forEach(([defaultOption, defaultOptionValue]) => {
    if(!options.hasOwnProperty(defaultOption)) {
      options[defaultOption] = defaultOptionValue;
    }
  });

  // set the state for the option controls based on setting in chrome storage
  Object.entries(options).forEach(([option, optionValue]) => {
    const optionItem = document.querySelector(`[storage-key="${option}"]`)
    
    if(optionItem) {
      optionItem.control.setInitialState(optionValue);
    }
  });
});