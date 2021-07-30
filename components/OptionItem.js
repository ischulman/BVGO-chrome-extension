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
    let control;

    switch(this.type) {
      case 'toggle': control = ToggleButton; break;
      case 'slider': control = Slider; break;
    }
    
    this.control = new control({ storageKey: this.storageKey });

    this.append(this.control);
  }
}

customElements.define('option-item', OptionItem);