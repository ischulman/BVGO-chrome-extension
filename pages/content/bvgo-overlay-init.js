console.log('bvgo-inject.js...');

[
  'pages/content/BVGO.js',
  'pages/content/bvgo-overlay-script.js'
].forEach((path, index, scripts) => {
  const scriptElement = document.createElement('script');

  scriptElement.type = 'text/javascript';
  scriptElement.src = chrome.runtime.getURL(path);

  if(index === scripts.length - 1) {
    console.log('adding onload event', path);
    
    scriptElement.onload = () => {
      console.log('BVGO scripts loaded');
  
      window.postMessage({type: 'bvgo-extension-ready'});
    }
  }

  document.body.append(scriptElement);
});

chrome.runtime.onMessage.addListener(({type}) => {
  if (type === 'bvgo-app-wizard-ready') {
    console.log('bvgo-app-wizard-ready event received from background page');

    // forward message from background to injected BVGO class
    // which will initiate adding wizard steps to overlay
    window.postMessage({type: 'bvgo-app-wizard-ready'});
  }
});