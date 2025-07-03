export class TooltipHandler {
  constructor(uiUtils) {
    this.uiUtils = uiUtils;
    this.initializeScrollListener();
  }

  initializeScrollListener() {
    // Use capture to catch the event early.
    window.addEventListener('scroll', () => {
      // Close active mobile tooltips
      const activeMobileTooltip = document.querySelector('.tooltip.active');
      if (activeMobileTooltip) {
        const backdrop = document.getElementById('tooltip-backdrop');
        const questionSpan = document.querySelector('.item-description.active');
        activeMobileTooltip.classList.remove('active');
        if (backdrop) backdrop.classList.remove('active');
        if (questionSpan) questionSpan.classList.remove('active');
      }

      // Close sticky desktop tooltips
      const stickyDesktopTooltipButton = document.querySelector('.item-description.sticky');
      if (stickyDesktopTooltipButton) {
        const tooltip = stickyDesktopTooltipButton.querySelector('.tooltip');
        const backdrop = document.getElementById('tooltip-backdrop');
        stickyDesktopTooltipButton.classList.remove('sticky');
        if (tooltip) tooltip.classList.remove('sticky', 'visible');
        if (backdrop) backdrop.classList.remove('active');
      }
    }, true);
  }

  createTooltip(item) {
    if (this.uiUtils.isMobile()) {
      return this.createMobileTooltip(item);
    } else {
      return this.createDesktopTooltip(item);
    }
  }

  createMobileTooltip(item) {
    const questionSpan = document.createElement('span');
    questionSpan.classList.add('item-description');
    questionSpan.textContent = '?';

    const tooltipBackdrop = document.getElementById('tooltip-backdrop');

    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltip');
    tooltip.addEventListener('click', (e) => e.stopPropagation());

    const tooltipText = document.createElement('div');
    const description = item.description || 'Sem descrição';
    tooltipText.innerHTML = description.replace(/\n/g, '<br>');

    tooltip.appendChild(tooltipText);
    // Append to body to avoid being clipped by parent elements with overflow:hidden
    document.body.appendChild(tooltip);

    const closeTooltip = () => {
      tooltip.classList.remove('active');
      tooltipBackdrop.classList.remove('active');
      questionSpan.classList.remove('active');
    };

    tooltipBackdrop.addEventListener('click', closeTooltip);
    window.addEventListener('click', () => {
      if (tooltip.classList.contains('active')) {
        closeTooltip();
      }
    }, true);

    questionSpan.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      // Close any other open tooltips first
      document.querySelectorAll('.tooltip.active').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.item-description.active').forEach(d => d.classList.remove('active'));
      
      const wasActive = tooltip.classList.contains('active');
      
      if (wasActive) {
        closeTooltip();
      } else {
        tooltip.classList.add('active');
        tooltipBackdrop.classList.add('active');
        questionSpan.classList.add('active');
      }
    });

    return questionSpan;
  }

  createDesktopTooltip(item) {
    const explanationButton = document.createElement('span');
    explanationButton.classList.add('item-description');
    explanationButton.textContent = '?';

    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltip');
    tooltip.addEventListener('click', (e) => e.stopPropagation());

    const tooltipText = document.createElement('div');
    const description = item.description || 'Sem descrição';
    tooltipText.innerHTML = description.replace(/\n/g, '<br>');

    tooltip.appendChild(tooltipText);
    explanationButton.appendChild(tooltip);

    const backdrop = document.getElementById('tooltip-backdrop');

    const unstick = () => {
        explanationButton.classList.remove('sticky');
        tooltip.classList.remove('sticky', 'visible');
        backdrop.classList.remove('active');
    };
    
    backdrop.addEventListener('click', () => {
        if(explanationButton.classList.contains('sticky')) {
            unstick();
        }
    });

    // Close on click outside for desktop sticky tooltips
    window.addEventListener('click', () => {
        if(explanationButton.classList.contains('sticky')) {
            unstick();
        }
    }, true);

    explanationButton.addEventListener('mouseenter', () => {
        if (!explanationButton.classList.contains('sticky')) {
            tooltip.classList.add('visible');
        }
    });

    explanationButton.addEventListener('mouseleave', () => {
        if (!explanationButton.classList.contains('sticky')) {
            tooltip.classList.remove('visible');
        }
    });

    explanationButton.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const isSticky = explanationButton.classList.contains('sticky');
        
        // Hide any other sticky tooltips before showing a new one
        document.querySelectorAll('.item-description.sticky').forEach(btn => {
            if (btn !== explanationButton) {
                btn.classList.remove('sticky');
                btn.querySelector('.tooltip')?.classList.remove('sticky', 'visible');
            }
        });
        
        if (isSticky) {
            unstick();
        } else {
            explanationButton.classList.add('sticky');
            tooltip.classList.add('sticky', 'visible');
            backdrop.classList.add('active');
        }
    });

    return explanationButton;
  }

  createTooltipCloseButton() {
    const closeButton = document.createElement('button');
    closeButton.classList.add('tooltip-close');
    closeButton.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 1L1 13M1 1l12 12" stroke="#666" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
    return closeButton;
  }
}
