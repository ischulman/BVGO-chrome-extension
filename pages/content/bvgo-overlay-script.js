let BVGOOverlay;

window.addEventListener('message', e => {
  if(e.data.type === 'bvgo-extension-options') {
    if (typeof BVGO !== 'undefined' && BVGO.isBRP()) {
      BVGOOverlay = new BVGO(e.data.options);
    }
  }
});