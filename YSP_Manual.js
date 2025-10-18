(function () {
  'use strict';

  var manualBound = false;
  var manualSelected = null;
  var manualDebounce = null;

  function setupManualAttendance() {
    populateActiveEvents('#manual-event');
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
      window.clearTimeout(manualDebounce);
      manualDebounce = window.setTimeout(function () {
        fetchManualSuggestions(query);
      }, query ? 200 : 0);
    });
    list.addEventListener('click', function (event) {
      var item = event.target.closest('li[data-id]');
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
    YSP.utils.callServer(
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
          li.innerHTML = '<strong>' + esc(name) + '</strong><span class="muted">' + esc(id || '') + '</span>';
          list.appendChild(li);
        });
      },
      function (err) {
        console.error(err);
        toast('Unable to load suggestions.');
      },
      [{ id: 'YSP0001', name: 'Juan Dela Cruz' }]
    );
  }

  function submitManual(action) {
    var eventSelect = $('#manual-event');
    var eventId = eventSelect && eventSelect.value;
    if (!manualSelected || !manualSelected.id) {
      toast('Select a member first.');
      return;
    }
    if (!eventId) {
      toast('Choose an event.');
      return;
    }
    YSP.utils.callServer(
      'manualAttendance',
      [manualSelected.id, eventId, action],
      function (res) {
        toast(res && res.message ? res.message : 'Attendance saved.');
      },
      function (err) {
        console.error(err);
        toast('Unable to record attendance.');
      },
      { success: true, message: 'Attendance recorded.' }
    );
  }

  window.setupManualAttendance = setupManualAttendance;
  window.bindManualAttendance = bindManualAttendance;
})();
