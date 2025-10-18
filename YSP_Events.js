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
    root.loadEvents = root.loadEvents || function () {};
    root.renderEvents = root.renderEvents || function () {};
    root.populateActiveEvents = root.populateActiveEvents || function () {};
    return;
  }

  var $ = typeof root.$ === 'function' ? root.$ : function () { return null; };
  var toastFn = typeof root.toast === 'function' ? root.toast : function () {};
  var showModalFn = typeof root.showModal === 'function' ? root.showModal : function () { return document.createElement('div'); };
  var closeModalFn = typeof root.closeModal === 'function' ? root.closeModal : function () {};
  var callServer = root.YSP && root.YSP.utils && typeof root.YSP.utils.callServer === 'function'
    ? root.YSP.utils.callServer
    : function () {};

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
    callServer(
      'listEvents',
      [],
      function (res) {
        var list = (res && res.data) || res || [];
        eventsCache = list;
        renderEvents(list);
      },
      function (err) {
        if (root.console && typeof root.console.error === 'function') {
          root.console.error(err);
        }
        toastFn('Unable to load events.');
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
    callServer(
      'getActiveEvents',
      [],
      function (res) {
        var events = (res && res.data) || res || [];
        renderEventOptions(select, events);
      },
      function (err) {
        if (root.console && typeof root.console.error === 'function') {
          root.console.error(err);
        }
        toastFn('Unable to load events.');
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
    callServer(
      'toggleEventActive',
      [id],
      function (res) {
        toastFn(res && res.message ? res.message : 'Event updated.');
        loadEvents();
      },
      function (err) {
        if (root.console && typeof root.console.error === 'function') {
          root.console.error(err);
        }
        toastFn('Unable to update event.');
      },
      { success: true, message: 'Event updated.' }
    );
  }

  function openCreateEventModal() {
    var panel = showModalFn({
      title: 'Create Event',
      bodyHtml:
        '<div class="form-group"><label>Name<input id="event-name" type="text" placeholder="Event name" /></label></div>' +
        '<div class="form-group"><label>Date<input id="event-date" type="date" /></label></div>',
      footerHtml:
        '<button type="button" class="btn btn-outline" data-close="1">Cancel</button>' +
        '<button type="button" class="btn btn-primary" id="event-save">Save Event</button>',
    });
    if (!panel || typeof panel.querySelector !== 'function') {
      return;
    }
    var saveBtn = panel.querySelector('#event-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var nameInput = $('#event-name');
        var dateInput = $('#event-date');
        var name = String((nameInput && nameInput.value) || '').trim();
        var date = dateInput ? dateInput.value : '';
        if (!name || !date) {
          toastFn('Provide event name and date.');
          return;
        }
        callServer(
          'createEvent',
          [{ name: name, date: date }],
          function (res) {
            closeModalFn();
            toastFn(res && res.message ? res.message : 'Event created.');
            loadEvents();
          },
          function (err) {
            if (root.console && typeof root.console.error === 'function') {
              root.console.error(err);
            }
            toastFn('Unable to create event.');
          },
          { success: true, message: 'Event created.' }
        );
      });
    }
  }

  root.YSP = root.YSP || {};
  root.YSP.events = root.YSP.events || {};
  root.YSP.events.loadEvents = loadEvents;
  root.YSP.events.renderEvents = renderEvents;
  root.YSP.events.populateActiveEvents = populateActiveEvents;

  root.loadEvents = loadEvents;
  root.renderEvents = renderEvents;
  root.populateActiveEvents = populateActiveEvents;
});
