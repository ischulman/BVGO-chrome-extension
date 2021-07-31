chrome.storage.onChanged.addListener(updates => {
  // pass changed options to injected script
  window.postMessage({
    type: 'bvgo-extension-options-updated',
    updates,
  });
});

[
  'default-options.js',
  'pages/content/BVGO.js',
  'pages/content/bvgo-overlay-script.js'
].forEach((path, index, scripts) => {
  const scriptElement = document.createElement('script');

  scriptElement.type = 'text/javascript';
  scriptElement.src = chrome.runtime.getURL(path);
  scriptElement.classList.add('bvgo-extension-script');

  if(index === scripts.length - 1) {
    scriptElement.onload = () => {        
      // pass all stored extension options to the injected script
      chrome.storage.local.get(null, options => {
        window.postMessage({
          type: 'bvgo-extension-options',
          options,
        });
      });
    }
  }

  document.body.append(scriptElement);
});