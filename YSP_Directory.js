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
    root.bindDirectory = root.bindDirectory || function () {};
    root.openOfficer = root.openOfficer || function () {};
    return;
  }

  var doc = root.document;
  var $ = typeof root.$ === 'function' ? root.$ : function () { return null; };
  var toastFn = typeof root.toast === 'function' ? root.toast : function () {};
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
  var callServer = root.YSP && root.YSP.utils && typeof root.YSP.utils.callServer === 'function'
    ? root.YSP.utils.callServer
    : function () {};

  var bound = false;
  var debounceTimer = null;
  var suggestionsCache = {};

  function bindDirectory() {
    if (bound) {
      return;
    }
    var input = $('#search-input');
    var list = $('#suggestions-list');
    if (!input || !list) {
      return;
    }
    bound = true;
    input.addEventListener('input', function () {
      var query = input.value.trim();
      clearTimeoutFn(debounceTimer);
      debounceTimer = setTimeoutFn(function () {
        fetchSuggestions(query);
      }, query ? 200 : 0);
    });
    list.addEventListener('click', function (event) {
      var target = event.target && event.target.closest ? event.target.closest('li[data-id]') : null;
      if (!target) {
        return;
      }
      var id = target.getAttribute('data-id');
      openOfficer(id);
      list.innerHTML = '';
      input.value = target.getAttribute('data-label') || input.value;
    });
  }

  function fetchSuggestions(query) {
    var list = $('#suggestions-list');
    if (!list) {
      return;
    }
    if (!query) {
      list.innerHTML = '';
      return;
    }
    if (suggestionsCache[query]) {
      renderSuggestions(suggestionsCache[query]);
      return;
    }
    callServer(
      'officerSuggestions',
      [query],
      function (res) {
        var suggestions = (res && res.data) || res || [];
        suggestionsCache[query] = suggestions;
        renderSuggestions(suggestions);
      },
      function (err) {
        if (root.console && typeof root.console.error === 'function') {
          root.console.error(err);
        }
        toastFn('Unable to fetch suggestions.');
      },
      [{ id: 'YSP0001', name: 'Juan Dela Cruz', role: 'Officer' }]
    );
  }

  function renderSuggestions(items) {
    var list = $('#suggestions-list');
    if (!list) {
      return;
    }
    list.innerHTML = '';
    if (!items || !items.length) {
      return;
    }
    items.forEach(function (item) {
      if (!doc || typeof doc.createElement !== 'function') {
        return;
      }
      var li = doc.createElement('li');
      var name = item.name || item.fullName || 'Member';
      var id = item.id || item.memberId || item.code;
      li.dataset.id = id;
      li.dataset.label = name;
      li.innerHTML = '<strong>' + escFn(name) + '</strong><span class="muted">' + escFn(id || '') + '</span>';
      list.appendChild(li);
    });
  }

  function openOfficer(id) {
    if (!id) {
      toastFn('Select a member from the list.');
      return;
    }
    var result = $('#directory-result');
    if (result) {
      result.textContent = 'Loading member details…';
    }
    callServer(
      'getRecordById',
      [id],
      function (res) {
        var record = (res && res.data) || res || {};
        renderOfficer(record);
      },
      function (err) {
        if (root.console && typeof root.console.error === 'function') {
          root.console.error(err);
        }
        toastFn('Unable to load member details.');
      },
      {
        id: id,
        name: 'Sample Member',
        role: 'Officer',
        email: 'sample@ysp.org',
        avatarUrl: 'https://placehold.co/600x400?text=Officer',
      }
    );
  }

  function renderOfficer(officer) {
    var result = $('#directory-result');
    if (!result) {
      return;
    }
    result.classList.remove('muted');
    result.innerHTML =
      '<div class="profile-info">' +
      '<img src="' +
      escFn(officer.avatarUrl || 'https://placehold.co/400x400?text=Member') +
      '" alt="' +
      escFn(officer.name || officer.fullName || 'Member') +
      '" />' +
      '<div>' +
      '<h3>' +
      escFn(officer.name || officer.fullName || 'Member') +
      '</h3>' +
      '<p class="muted">' +
      escFn(officer.role || officer.position || 'Member') +
      '</p>' +
      '<p class="muted">' +
      escFn(officer.email || 'No email provided') +
      '</p>' +
      '<p class="muted">' +
      escFn(officer.id || officer.memberId || '') +
      '</p>' +
      '</div>' +
      '</div>';
  }

  root.YSP = root.YSP || {};
  root.YSP.directory = root.YSP.directory || {};
  root.YSP.directory.bindDirectory = bindDirectory;
  root.YSP.directory.openOfficer = openOfficer;

  root.bindDirectory = bindDirectory;
  root.openOfficer = openOfficer;
});
