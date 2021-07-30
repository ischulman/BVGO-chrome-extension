class OptionItemControl extends HTMLElement {
  constructor({ storageKey }) {
    super();

    this.storageKey = storageKey;
  }

  updateStorage(value) {
    chrome.storage.local.set({ [this.storageKey]: value });
  }
}