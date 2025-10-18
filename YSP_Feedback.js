(function () {
  'use strict';

  var feedbackBound = false;

  function loadMyFeedback() {
    if (!feedbackBound) {
      var sendBtn = $('#btn-send-feedback');
      if (sendBtn) {
        feedbackBound = true;
        sendBtn.addEventListener('click', submitFeedback);
      }
    }
    YSP.utils.callServer(
      'listMyFeedback',
      [],
      function (res) {
        var list = (res && res.data) || res || [];
        renderFeedbackList('#my-feedback-list', list, true);
      },
      function (err) {
        console.error(err);
        toast('Unable to load your feedback.');
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
      toast('Please write your feedback first.');
      return;
    }
    YSP.utils.callServer(
      'sendFeedback',
      [text],
      function (res) {
        textarea.value = '';
        toast(res && res.message ? res.message : 'Feedback submitted.');
        loadMyFeedback();
      },
      function (err) {
        console.error(err);
        toast('Unable to send feedback.');
      },
      { success: true, message: 'Feedback received. Thank you!' }
    );
  }

  function loadFeedbackAdmin() {
    YSP.utils.callServer(
      'listAllFeedback',
      [],
      function (res) {
        var list = (res && res.data) || res || [];
        renderFeedbackList('#feedback-admin-list', list, false);
      },
      function (err) {
        console.error(err);
        toast('Unable to load feedback inbox.');
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
      var header = item.member ? '<h3>' + esc(item.member) + '</h3>' : '';
      var date = includeDate || item.createdAt ? '<p class="muted">' + esc(item.createdAt || '') + '</p>' : '';
      card.innerHTML = header + '<p>' + esc(item.body || '') + '</p>' + date;
      container.appendChild(card);
    });
  }

  window.loadMyFeedback = loadMyFeedback;
  window.loadFeedbackAdmin = loadFeedbackAdmin;
})();
