(function (root) {
  'use strict';

  if (!root) {
    return;
  }

  var globalYsp = (root.YSP = root.YSP || {});
  var utils = (globalYsp.utils = globalYsp.utils || {});
  var callServer = typeof utils.callServer === 'function' ? utils.callServer : function () {};
  var safeToast = typeof root.toast === 'function' ? root.toast : function () {};
  var select = typeof root.$ === 'function' ? root.$ : function () { return null; };
  var escapeHtml = typeof root.esc === 'function' ? root.esc : function (value) {
    return String(value == null ? '' : value);
  };

  function loadAccessLogs() {
    callServer(
      'getAccessLogs',
      [],
      function (res) {
        var rows = (res && res.data) || res || [];
        renderAccessLogs(rows);
      },
      function (err) {
        if (root.console && typeof root.console.error === 'function') {
          root.console.error(err);
        }
        safeToast('Unable to load access logs.');
      },
      [
        { timestamp: '2024-02-10 09:30', id: 'YSP0001', name: 'Juan Dela Cruz' },
      ]
    );
  }

  function renderAccessLogs(rows) {
    var tbody = select('#access-log-rows');
    if (!tbody) {
      return;
    }
    tbody.innerHTML = '';
    if (!rows || !rows.length) {
      var empty = root.document ? root.document.createElement('tr') : null;
      if (empty) {
        empty.innerHTML = '<td colspan="3" class="muted">No logs yet.</td>';
        tbody.appendChild(empty);
      }
      return;
    }
    rows.forEach(function (row) {
      var tr = root.document ? root.document.createElement('tr') : null;
      if (!tr) {
        return;
      }
      tr.innerHTML =
        '<td>' +
        escapeHtml(row.timestamp || row[0] || '') +
        '</td><td>' +
        escapeHtml(row.id || row.code || row[1] || '') +
        '</td><td>' +
        escapeHtml(row.name || row.fullName || row[2] || '') +
        '</td>';
      tbody.appendChild(tr);
    });
  }

  globalYsp.accessLogs = globalYsp.accessLogs || {};
  globalYsp.accessLogs.loadAccessLogs = loadAccessLogs;
  globalYsp.accessLogs.renderAccessLogs = renderAccessLogs;

  if (typeof root.loadAccessLogs !== 'function') {
    root.loadAccessLogs = loadAccessLogs;
  }
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : null);
