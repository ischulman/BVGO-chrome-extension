let BVGOOverlay;

window.addEventListener('message', e => {
  const bvgoLoaded = typeof BVGO !== 'undefined';
  const {
    type,
    options,
    extensionID,
  } = e.data;

  if(type === 'bvgo-extension-options') {
    if(bvgoLoaded && BVGO.isBRP()) {
      BVGOOverlay = new BVGO(options, extensionID);
    }
  }

  if(type === 'bvgo-extension-trigger-bvgo') {
    if(bvgoLoaded) {
      BVGO.triggerBVGO();
    }
  }
});