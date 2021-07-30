class Slider extends OptionItemControl {
  constructor(options) {
    super(options);

    this.innerHTML = `
      <input class="slider-control" type="range" min="0" max="100" value="0" />
    `;
  }

  setInitialState(optionValue) {
    this.setValue(optionValue);
  }

  setValue(value) {
    this.input.value = value;

    this.updateStorage(value);
  }

  connectedCallback() {
    this.input = this.querySelector('.slider-control');

    this.input.addEventListener('input', this.onChangeHandler.bind(this));
  }

  onChangeHandler() {
    this.updateStorage(this.input.value);
  }
}

customElements.define('slider-control', Slider);