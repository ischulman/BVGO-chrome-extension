console.log('bvgo-overlay-script');

if (BVGO.isBRP()) {
  const BVGOOverlay = new BVGO({
    pageType: 'BRP',
    collapsedByDefault: false,
    containerMouseFades: false
  });
}