// load extension scripts if it is enabled
chrome.storage.local.get('enabled', data => {
  // if enabled isn't yet set in storage, default to being enabled
  if(!data.hasOwnProperty('enabled') || data.enabled) {
    loadExtensionScripts();
  }
});

chrome.storage.onChanged.addListener(updates => {
  // if the page initially loads with enabled:false, if enabled afterwards
  // make sure to load the extension scripts. also make sure the scripts 
  // weren't already loaded by checking for injected script tags.
  if(updates?.enabled?.newValue && !document.querySelector('.bvgo-extension-script')) {
    loadExtensionScripts();
  }

  // pass changed options to injected script
  window.postMessage({
    type: 'bvgo-extension-options-updated',
    updates,
  });
});

function loadExtensionScripts() {
  [
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
}