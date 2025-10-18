(function () {
  'use strict';

  function loadMyAttendance() {
    YSP.utils.callServer(
      'getMyAttendance',
      [],
      function (res) {
        var rows = (res && res.data) || res || [];
        renderAttendanceTable(rows);
      },
      function (err) {
        console.error(err);
        toast('Unable to load attendance records.');
      },
      [
        { date: '2024-01-12', event: 'Leadership Summit', timeIn: '08:00', timeOut: '17:00' },
        { date: '2024-02-05', event: 'Community Outreach', timeIn: '09:00', timeOut: '15:00' },
      ]
    );
  }

  function renderAttendanceTable(rows) {
    var tbody = $('#attendance-rows');
    if (!tbody) {
      return;
    }
    tbody.innerHTML = '';
    if (!rows || !rows.length) {
      var empty = document.createElement('tr');
      empty.innerHTML = '<td colspan="4" class="muted">No attendance records yet.</td>';
      tbody.appendChild(empty);
      return;
    }
    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' +
        esc(row.date || row[0] || '') +
        '</td><td>' +
        esc(row.event || row[1] || '') +
        '</td><td>' +
        esc(row.timeIn || row[2] || '') +
        '</td><td>' +
        esc(row.timeOut || row[3] || '') +
        '</td>';
      tbody.appendChild(tr);
    });
  }

  window.loadMyAttendance = loadMyAttendance;
  window.renderAttendanceTable = renderAttendanceTable;
})();
