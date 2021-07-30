class ToggleButton extends OptionItemControl {
  constructor(options) {
    super(options);

    this.enabled = false;

    this.innerHTML = `
      <div class="track">
        <div class="thumb"></div>
      </div>
    `;
  }

  setInitialState(optionValue) {
    if(optionValue) {
      this.enable();
    }
  }

  connectedCallback() {
    this.indicator = this.querySelector('.indicator');
    this.track = this.querySelector('.track');

    this.addEventListener('click', this.toggle.bind(this));
  }

  enable() {
    this.classList.add('enabled');
    this.enabled = true;
    this.updateStorage(this.enabled);
  }

  disable() {
    this.classList.remove('enabled');
    this.enabled = false;
    this.updateStorage(this.enabled);
  }

  toggle() {
    this.enabled ? this.disable() : this.enable();
  }
}

customElements.define('toggle-button', ToggleButton);