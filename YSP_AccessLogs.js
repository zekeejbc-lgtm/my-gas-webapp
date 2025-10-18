(function () {
  'use strict';

  function loadAccessLogs() {
    YSP.utils.callServer(
      'getAccessLogs',
      [],
      function (res) {
        var rows = (res && res.data) || res || [];
        renderAccessLogs(rows);
      },
      function (err) {
        console.error(err);
        toast('Unable to load access logs.');
      },
      [
        { timestamp: '2024-02-10 09:30', id: 'YSP0001', name: 'Juan Dela Cruz' },
      ]
    );
  }

  function renderAccessLogs(rows) {
    var tbody = $('#access-log-rows');
    if (!tbody) {
      return;
    }
    tbody.innerHTML = '';
    if (!rows || !rows.length) {
      var empty = document.createElement('tr');
      empty.innerHTML = '<td colspan="3" class="muted">No logs yet.</td>';
      tbody.appendChild(empty);
      return;
    }
    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' +
        esc(row.timestamp || row[0] || '') +
        '</td><td>' +
        esc(row.id || row.code || row[1] || '') +
        '</td><td>' +
        esc(row.name || row.fullName || row[2] || '') +
        '</td>';
      tbody.appendChild(tr);
    });
  }

  window.loadAccessLogs = loadAccessLogs;
})();
