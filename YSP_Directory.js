(function () {
  'use strict';

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
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(function () {
        fetchSuggestions(query);
      }, query ? 200 : 0);
    });
    list.addEventListener('click', function (event) {
      var item = event.target.closest('li[data-id]');
      if (!item) {
        return;
      }
      var id = item.getAttribute('data-id');
      openOfficer(id);
      list.innerHTML = '';
      input.value = item.getAttribute('data-label') || input.value;
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
    YSP.utils.callServer(
      'officerSuggestions',
      [query],
      function (res) {
        var suggestions = (res && res.data) || res || [];
        suggestionsCache[query] = suggestions;
        renderSuggestions(suggestions);
      },
      function (err) {
        console.error(err);
        toast('Unable to fetch suggestions.');
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
      var li = document.createElement('li');
      var name = item.name || item.fullName || 'Member';
      var id = item.id || item.memberId || item.code;
      li.dataset.id = id;
      li.dataset.label = name;
      li.innerHTML = '<strong>' + esc(name) + '</strong><span class="muted">' + esc(id || '') + '</span>';
      list.appendChild(li);
    });
  }

  function openOfficer(id) {
    if (!id) {
      toast('Select a member from the list.');
      return;
    }
    var result = $('#directory-result');
    if (result) {
      result.textContent = 'Loading member details…';
    }
    YSP.utils.callServer(
      'getRecordById',
      [id],
      function (res) {
        var record = (res && res.data) || res || {};
        renderOfficer(record);
      },
      function (err) {
        console.error(err);
        toast('Unable to load member details.');
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
      esc(officer.avatarUrl || 'https://placehold.co/400x400?text=Member') +
      '" alt="' +
      esc(officer.name || officer.fullName || 'Member') +
      '" />' +
      '<div>' +
      '<h3>' +
      esc(officer.name || officer.fullName || 'Member') +
      '</h3>' +
      '<p class="muted">' +
      esc(officer.role || officer.position || 'Member') +
      '</p>' +
      '<p class="muted">' +
      esc(officer.email || 'No email provided') +
      '</p>' +
      '<p class="muted">' +
      esc(officer.id || officer.memberId || '') +
      '</p>' +
      '</div>' +
      '</div>';
  }

  window.bindDirectory = bindDirectory;
  window.openOfficer = openOfficer;
})();
