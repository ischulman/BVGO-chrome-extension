console.log('bvgo-overlay-script');

let BVGOOverlay;

if (BVGO.isBRP()) {
  BVGOOverlay = new BVGO({
    pageType: 'BRP',
    collapsedByDefault: false,
    containerMouseFades: false
  });
}