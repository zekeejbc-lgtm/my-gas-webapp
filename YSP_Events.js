(function () {
  'use strict';

  var eventsCache = null;
  var createBound = false;

  function loadEvents() {
    if (!createBound) {
      var createBtn = $('#btn-create-event');
      if (createBtn) {
        createBound = true;
        createBtn.addEventListener('click', openCreateEventModal);
      }
    }
    YSP.utils.callServer(
      'listEvents',
      [],
      function (res) {
        var list = (res && res.data) || res || [];
        eventsCache = list;
        renderEvents(list);
      },
      function (err) {
        console.error(err);
        toast('Unable to load events.');
      },
      [
        { id: 'EVT-001', name: 'Leadership Summit', date: '2024-03-20', active: true },
        { id: 'EVT-002', name: 'Community Outreach', date: '2024-04-15', active: false },
      ]
    );
    populateActiveEvents('#event-select');
    populateActiveEvents('#manual-event');
  }

  function renderEvents(list) {
    var tbody = $('#events-rows');
    if (!tbody) {
      return;
    }
    tbody.innerHTML = '';
    if (!list || !list.length) {
      var empty = document.createElement('tr');
      empty.innerHTML = '<td colspan="4" class="muted">No events found.</td>';
      tbody.appendChild(empty);
      return;
    }
    list.forEach(function (event) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' +
        esc(event.name || event.title || 'Event') +
        '</td><td>' +
        esc(event.date || '') +
        '</td><td>' +
        (event.active ? '<span class="status-badge active">Active</span>' : '<span class="status-badge">Inactive</span>') +
        '</td><td><button type="button" class="btn btn-outline" data-toggle="' +
        esc(event.id) +
        '">' +
        (event.active ? 'Disable' : 'Enable') +
        '</button></td>';
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('button[data-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-toggle');
        toggleEventActive(id);
      });
    });
  }

  function populateActiveEvents(selectEl) {
    var select = typeof selectEl === 'string' ? $(selectEl) : selectEl;
    if (!select) {
      return;
    }
    YSP.utils.callServer(
      'getActiveEvents',
      [],
      function (res) {
        var events = (res && res.data) || res || [];
        renderEventOptions(select, events);
      },
      function (err) {
        console.error(err);
        toast('Unable to load events.');
      },
      [{ id: 'EVT-001', name: 'Leadership Summit' }]
    );
  }

  function renderEventOptions(select, list) {
    select.innerHTML = '<option value="">Select event</option>';
    list.forEach(function (event) {
      var option = document.createElement('option');
      option.value = event.id || event.code;
      option.textContent = event.name || event.title;
      select.appendChild(option);
    });
  }

  function toggleEventActive(id) {
    if (!id) {
      return;
    }
    YSP.utils.callServer(
      'toggleEventActive',
      [id],
      function (res) {
        toast(res && res.message ? res.message : 'Event updated.');
        loadEvents();
      },
      function (err) {
        console.error(err);
        toast('Unable to update event.');
      },
      { success: true, message: 'Event updated.' }
    );
  }

  function openCreateEventModal() {
    var panel = showModal({
      title: 'Create Event',
      bodyHtml:
        '<div class="form-group"><label>Name<input id="event-name" type="text" placeholder="Event name" /></label></div>' +
        '<div class="form-group"><label>Date<input id="event-date" type="date" /></label></div>',
      footerHtml:
        '<button type="button" class="btn btn-outline" data-close="1">Cancel</button>' +
        '<button type="button" class="btn btn-primary" id="event-save">Save Event</button>',
    });
    var saveBtn = panel.querySelector('#event-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var name = String($('#event-name').value || '').trim();
        var date = $('#event-date').value;
        if (!name || !date) {
          toast('Provide event name and date.');
          return;
        }
        YSP.utils.callServer(
          'createEvent',
          [{ name: name, date: date }],
          function (res) {
            closeModal();
            toast(res && res.message ? res.message : 'Event created.');
            loadEvents();
          },
          function (err) {
            console.error(err);
            toast('Unable to create event.');
          },
          { success: true, message: 'Event created.' }
        );
      });
    }
  }

  window.loadEvents = loadEvents;
  window.renderEvents = renderEvents;
  window.populateActiveEvents = populateActiveEvents;
})();
