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

  constructor({
    pageType,
    containerMouseFades = false,
    collapsedByDefault = false
  } = {}) {
    this.pageType = pageType;
    this.containerMouseFades = containerMouseFades;
    this.collapsedByDefault = collapsedByDefault;
    this.stepsToSkip = 0;
    this.currentWizardStepIndex = 0;
    this.isCollapsed = this.collapsedByDefault;

    this.build();

    this.addListeners();

    this.registerWizardReadyListener();
  }

  get areStepsBeingSkipped() {
    return this.stepsToSkip > 0;
  }  

  skipToStep(stepIndex) {
    stepIndex *= 1;

    const isFutureStep = stepIndex > this.currentWizardStepIndex;
    const isCurrentStep = stepIndex === this.currentWizardStepIndex;
    const isCurrentStepModalDisplayed = this.currentWizardStep.isModalDispled;

    if(!this.areStepsBeingSkipped && ((isFutureStep) || (isCurrentStep && this.currentWizardStep.$modal && !isCurrentStepModalDisplayed))) {
      this.stepsToSkip = this.getStepsToSkip(stepIndex);
      this.skipStep();
    }
  }

  skipStep() {
    setTimeout(() => {
      this.stepsToSkip--;
      BVGO.triggerBVGO();
    });
  }

  getStepsToSkip(stepIndex) {
    let stepsToSkip = 0;

    if(stepIndex === this.currentWizardStepIndex && !this.currentWizardStep.isModalDispled) {
      stepsToSkip++;
    } else {
      for(let i = this.currentWizardStepIndex; i < stepIndex; i++) {
        const step = this.wizardSteps[i];
  
        stepsToSkip += step.$modal && !step.isModalDispled ? 2 : 1;
      }
    }
    console.log('stepsToSkip:', stepsToSkip);
    return stepsToSkip;
  }

  onStartNextWizardStep(section, startNextStepOrig) {
    const currentStep = section.getCurrentStep();
    
    startNextStepOrig.call(section);

    
    if(!currentStep.hide) {
      console.log(currentStep.title, currentStep);
      
      this.currentWizardStep = currentStep;
      this.currentWizardStepIndex++;

      const bvgoTitleDataset = 'data-bvgo-overlay-step-title';
      const bvgoStepClass = '.bvgo-overlay-wizard-step';
      const bvgoModalClass = '.bvgo-overlay-wizard-step-modal';
      const bvgoStepElement = document.querySelector(`[${bvgoTitleDataset}="${currentStep.title}"]`);
      const bvgoActiveStepElement = document.querySelector(`${bvgoStepClass}.active`);

      const onModalShown = () => {
        document.querySelector(`[${bvgoTitleDataset}="${currentStep.title}"] ${bvgoModalClass}`)?.classList.add('active');

        currentStep.$modal.off('show.bs.modal', onModalShown);

        if(this.areStepsBeingSkipped) {
          this.skipStep();
        }
      };

      bvgoActiveStepElement?.classList.remove('active');
      bvgoActiveStepElement?.classList.add('completed');
      
      bvgoStepElement?.classList.add('active');

      if(currentStep.$modal) {
        currentStep.$modal.on('show.bs.modal', onModalShown);
      }

      document.querySelector(`${bvgoModalClass}.active`)?.classList.add('completed');
      document.querySelector(`${bvgoModalClass}.active`)?.classList.remove('active');

      if(this.areStepsBeingSkipped) {
        this.skipStep();
      }
    }
  }

  registerWizardReadyListener() {
    window.addEventListener('message', e => {
      if(e.data.type === 'bvgo-app-wizard-ready') {
        this.wizard = window.bvgoWizardManager;

        this.generateWizardSteps();
      }
    });
  }

  generateWizardSteps() {
    console.log('Generating wizard steps...');

    if(this.wizard?.sections?.length) {
      // default currentWizardStep to first section's first step
      this.currentWizardStep = this.wizard.sections[0]?.steps[0];

      // flatten wizard steps
      this.wizardSteps = this.wizard.sections
        .reduce((acc, section) => {
          // intercept section startNextStep methods so extension can perform logic when each step starts
          section.startNextStep = this.onStartNextWizardStep.bind(this, section, section.startNextStep);
          
          acc.push(...section.steps);
          
          return acc;
        }, [])
        .filter(step => !step.hide);

      this.wizardSteps.forEach(({$modal, duration, title}, index) => {
        const stepElement = document.createElement('div');
        const titleElement = document.createElement('div');
        const modalElement = document.createElement('div');

        stepElement.classList.add('bvgo-overlay-wizard-step');
        stepElement.setAttribute('data-bvgo-overlay-step-index', index);
        stepElement.setAttribute('data-bvgo-overlay-step-title', title);
        stepElement.title = `Duration: ${duration}`;

        if(!index) {
          stepElement.classList.add('active');
        }

        stepElement.addEventListener('click', e => {
          this.skipToStep(e.currentTarget.dataset.bvgoOverlayStepIndex);
        });

        titleElement.classList.add('bvgo-overlay-wizard-step-title');
        titleElement.innerHTML = title;

        modalElement.classList.add('bvgo-overlay-wizard-step-modal');
        modalElement.title = 'Step contains a modal';

        stepElement.append(titleElement);
        
        if($modal) {
          stepElement.append(modalElement);
        }

        this.wizardStepsContainer.append(stepElement);
      });
    }
  }

  addListeners() {
    this.onDragMouseDownHandler = this.onDragMouseDownHandler.bind(this);
    this.onDragMouseMoveHandler = this.onDragMouseMoveHandler.bind(this);
    this.onDragMouseUpHandler = this.onDragMouseUpHandler.bind(this);
    this.toggleContainer = this.toggleContainer.bind(this);

    if(this.containerMouseFades) {
      this.container.addEventListener('mouseover', () => this.container.classList.remove('inactive'));
      this.container.addEventListener('mouseout', () => this.container.classList.add('inactive'));
    }

    this.attachMouseOrTouchListener(this.titlebar, 'add', 'mousedown', this.onDragMouseDownHandler);

    this.containerToggleBtn.addEventListener('click', this.toggleContainer);

    [this.title, this.containerToggleBtn].forEach(elem => {
      elem.addEventListener('mousedown', e => {
        e.stopPropagation();
      })
    });

    this.title.addEventListener('click', BVGO.triggerBVGO);
  }

  getEventXYPosition(e) {
    return {
      clientX: e.touches ? e.touches[0].clientX : e.clientX,
      clientY: e.touches ? e.touches[0].clientY : e.clientY,
    };
  }

  onDragMouseDownHandler(e) {
    const { clientX, clientY } = this.getEventXYPosition(e);

    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.dragStartOffsetLeft = this.container.offsetLeft;
    this.dragStartOffsetTop = this.container.offsetTop;

    this.attachMouseOrTouchListener(document, 'add', 'mousemove', this.onDragMouseMoveHandler, { passive: false });
    this.attachMouseOrTouchListener(document, 'add', 'mouseup', this.onDragMouseUpHandler);
  }

  onDragMouseMoveHandler(e) {
    const { clientX, clientY } = this.getEventXYPosition(e);
    const x = clientX - this.dragStartX;
    const y = clientY - this.dragStartY;
    
    this.container.style.left = (this.dragStartOffsetLeft + x) + 'px';
    this.container.style.top = (this.dragStartOffsetTop + y) + 'px';

    e.preventDefault();
  }

  attachMouseOrTouchListener(elem, addOrRemove, eventType, handler, options) {
    const eventTypeMapping = {
      mouseup: 'touchend',
      mousemove: 'touchmove',
      mousedown: 'touchstart',
    };

    if('ontouchstart' in window) {
      eventType = eventTypeMapping[eventType];
    }

    elem[`${addOrRemove}EventListener`](eventType, handler, options);
  }

  onDragMouseUpHandler() {
    this.attachMouseOrTouchListener(document, 'remove', 'mousemove', this.onDragMouseMoveHandler);
    this.attachMouseOrTouchListener(document, 'remove', 'mouseup', this.onDragMouseUpHandler);
  }

  toggleContainer() {
    this.isCollapsed = !this.isCollapsed;

    if(this.isCollapsed) {
      this.container.classList.remove('expanded');
      this.container.classList.add('collapsed');
    } else {
      this.container.classList.remove('collapsed');
      this.container.classList.add('expanded');
    }
  }

  build() {
    console.log('pageType:', this.pageType);
    this.container = document.createElement('div');
    this.container.classList.add('bvgo-overlay-container');

    this.container.classList.add(this.collapsedByDefault ? 'collapsed' : 'expanded');
    
    if(this.containerMouseFades) {
      this.container.classList.add('inactive');
    }

    this.titlebar = document.createElement('div');
    this.titlebar.classList.add('bvgo-overlay-titlebar');
    
    this.title = document.createElement('div');
    this.title.classList.add('bvgo-overlay-title');
    this.title.setAttribute('title', 'Click to trigger BVGO');
    this.title.innerHTML = 'BVGO';

    this.containerToggleBtn = document.createElement('span');
    this.containerToggleBtn.classList.add('bvgo-overlay-toggle-btn');
    this.containerToggleBtn.setAttribute('role', 'button');
    this.containerToggleBtn.setAttribute('title', 'Click to collapse BVGO window');

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