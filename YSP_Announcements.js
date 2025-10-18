(function () {
  'use strict';

  var createBound = false;

  function loadAnnouncements() {
    if (!createBound) {
      var btn = $('#btn-new-announcement');
      if (btn) {
        createBound = true;
        btn.addEventListener('click', openAnnouncementModal);
      }
    }
    YSP.utils.callServer(
      'listAnnouncements',
      [],
      function (res) {
        var list = (res && res.data) || res || [];
        renderAnnouncements(list);
      },
      function (err) {
        console.error(err);
        toast('Unable to load announcements.');
      },
      [
        { id: 'ANN-1', title: 'General Assembly', body: 'Join us this Saturday for our monthly assembly.', read: false },
        { id: 'ANN-2', title: 'Volunteer Drive', body: 'Sign up for the coastal cleanup happening next week.', read: true },
      ]
    );
  }

  function renderAnnouncements(list) {
    var container = $('#announcement-list');
    if (!container) {
      return;
    }
    container.innerHTML = '';
    if (!list || !list.length) {
      container.innerHTML = '<p class="muted">No announcements yet.</p>';
      return;
    }
    list.forEach(function (item) {
      var card = document.createElement('article');
      card.className = 'card announcement-card';
      card.style.borderLeft = item.read ? '4px solid rgba(0,0,0,0.08)' : '4px solid var(--primary)';
      card.innerHTML =
        '<h3>' +
        esc(item.title || 'Announcement') +
        '</h3><p class="muted">' +
        esc(item.body || '') +
        '</p>';
      container.appendChild(card);
    });
  }

  function openAnnouncementModal() {
    var panel = showModal({
      title: 'Create Announcement',
      bodyHtml:
        '<div class="form-group"><label>Title<input id="announcement-title" type="text" placeholder="Announcement title" /></label></div>' +
        '<div class="form-group"><label>Message<textarea id="announcement-body" rows="4" placeholder="Announcement body"></textarea></label></div>',
      footerHtml:
        '<button type="button" class="btn btn-outline" data-close="1">Cancel</button>' +
        '<button type="button" class="btn btn-primary" id="announcement-save">Publish</button>',
    });
    var save = panel.querySelector('#announcement-save');
    if (save) {
      save.addEventListener('click', function () {
        var title = String($('#announcement-title').value || '').trim();
        var body = String($('#announcement-body').value || '').trim();
        if (!title || !body) {
          toast('Please provide a title and message.');
          return;
        }
        YSP.utils.callServer(
          'createAnnouncement',
          [{ title: title, body: body }],
          function (res) {
            closeModal();
            toast(res && res.message ? res.message : 'Announcement posted.');
            loadAnnouncements();
          },
          function (err) {
            console.error(err);
            toast('Unable to publish announcement.');
          },
          { success: true, message: 'Announcement created.' }
        );
      });
    }
  }

  window.loadAnnouncements = loadAnnouncements;
  window.renderAnnouncements = renderAnnouncements;
})();
