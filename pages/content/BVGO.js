class BVGO {
  static isBRP() {
    return document.querySelector('.wizContent');
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

    this.isCollapsed = this.collapsedByDefault;

    this.build();

    this.addListeners();

    this.registerWizardReadyListener();
  }

  onStartNextWizardStep(section, startNextStepOrig) {
    const currentStep = section.getCurrentStep();

    this.currentWizardStep = currentStep;
    
    startNextStepOrig.call(section);

    if(!currentStep.hide) {
      console.log(currentStep.title, currentStep);

      const bvgoTitleDataset = 'data-bvgo-overlay-step-title';
      const bvgoStepClass = '.bvgo-overlay-wizard-step';
      const bvgoModalClass = '.bvgo-overlay-wizard-step-modal';
      const bvgoStepElement = document.querySelector(`[${bvgoTitleDataset}="${currentStep.title}"]`);
      const bvgoActiveStepElement = document.querySelector(`${bvgoStepClass}.active`);

      bvgoActiveStepElement?.classList.remove('active');
      
      bvgoStepElement?.classList.add('active');

      if(currentStep.$modal) {
        currentStep.$modal.on('show.bs.modal', onModalShown);
      }

      function onModalShown() {
        document.querySelector(`[${bvgoTitleDataset}="${currentStep.title}"] ${bvgoModalClass}`)?.classList.add('active');

        currentStep.$modal.off('show.bs.modal', onModalShown);
      }

      document.querySelector(`${bvgoModalClass}.active`)?.classList.remove('active');
    }
  }

  registerWizardReadyListener() {
    window.addEventListener('message', e => {
      if(e.data.type === 'bvgo-app-wizard-ready') {
        console.log('wizard ready:', window.bvgoWizardManager);

        this.wizard = window.bvgoWizardManager;

        // intercept section startNextStep so extension can perform logic when each step starts
        this.wizard.sections.forEach(section => {
          section.startNextStep = this.onStartNextWizardStep.bind(this, section, section.startNextStep);
        });

        this.generateWizardSteps(window.bvgoWizardManager);
      }
    });
  }

  generateWizardSteps(wizard) {
    console.log('Generating wizard steps...');

    if(wizard?.sections?.length) {
      wizard.sections.reduce((acc, curr) => {
        acc.push(...curr.steps);
        return acc;
      }, [])
      .filter(step => !step.hide)
      .forEach(({$modal, duration, title}, index) => {
        const stepElement = document.createElement('div');
        const titleElement = document.createElement('div');
        const modalElement = document.createElement('div');

        stepElement.classList.add('bvgo-overlay-wizard-step');
        stepElement.setAttribute('data-bvgo-overlay-step-index', index);
        stepElement.setAttribute('data-bvgo-overlay-step-title', title);
        stepElement.title = `Duration: ${duration}`;

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
    this.onDragMouseMoveHandler = this.onDragMouseMoveHandler.bind(this);
    this.onDragMouseUpHandler = this.onDragMouseUpHandler.bind(this);
    this.toggleContainer = this.toggleContainer.bind(this);

    if(this.containerMouseFades) {
      this.container.addEventListener('mouseover', () => this.container.classList.remove('inactive'));
      this.container.addEventListener('mouseout', () => this.container.classList.add('inactive'));
    }

    this.titlebar.addEventListener('mousedown', e => {
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.dragStartOffsetLeft = this.container.offsetLeft;
      this.dragStartOffsetTop = this.container.offsetTop;

      document.addEventListener('mousemove', this.onDragMouseMoveHandler);
      document.addEventListener('mouseup', this.onDragMouseUpHandler);
    });

    this.containerToggleBtn.addEventListener('click', this.toggleContainer);

    [this.title, this.containerToggleBtn].forEach(elem => {
      elem.addEventListener('mousedown', e => {
        e.stopPropagation();
      })
    });

    this.title.addEventListener('click', BVGO.triggerBVGO);
  }

  onDragMouseMoveHandler(e) {
    const x = e.clientX - this.dragStartX;
    const y = e.clientY - this.dragStartY;
    
    this.container.style.left = (this.dragStartOffsetLeft + x) + 'px';
    this.container.style.top = (this.dragStartOffsetTop + y) + 'px';

    e.preventDefault();
  }

  onDragMouseUpHandler() {
    document.removeEventListener('mousemove', this.onDragMouseMoveHandler);
    document.removeEventListener('mouseup', this.onDragMouseUpHandler);
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