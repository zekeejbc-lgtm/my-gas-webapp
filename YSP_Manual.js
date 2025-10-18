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
    root.setupManualAttendance = root.setupManualAttendance || function () {};
    root.bindManualAttendance = root.bindManualAttendance || function () {};
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
  var setTimeoutFn = typeof root.setTimeout === 'function' ? root.setTimeout.bind(root) : function (fn) {
    fn();
  };
  var clearTimeoutFn = typeof root.clearTimeout === 'function' ? root.clearTimeout.bind(root) : function () {};

  var manualBound = false;
  var manualSelected = null;
  var manualDebounce = null;

  function setupManualAttendance() {
    if (typeof root.populateActiveEvents === 'function') {
      root.populateActiveEvents('#manual-event');
    }
    var suggestions = $('#manual-suggestions');
    if (suggestions) {
      suggestions.innerHTML = '';
    }
    manualSelected = null;
  }

  function bindManualAttendance() {
    if (manualBound) {
      return;
    }
    var input = $('#manual-member');
    var list = $('#manual-suggestions');
    var btnIn = $('#manual-in');
    var btnOut = $('#manual-out');
    if (!input || !list) {
      return;
    }
    manualBound = true;
    input.addEventListener('input', function () {
      var query = input.value.trim();
      clearTimeoutFn(manualDebounce);
      manualDebounce = setTimeoutFn(function () {
        fetchManualSuggestions(query);
      }, query ? 200 : 0);
    });
    list.addEventListener('click', function (event) {
      var item = event.target && event.target.closest ? event.target.closest('li[data-id]') : null;
      if (!item) {
        return;
      }
      manualSelected = {
        id: item.getAttribute('data-id'),
        name: item.getAttribute('data-name'),
      };
      input.value = manualSelected.name;
      list.innerHTML = '';
    });
    if (btnIn) {
      btnIn.addEventListener('click', function () {
        submitManual('in');
      });
    }
    if (btnOut) {
      btnOut.addEventListener('click', function () {
        submitManual('out');
      });
    }
  }

  function fetchManualSuggestions(query) {
    var list = $('#manual-suggestions');
    if (!list) {
      return;
    }
    list.innerHTML = '';
    if (!query) {
      return;
    }
    callServer(
      'officerSuggestions',
      [query],
      function (res) {
        var suggestions = (res && res.data) || res || [];
        suggestions.forEach(function (item) {
          var li = document.createElement('li');
          var id = item.id || item.memberId || item.code;
          var name = item.name || item.fullName || 'Member';
          li.dataset.id = id;
          li.dataset.name = name;
          li.innerHTML = '<strong>' + escFn(name) + '</strong><span class="muted">' + escFn(id || '') + '</span>';
          list.appendChild(li);
        });
      },
      function (err) {
        if (root.console && typeof root.console.error === 'function') {
          root.console.error(err);
        }
        toastFn('Unable to load suggestions.');
      },
      [{ id: 'YSP0001', name: 'Juan Dela Cruz' }]
    );
  }

  function submitManual(action) {
    var eventSelect = $('#manual-event');
    var eventId = eventSelect && eventSelect.value;
    if (!manualSelected || !manualSelected.id) {
      toastFn('Select a member first.');
      return;
    }
    if (!eventId) {
      toastFn('Choose an event.');
      return;
    }
    callServer(
      'manualAttendance',
      [manualSelected.id, eventId, action],
      function (res) {
        toastFn(res && res.message ? res.message : 'Attendance saved.');
      },
      function (err) {
        if (root.console && typeof root.console.error === 'function') {
          root.console.error(err);
        }
        toastFn('Unable to record attendance.');
      },
      { success: true, message: 'Attendance recorded.' }
    );
  }

  root.YSP = root.YSP || {};
  root.YSP.manual = root.YSP.manual || {};
  root.YSP.manual.setupManualAttendance = setupManualAttendance;
  root.YSP.manual.bindManualAttendance = bindManualAttendance;

  root.setupManualAttendance = setupManualAttendance;
  root.bindManualAttendance = bindManualAttendance;
});
