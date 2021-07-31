let BVGOOverlay;

window.addEventListener('message', e => {
  const bvgoLoaded = typeof BVGO !== 'undefined';
  const {
    type,
    options,
  } = e.data;

  if(type === 'bvgo-extension-options') {
    if(bvgoLoaded && BVGO.isBRP()) {
      BVGOOverlay = new BVGO(options);
    }
  }

  if(type === 'bvgo-extension-trigger-bvgo') {
    if(bvgoLoaded) {
      BVGO.triggerBVGO();
    }
  }
});