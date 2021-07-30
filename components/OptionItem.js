class OptionItem extends HTMLElement {
  constructor() {
    super();

    this.control = null;
    this.name = this.getAttribute('name');
    this.type = this.getAttribute('type');
    this.storageKey = this.getAttribute('storage-key');

    this.innerHTML = `
      <div class="option-name">${this.getAttribute('name')}</div>
    `;
  }

  connectedCallback() {
    switch(this.type) {
      case 'toggle':
        this.control = new ToggleButton({ storageKey: this.storageKey });
        break;
    }
    
    this.append(this.control);
  }
}

customElements.define('option-item', OptionItem);