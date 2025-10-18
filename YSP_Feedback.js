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

  if (!root) {
    return;
  }

  if (!root.document) {
    root.loadMyFeedback = root.loadMyFeedback || function () {};
    root.loadFeedbackAdmin = root.loadFeedbackAdmin || function () {};
    return;
  }

  var $ = typeof root.$ === 'function' ? root.$ : function () { return null; };
  var toastFn = typeof root.toast === 'function' ? root.toast : function () {};
  var callServer = root.YSP && root.YSP.utils && typeof root.YSP.utils.callServer === 'function'
    ? root.YSP.utils.callServer
    : function () {};
  var escFn = typeof root.esc === 'function'
    ? root.esc
    : function (value) {
        return String(value == null ? '' : value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      };

  var feedbackBound = false;

  function loadMyFeedback() {
    if (!feedbackBound) {
      var sendBtn = $('#btn-send-feedback');
      if (sendBtn) {
        feedbackBound = true;
        sendBtn.addEventListener('click', submitFeedback);
      }
    }
    callServer(
      'listMyFeedback',
      [],
      function (res) {
        var list = (res && res.data) || res || [];
        renderFeedbackList('#my-feedback-list', list, true);
      },
      function (err) {
        if (root.console && typeof root.console.error === 'function') {
          root.console.error(err);
        }
        toastFn('Unable to load your feedback.');
      },
      [
        { id: 'FB-001', body: 'Great job on the last outreach!', createdAt: '2024-02-01' },
      ]
    );
  }

  function submitFeedback() {
    var textarea = $('#feedback-text');
    if (!textarea) {
      return;
    }
    var text = String(textarea.value || '').trim();
    if (!text) {
      toastFn('Please write your feedback first.');
      return;
    }
    callServer(
      'sendFeedback',
      [text],
      function (res) {
        textarea.value = '';
        toastFn(res && res.message ? res.message : 'Feedback submitted.');
        loadMyFeedback();
      },
      function (err) {
        if (root.console && typeof root.console.error === 'function') {
          root.console.error(err);
        }
        toastFn('Unable to send feedback.');
      },
      { success: true, message: 'Feedback received. Thank you!' }
    );
  }

  function loadFeedbackAdmin() {
    callServer(
      'listAllFeedback',
      [],
      function (res) {
        var list = (res && res.data) || res || [];
        renderFeedbackList('#feedback-admin-list', list, false);
      },
      function (err) {
        if (root.console && typeof root.console.error === 'function') {
          root.console.error(err);
        }
        toastFn('Unable to load feedback inbox.');
      },
      [
        { id: 'FB-100', body: 'Request more leadership workshops.', member: 'Maria Santos', createdAt: '2024-02-12' },
      ]
    );
  }

  function renderFeedbackList(selector, list, includeDate) {
    var container = typeof selector === 'string' ? $(selector) : selector;
    if (!container) {
      return;
    }
    container.innerHTML = '';
    if (!list || !list.length) {
      container.innerHTML = '<p class="muted">No feedback yet.</p>';
      return;
    }
    list.forEach(function (item) {
      var card = document.createElement('article');
      card.className = 'card feedback-card';
      var header = item.member ? '<h3>' + escFn(item.member) + '</h3>' : '';
      var date = includeDate || item.createdAt ? '<p class="muted">' + escFn(item.createdAt || '') + '</p>' : '';
      card.innerHTML = header + '<p>' + escFn(item.body || '') + '</p>' + date;
      container.appendChild(card);
    });
  }

  root.YSP = root.YSP || {};
  root.YSP.feedback = root.YSP.feedback || {};
  root.YSP.feedback.loadMyFeedback = loadMyFeedback;
  root.YSP.feedback.loadFeedbackAdmin = loadFeedbackAdmin;

  root.loadMyFeedback = loadMyFeedback;
  root.loadFeedbackAdmin = loadFeedbackAdmin;
});
