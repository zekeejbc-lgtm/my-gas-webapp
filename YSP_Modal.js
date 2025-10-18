(function (factory) {
  var root;
  if (typeof window !== 'undefined') {
    root = window;
  } else if (typeof self !== 'undefined') {
    root = self;
  } else if (typeof globalThis !== 'undefined') {
    root = globalThis;
  } else {
    try {
      root = Function('return this')();
    } catch (err) {
      root = {};
    }
  }
  factory(root || {});
})(function (root) {
  'use strict';

  if (!root || !root.document) {
    return;
  }

  var doc = root.document;
  var body = doc.body || doc.documentElement;
  var modalRoot = null;
  var lastFocused = null;
  var trapHandler = null;
  var setTimeoutFn = typeof root.setTimeout === 'function' ? root.setTimeout.bind(root) : function (fn) {
    fn();
  };

  function ensureRoot() {
    if (!modalRoot) {
      modalRoot = doc.getElementById('modal-root');
      if (!modalRoot) {
        modalRoot = doc.createElement('div');
        modalRoot.id = 'modal-root';
        modalRoot.className = 'modal-root';
        modalRoot.hidden = true;
        if (body && typeof body.appendChild === 'function') {
          body.appendChild(modalRoot);
        }
      }
    }
    if (modalRoot) {
      modalRoot.classList.add('modal-root');
    }
    return modalRoot;
  }

  function focusables(panel) {
    var selectors =
      'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    if (!panel || typeof panel.querySelectorAll !== 'function') {
      return [];
    }
    var nodes = panel.querySelectorAll(selectors);
    var items = [];
    for (var i = 0; i < nodes.length; i += 1) {
      if (nodes[i].offsetParent !== null || nodes[i] === panel) {
        items.push(nodes[i]);
      }
    }
    if (!items.length) {
      panel.setAttribute('tabindex', '-1');
      items.push(panel);
    }
    return items;
  }

  function trapFocus(panel) {
    var items = focusables(panel);
    if (!items.length) {
      return;
    }
    var first = items[0];
    var last = items[items.length - 1];
    trapHandler = function (event) {
      if (event.key !== 'Tab') {
        return;
      }
      if (event.shiftKey) {
        if (doc.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener('keydown', trapHandler);
    setTimeoutFn(function () {
      if (first && typeof first.focus === 'function') {
        first.focus();
      }
    }, 20);
  }

  function removeTrap(panel) {
    if (panel && trapHandler) {
      panel.removeEventListener('keydown', trapHandler);
    }
    trapHandler = null;
  }

  function closeModal(opts) {
    if (!modalRoot) {
      return;
    }
    var skipRestore = opts && opts.skipFocusRestore;
    var panel = modalRoot.querySelector('.modal__panel');
    removeTrap(panel);
    modalRoot.innerHTML = '';
    modalRoot.hidden = true;
    if (body) {
      body.style.overflow = '';
    }
    if (!skipRestore && lastFocused && typeof lastFocused.focus === 'function') {
      try {
        lastFocused.focus();
      } catch (err) {
        // ignore focus errors
      }
    }
    lastFocused = null;
  }

  function showModal(config) {
    if (!doc || !body) {
      return null;
    }
    var options = config || {};
    ensureRoot();
    modalRoot.innerHTML = '';
    modalRoot.hidden = false;
    if (body) {
      body.style.overflow = 'hidden';
    }
    lastFocused = options.opener || doc.activeElement;

    var backdrop = doc.createElement('div');
    backdrop.className = 'modal-backdrop is-open';
    var modal = doc.createElement('div');
    modal.className = 'modal is-open';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    var panel = doc.createElement('div');
    panel.className = 'modal__panel';

    var header = doc.createElement('div');
    header.className = 'modal__header';
    var title = doc.createElement('h2');
    title.className = 'modal__title';
    title.textContent = options.title || 'Dialog';
    var closeBtn = doc.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'modal__close';
    closeBtn.setAttribute('aria-label', 'Close dialog');
    closeBtn.innerHTML = '&times;';
    closeBtn.dataset.close = '1';
    header.appendChild(title);
    header.appendChild(closeBtn);

    var bodySection = doc.createElement('div');
    bodySection.className = 'modal__body';
    bodySection.innerHTML = options.bodyHtml || '';

    var footer = doc.createElement('div');
    footer.className = 'modal__footer';
    footer.innerHTML = options.footerHtml || '<button type="button" class="btn btn-outline" data-close="1">Close</button>';

    panel.appendChild(header);
    panel.appendChild(bodySection);
    panel.appendChild(footer);
    modal.appendChild(panel);
    modalRoot.appendChild(backdrop);
    modalRoot.appendChild(modal);

    var closeElements = modalRoot.querySelectorAll('[data-close]');
    closeElements.forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeModal({ skipFocusRestore: !!btn.dataset.skipRestore });
      });
    });

    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop) {
        closeModal();
      }
    });

    function escListener(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
        doc.removeEventListener('keydown', escListener);
      }
    }

    doc.addEventListener('keydown', escListener);

    trapFocus(panel);

    return panel;
  }

  var globalYsp = (root.YSP = root.YSP || {});
  globalYsp.modal = globalYsp.modal || {};
  globalYsp.modal.showModal = showModal;
  globalYsp.modal.closeModal = closeModal;

  root.showModal = showModal;
  root.closeModal = closeModal;
});
