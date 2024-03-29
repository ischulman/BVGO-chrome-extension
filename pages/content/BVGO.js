class BVGO {
  static isBRP() {
    return document.querySelector('.wizContent, .wiz-content');
  }

  static triggerBVGO() {
    [66,86,71,79].forEach(key => {
        const keyEvent = new Event('keydown');
        keyEvent.which = key;
        window.dispatchEvent(keyEvent); 
    });
  }

  constructor(options, extensionID) {
    this.stepsToSkip = 0;
    this.currentWizardStepIndex = 0;
    this.extensionID = extensionID;
    this.options = Object.assign({}, defaultOptions, options);
    
    window.addEventListener('message', e => {
      switch(e.data.type) {
        // message posted by the page app code which indicates 
        // that the wizard instance is added to the window
        case 'bvgo-app-wizard-ready':
          this.wizard = window.bvgoWizardManager;

          this.generateWizardSteps();
          break;
        case 'bvgo-extension-options-updated':
          const updatedOptions = e.data.updates;

          // build and setup overlay if page was loaded with enabled option 
          // set to false and is now being updated to true
          if(!this.initialized && updatedOptions?.enabled?.newValue) {
            this.init();
          }
          
          this.setOptions(updatedOptions);
          break;
      }
    });

    if(this.options.enabled) {
      this.init();
    }
  }

  init() {
    this.build();
    this.addListeners();

    // post a message indicating the extension is ready. the page
    // code expects to receive this event to add the wizard 
    // object on the window.
    window.postMessage({type: 'bvgo-extension-ready'});

    this.setOptions(this.options);

    this.initialized = true;
  }

  /**
   * Set chrome.storage options initially or when they are updated.
   * The expectation is that each option storage key corresponds to a 
   * setter property on this class which handles the setting.
   */
  setOptions(options) {
    Object.entries(options).forEach(([option, optionValue]) => {
      // when an option is updated, optionValue will be an object
      // containing a newValue property whereas when requesting
      // option values directly, optionValue is the value itself
      this[option] = optionValue?.newValue ?? optionValue;
    });
  }

  get areStepsBeingSkipped() {
    return this.stepsToSkip > 0;
  }

  get collapsedByDefault() {
    return this._collapsedByDefault;
  }

  set collapsedByDefault(collapsedByDefault) {
    this._collapsedByDefault = collapsedByDefault;

    if(!this.initialized && this.collapsedByDefault) {
      this.collapse();
    }
  }

  get containerOpacity() {
    return this._containerOpacity;
  }

  set containerOpacity(opacity) {
    // containerOpacity option is stored as a number between 0 and 100
    // which is used to set the input range on the options popup. 
    // divide by 100 to get proper opacity value.
    this._containerOpacity = opacity / 100;

    this.container.style.opacity = this.containerOpacity;
  }

  get enabled() {
    return this._enabled;
  }

  set enabled(enabled) {
    this._enabled = enabled;

    this.container.classList.toggle('hidden', !this.enabled);
  }

  /**
   * Add event listeners to overlay elements
   */
  addListeners() {
    this.onDragMouseDownHandler = this.onDragMouseDownHandler.bind(this);
    this.onDragMouseMoveHandler = this.onDragMouseMoveHandler.bind(this);
    this.onDragMouseUpHandler = this.onDragMouseUpHandler.bind(this);
    this.toggleContainer = this.toggleContainer.bind(this);

    if(this.containerMouseFades) {
      this.container.addEventListener('mouseover', () => this.container.classList.remove('inactive'));
      this.container.addEventListener('mouseout', () => this.container.classList.add('inactive'));
    }

    this.attachMouseAndTouchListeners(this.titlebar, 'add', 'mousedown', this.onDragMouseDownHandler);

    this.containerToggleBtn.addEventListener('click', this.toggleContainer);

    [this.title, this.containerToggleBtn].forEach(elem => {
      elem.addEventListener('mousedown', e => {
        e.stopPropagation();
      })
    });

    this.title.addEventListener('click', BVGO.triggerBVGO);

    let resizeHandlerPending = false;

    window.addEventListener('resize', () => {
      // debounce resize handler since resize can trigger many events
      if(!resizeHandlerPending) {
        setTimeout(() => {
          this.adjustOutOfBoundsPosition();
          
          resizeHandlerPending = false;
        }, 250);

        resizeHandlerPending = true;
      }
    });
  }

  /**
   * Checks if container is out of bounds and repositions it to be in view.
   * This is called on window resize, such as when switching between 
   * landscape, portrait or different mobile presets and if the 
   * container has been moved from its initial position
   */
  adjustOutOfBoundsPosition() {
    const containerRect = this.container.getBoundingClientRect();
    
    if(containerRect.left > window.innerWidth - containerRect.width) {
      this.container.style.left = '10px';
    }

    if(containerRect.top > window.innerHeight - containerRect.height) {
      this.container.style.top = '10px';
    }
  }

  /**
   * Adds both mouse and equivalent touch event listeners
   * 
   * @param {Node} elem 
   * @param {string} addOrRemove 
   * @param {string} eventType 
   * @param {Function} handler 
   * @param {string|object} options 
   */
   attachMouseAndTouchListeners(elem, addOrRemove, eventType, handler, options) {
    const eventTypeMapping = {
      mouseup: 'touchend',
      mousemove: 'touchmove',
      mousedown: 'touchstart',
    };

    elem[`${addOrRemove}EventListener`](eventType, handler, options);
    elem[`${addOrRemove}EventListener`](eventTypeMapping[eventType], handler, options);
  }

  /**
   * Get clientX and clientY event properties depending on event type.
   * 
   * @param {Event} e MouseEvent or TouchEvent
   * @returns {object} Object containing clientX and clientY values
   */
  getEventXYPosition(e) {
    return {
      clientX: e?.touches?.[0]?.clientX ?? e.clientX,
      clientY: e?.touches?.[0]?.clientY ?? e.clientY,
    };
  }

  /**
   * Mouse down or touch start event  handler to initiate dragging of overlay
   * 
   * @param {MouseEvent|TouchEvent} e 
   */
  onDragMouseDownHandler(e) {
    const { clientX, clientY } = this.getEventXYPosition(e);

    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.dragStartOffsetLeft = this.container.offsetLeft;
    this.dragStartOffsetTop = this.container.offsetTop;

    this.attachMouseAndTouchListeners(document, 'add', 'mousemove', this.onDragMouseMoveHandler, { passive: false });
    this.attachMouseAndTouchListeners(document, 'add', 'mouseup', this.onDragMouseUpHandler);
  }

  /**
   * Mouse/Touch move event handler triggered while dragging the overlay
   * 
   * @param {MouseEvent|TouchEvent} e 
   */
  onDragMouseMoveHandler(e) {
    const { clientX, clientY } = this.getEventXYPosition(e);
    const containerRightBoundary = this.container.offsetWidth * .25;
    const containerLeftBoundary = -(this.container.offsetWidth * .75);
    const containerTopBoundary = this.container.offsetHeight * .25;
    const maxLeft = window.innerWidth - containerRightBoundary
    const maxTop = window.innerHeight - containerTopBoundary;
    let left = this.dragStartOffsetLeft + (clientX - this.dragStartX);
    let top = this.dragStartOffsetTop + (clientY - this.dragStartY);

    // ensure container isn't dragged too far out of bounds
    if(left > maxLeft) left = maxLeft;
    if(top > maxTop) top = maxTop;
    if(left < containerLeftBoundary) left = containerLeftBoundary;
    if(top < 0) top = 0; 

    this.container.style.left = left + 'px';
    this.container.style.top = top + 'px';

    e.preventDefault();
  }

  /**
   * Mouse up or touch end event handler to remove drag events when dragging is complete
   */
  onDragMouseUpHandler() {
    this.attachMouseAndTouchListeners(document, 'remove', 'mousemove', this.onDragMouseMoveHandler);
    this.attachMouseAndTouchListeners(document, 'remove', 'mouseup', this.onDragMouseUpHandler);
  }

  /**
   * Skip to a specified future step index in the wizard
   * 
   * @param {number} stepIndex The target step index to skip to. Value is converted to a Number.
   */
  skipToStep(stepIndex) {
    stepIndex *= 1;

    // Skip to step index if steps aren't currently being skipped. Also ensure that the
    // step index is a future step, including if it's equal to the current step index
    // since the current step can still be awaiting displaying its modal.
    if(!this.areStepsBeingSkipped && stepIndex >= this.currentWizardStepIndex) {
      // this.stepsToSkip = this.getStepsToSkip(stepIndex);
      this.setStepsToSkip(stepIndex);

      if(this.stepsToSkip) {
        this.skipStep();
      }
    }
  }

  /**
   * Determines and sets stepsToSkip property based on the provided step index
   * and how many steps it will take to get there, taking into account the
   * modal portion of steps.
   * 
   * @param {number} stepIndex The target step index to skip to
   */
  setStepsToSkip(stepIndex) {
    if(stepIndex < this.currentWizardStepIndex) return;

    // If the current step was clicked, check if the step is still waiting
    // to display its modal in which case only one step is to be skipped. 
    if(stepIndex === this.currentWizardStepIndex && 
      this.currentWizardStep.$modal && 
      !this.currentWizardStep.isModalDispled) {

      this.stepsToSkip = 1;
      return;
    }

    // Loop through all steps from the current step through the clicked step index
    // and increment the amount of steps to be skipped. Increment twice if a 
    // modal is a part of a step and hasn't yet been displayed.
    for(let i = this.currentWizardStepIndex; i < stepIndex; i++) {
      const step = this.wizardSteps[i];

      this.stepsToSkip += step.$modal && !step.isModalDispled ? 2 : 1;
    }
  }

  /**
   * Skip a step in the wizard. Called when a step is directly clicked on.
   * In addition to triggering BVGO, this method decrements stepsToSKip
   * and is executed on timeout which seems to be necessary for all
   * steps to trigger.
   */
  skipStep() {
    setTimeout(() => {
      this.stepsToSkip--;
      BVGO.triggerBVGO();
    });
  }

  /**
   * Method which intercepts each wizard section's startNextStep method.
   * The section and saved startNextStep method is passed in and
   * called so that wizard functionality doesn't break, but 
   * allows for performing additional logic exactly 
   * when each step starts.
   * 
   * @param {object} section The section which this method is intercepting
   * @param {Function} startNextStepOrig The original startNextStep method for this section
   */
  onStartNextWizardStep(section, startNextStepOrig) {
    const currentStep = section.getCurrentStep();

    startNextStepOrig.call(section);
    
    if(!currentStep.hide) {
      console.log(currentStep.title, currentStep);

      const stepTitle = currentStep.title || currentStep.$elem.attr('id');
      const bvgoTitleDataset = 'data-bvgo-overlay-step-title';
      const bvgoStepClass = '.bvgo-overlay-wizard-step';
      const bvgoModalClass = '.bvgo-overlay-wizard-step-modal';
      const bvgoStepElement = document.querySelector(`[${bvgoTitleDataset}="${stepTitle}"]`);
      const bvgoActiveStepElement = document.querySelector(`${bvgoStepClass}.active`);
      const bvgoActiveStepModalElement = document.querySelector(`${bvgoModalClass}.active`);

      const onModalShown = () => {
        document.querySelector(`[${bvgoTitleDataset}="${stepTitle}"] ${bvgoModalClass}`)?.classList.add('active');

        currentStep.$modal.off('show.bs.modal', onModalShown);

        // Section startNextStep isn't triggered when the modal is displayed so make
        // sure to continue skipping steps while skipping steps is still in
        // progress and upon display of the modal.
        if(this.areStepsBeingSkipped) {
          this.skipStep();
        }
      };

      this.currentWizardStep = currentStep;
      this.currentWizardStepIndex++;

      if(currentStep.$modal) {
        currentStep.$modal.on('show.bs.modal', onModalShown);
      }

      // the next step is starting, so if there is currently an active
      // step, remove its active class and add a completed class
      bvgoActiveStepElement?.classList.remove('active');
      bvgoActiveStepElement?.classList.add('completed');

      // ...and do the same if there is a modal element in the completed step
      bvgoActiveStepModalElement?.classList.remove('active');
      bvgoActiveStepModalElement?.classList.add('completed');
      
      // add the active class to the next step
      bvgoStepElement?.classList.add('active');     

      // continue skipping steps while skipping steps is still in progress
      if(this.areStepsBeingSkipped) {
        this.skipStep();
      }
    }
  }

  /**
   * Flatten all wizard steps and add them on the instance as this.wizardSteps.
   * Builds all wizard step elements and appends them to the overlay.
   */
  generateWizardSteps() {
    if(this.wizard?.sections?.length) {
      this.currentWizardStep = this.wizard.getCurrentSection().getCurrentStep();

      // switch from container being just the bvgo button
      // now that the wizard steps are being generated
      this.container.classList.remove('only-bvgo');
      this.containerToggleBtn.classList.remove('hidden');

      // flatten wizard steps
      this.wizardSteps = this.wizard.sections
        .reduce((acc, section) => {
          // intercept section startNextStep methods so extension can perform logic when each step starts
          section.startNextStep = this.onStartNextWizardStep.bind(this, section, section.startNextStep);
          
          section.steps[section.steps.length - 1].isLastSectionStep = true;

          acc.push(...section.steps);
          
          return acc;
        }, [])
        .filter(step => !step.hide);

      this.wizardSteps.forEach((step, index) => {
        const stepElement = document.createElement('div');
        const titleElement = document.createElement('div');
        const modalElement = document.createElement('div');
        const {
          $elem,
          $modal,
          duration,
          title,
          isLastSectionStep
        } = step;

        const stepTitle = title || $elem.attr('id');

        stepElement.classList.add('bvgo-overlay-wizard-step');
        stepElement.classList.toggle('is-last-section-step', !!isLastSectionStep);
        stepElement.classList.toggle('active', step === this.currentWizardStep);
        stepElement.setAttribute('data-bvgo-overlay-step-index', index);
        stepElement.setAttribute('data-bvgo-overlay-step-title', stepTitle);
        stepElement.title = `Duration: ${duration}`;

        stepElement.addEventListener('click', e => {
          this.skipToStep(e.currentTarget.dataset.bvgoOverlayStepIndex);
        });

        titleElement.classList.add('bvgo-overlay-wizard-step-title');
        titleElement.innerHTML = stepTitle;

        modalElement.classList.add('bvgo-overlay-wizard-step-modal');
        modalElement.classList.toggle('active', !!step.isModalDispled);
        modalElement.title = 'Step contains a modal';

        stepElement.append(titleElement);
        
        if($modal) {
          stepElement.append(modalElement);
        }

        this.wizardStepsContainer.append(stepElement);
      });
    }
  }

  /**
   * Toggle the container to hide or display the content section which
   * would contain the wizards steps.
   */
  toggleContainer() {
    this.isCollapsed ? this.expand() : this.collapse();
  }

  collapse() {
    this.container.classList.remove('expanded');
    this.container.classList.add('collapsed');
    this.containerToggleBtn.classList.add('bvgo-icon-plus');
    this.containerToggleBtn.classList.remove('bvgo-icon-minus');
    this.containerToggleBtn.title = 'Click to expand';
    this.isCollapsed = true;
  }

  expand() {
    this.container.classList.remove('collapsed');
    this.container.classList.add('expanded');
    this.containerToggleBtn.classList.remove('bvgo-icon-plus');
    this.containerToggleBtn.classList.add('bvgo-icon-minus');
    this.containerToggleBtn.title = 'Click to collapse';
    this.isCollapsed = false;
  }

  /**
   * Builds the overlay and adds it to the page
   */
  build() {
    this.container = document.createElement('div');
    this.container.classList.add('bvgo-overlay-container');

    // initially display the container as only a bvgo button in case page
    // isn't coded to interact with the extension. if wizard steps are
    // generated, container and toggle button classes are updated
    this.container.classList.add('expanded', 'only-bvgo');
    this.container.classList.toggle('inactive', !!this.containerMouseFades);

    this.titlebar = document.createElement('div');
    this.titlebar.classList.add('bvgo-overlay-titlebar');
    
    this.title = document.createElement('div');
    this.title.classList.add('bvgo-overlay-title');
    this.title.setAttribute('title', 'Click to trigger BVGO');
    this.title.innerHTML = 'BVGO';

    this.containerToggleBtn = document.createElement('span');
    // button is hidden until wizard steps are generated
    this.containerToggleBtn.classList.add('bvgo-overlay-toggle-btn', 'bvgo-icon-minus', 'hidden');
    this.containerToggleBtn.setAttribute('role', 'button');
    this.containerToggleBtn.setAttribute('title', 'Click to collapse');

    this.titlebar.append(this.title, this.containerToggleBtn);

    this.content = document.createElement('div');
    this.content.classList.add('bvgo-overlay-content');

    this.wizardStepsContainer = document.createElement('div');
    this.wizardStepsContainer.classList.add('bvgo-overlay-wizard-steps-container');

    this.content.append(this.wizardStepsContainer);

    this.container.append(this.titlebar, this.content);

    document.body.append(this.container);
  }
}