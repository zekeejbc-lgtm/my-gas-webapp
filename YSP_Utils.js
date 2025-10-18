(function () {
  'use strict';

  var isReady = false;
  var readyQueue = [];
  var toastTimers = [];
  var toastRoot = null;

  YSP.state = YSP.state || { session: null };

  function onReady(fn) {
    if (typeof fn !== 'function') {
      return;
    }
    if (isReady) {
      fn();
    } else {
      readyQueue.push(fn);
    }
  }

  function flushReady() {
    if (isReady) {
      return;
    }
    isReady = true;
    readyQueue.splice(0).forEach(function (fn) {
      try {
        fn();
      } catch (err) {
        console.error('onReady handler failed', err);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', flushReady, { once: true });
  } else {
    flushReady();
  }

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function resolveFunction(path) {
    if (!path) {
      return null;
    }
    return String(path)
      .split('.')
      .reduce(function (acc, key) {
        if (acc && acc[key] != null) {
          return acc[key];
        }
        return undefined;
      }, window);
  }

  function show(id) {
    if (!id) {
      return;
    }
    var target = document.getElementById(id);
    if (!target) {
      console.warn('Panel not found', id);
      return;
    }
    $$('.panel').forEach(function (panel) {
      var isTarget = panel === target;
      panel.classList.toggle('active', isTarget);
      panel.classList.toggle('hidden', !isTarget);
    });
    try {
      if (typeof history.replaceState === 'function') {
        history.replaceState(null, '', '#' + id);
      } else {
        window.location.hash = id;
      }
    } catch (err) {
      // ignore
    }
    var handlerName = target.getAttribute('data-load');
    var handler = resolveFunction(handlerName);
    if (typeof handler === 'function') {
      try {
        handler(target);
      } catch (err) {
        console.error('Panel load handler failed', handlerName, err);
      }
    }
    target.dispatchEvent(new CustomEvent('panel:show', { detail: { panel: target } }));
  }

  function ensureToastRoot() {
    if (!toastRoot) {
      toastRoot = document.getElementById('toast-root');
      if (!toastRoot) {
        toastRoot = document.createElement('div');
        toastRoot.id = 'toast-root';
        toastRoot.className = 'toast-container';
        document.body.appendChild(toastRoot);
      }
    }
    toastRoot.classList.add('toast-container');
    return toastRoot;
  }

  function toast(message, opts) {
    var root = ensureToastRoot();
    var text = message ? String(message) : 'Action completed.';
    var toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.textContent = text;
    root.appendChild(toastEl);

    var duration = (opts && opts.duration) || 3200;
    var timer = window.setTimeout(function () {
      toastEl.classList.add('is-leaving');
      toastEl.addEventListener(
        'transitionend',
        function () {
          toastEl.remove();
        },
        { once: true }
      );
      toastEl.style.opacity = '0';
    }, duration);
    toastTimers.push(timer);
    return toastEl;
  }

  function openSafe(url) {
    try {
      var trimmed = String(url || '').trim();
      if (!trimmed) {
        return;
      }
      var withProto = /^https?:/i.test(trimmed) ? trimmed : 'https://' + trimmed;
      var parsed = new URL(withProto);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }
      var win = window.open(parsed.toString(), '_blank', 'noopener');
      if (win) {
        win.opener = null;
      }
    } catch (err) {
      console.warn('Unable to open link', err);
      toast('Cannot open link. Please try again later.');
    }
  }

  function hasServer() {
    return (
      typeof google !== 'undefined' &&
      google.script &&
      google.script.run &&
      typeof google.script.run.withSuccessHandler === 'function'
    );
  }

  function callServer(method, args, onSuccess, onFailure, mock) {
    var params = Array.isArray(args) ? args : [];
    var successHandler = typeof onSuccess === 'function' ? onSuccess : function () {};
    var failureHandler = typeof onFailure === 'function' ? onFailure : function (err) {
      console.error('Server call failed', method, err);
      toast('Something went wrong.');
    };

    if (hasServer()) {
      try {
        var runner = google.script.run
          .withSuccessHandler(function (response) {
            successHandler(response);
          })
          .withFailureHandler(function (error) {
            failureHandler(error);
          });
        if (typeof runner[method] === 'function') {
          runner[method].apply(runner, params);
        } else {
          throw new Error('Method ' + method + ' not found');
        }
      } catch (err) {
        failureHandler(err);
      }
    } else {
      window.setTimeout(function () {
        if (mock !== undefined) {
          successHandler(mock);
        } else {
          failureHandler(new Error('Offline preview')); 
        }
      }, 150);
    }
  }

  function bindBackButtons() {
    $$('.back-btn').forEach(function (btn) {
      if (btn.dataset.bound === '1') {
        return;
      }
      btn.dataset.bound = '1';
      btn.addEventListener('click', function (event) {
        event.preventDefault();
        var explicit = btn.getAttribute('data-target');
        var parentPanel = btn.closest('.panel');
        var fallback = parentPanel && parentPanel.id === 'homepage-panel' ? 'login-panel' : 'main-menu-panel';
        var target = explicit || fallback;
        if (parentPanel && parentPanel.id === 'homepage-panel') {
          // ensure homepage back always returns to login
          target = 'login-panel';
        }
        if (btn.id === 'logout-btn') {
          target = 'login-panel';
        }
        show(target);
      });
    });
  }

  window.onReady = onReady;
  window.$ = $;
  window.$$ = $$;
  window.esc = esc;
  window.show = show;
  window.toast = toast;
  window.openSafe = openSafe;
  window.bindBackButtons = bindBackButtons;
  YSP.utils = YSP.utils || {};
  YSP.utils.callServer = callServer;
  YSP.utils.hasServer = hasServer;
  YSP.utils.resolveFunction = resolveFunction;
})();
