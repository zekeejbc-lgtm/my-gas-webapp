(function () {
  'use strict';

  var root = null;
  var lastFocused = null;
  var trapHandler = null;

  function ensureRoot() {
    if (!root) {
      root = document.getElementById('modal-root');
      if (!root) {
        root = document.createElement('div');
        root.id = 'modal-root';
        root.className = 'modal-root';
        root.hidden = true;
        document.body.appendChild(root);
      }
    }
    root.classList.add('modal-root');
    return root;
  }

  function focusables(panel) {
    var selectors =
      'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
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
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener('keydown', trapHandler);
    window.setTimeout(function () {
      first.focus();
    }, 20);
  }

  function removeTrap(panel) {
    if (panel && trapHandler) {
      panel.removeEventListener('keydown', trapHandler);
    }
    trapHandler = null;
  }

  function closeModal(opts) {
    if (!root) {
      return;
    }
    var skipRestore = opts && opts.skipFocusRestore;
    var panel = root.querySelector('.modal__panel');
    removeTrap(panel);
    root.innerHTML = '';
    root.hidden = true;
    document.body.style.overflow = '';
    if (!skipRestore && lastFocused && typeof lastFocused.focus === 'function') {
      try {
        lastFocused.focus();
      } catch (err) {
        // ignore
      }
    }
    lastFocused = null;
  }

  function showModal(config) {
    var options = config || {};
    ensureRoot();
    root.innerHTML = '';
    document.body.style.overflow = 'hidden';
    lastFocused = options.opener || document.activeElement;

    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop is-open';
    var modal = document.createElement('div');
    modal.className = 'modal is-open';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    var panel = document.createElement('div');
    panel.className = 'modal__panel';

    var header = document.createElement('div');
    header.className = 'modal__header';
    var title = document.createElement('h2');
    title.className = 'modal__title';
    title.textContent = options.title || 'Dialog';
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'modal__close';
    closeBtn.setAttribute('aria-label', 'Close dialog');
    closeBtn.innerHTML = '&times;';
    closeBtn.dataset.close = '1';
    header.appendChild(title);
    header.appendChild(closeBtn);

    var body = document.createElement('div');
    body.className = 'modal__body';
    body.innerHTML = options.bodyHtml || '';

    var footer = document.createElement('div');
    footer.className = 'modal__footer';
    footer.innerHTML = options.footerHtml || '<button type="button" class="btn btn-outline" data-close="1">Close</button>';

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);
    modal.appendChild(panel);
    root.appendChild(backdrop);
    root.appendChild(modal);
    root.hidden = false;

    var closeElements = root.querySelectorAll('[data-close]');
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
        document.removeEventListener('keydown', escListener);
      }
    }
    document.addEventListener('keydown', escListener);

    trapFocus(panel);

    return panel;
  }

  window.showModal = showModal;
  window.closeModal = closeModal;
})();
