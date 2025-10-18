(function () {
  'use strict';

  var loginBound = false;
  var qrCodeInstance = null;

  function normalizeName(name) {
    var value = String(name || '').trim();
    if (!value) {
      return 'Member';
    }
    return value.replace(/\s+/g, ' ');
  }

  function getRole(user) {
    var role = user && (user.role || user.position || user.type);
    return role ? String(role).toLowerCase() : '';
  }

  function isGuest(user) {
    var role = getRole(user);
    return role === 'guest' || role === 'visitor' || !!(user && user.isGuest);
  }

  function bindLogin() {
    if (loginBound) {
      return;
    }
    loginBound = true;
    var usernameInput = $('#username');
    var passwordInput = $('#password');
    var loginBtn = $('#login-btn');
    var guestBtn = $('#guest-login-btn');
    var eyeToggle = $('#eye-toggle');

    function toggleEye() {
      var reveal = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', reveal ? 'text' : 'password');
      eyeToggle.setAttribute('aria-pressed', reveal ? 'true' : 'false');
      eyeToggle.classList.toggle('is-visible', reveal);
      eyeToggle.classList.add('is-animating');
      window.setTimeout(function () {
        eyeToggle.classList.remove('is-animating');
      }, 350);
    }

    if (eyeToggle) {
      eyeToggle.addEventListener('click', function () {
        toggleEye();
      });
    }

    function handleSubmit(event) {
      if (event && event.key === 'Enter') {
        event.preventDefault();
        doLogin();
      }
    }

    if (usernameInput) {
      usernameInput.addEventListener('keydown', handleSubmit);
    }
    if (passwordInput) {
      passwordInput.addEventListener('keydown', handleSubmit);
    }
    if (loginBtn) {
      loginBtn.addEventListener('click', function () {
        doLogin();
      });
    }
    if (guestBtn) {
      guestBtn.addEventListener('click', function () {
        openGuestModal(guestBtn);
      });
    }
  }

  function openGuestModal(opener) {
    var panel = showModal({
      title: 'Guest Login',
      opener: opener,
      bodyHtml:
        '<p>Enter your name so we can personalize your visit.</p>' +
        '<label class="form-group">Name<input id="guest-name" type="text" placeholder="Your name" /></label>',
      footerHtml:
        '<button type="button" class="btn btn-outline" data-close="1">Cancel</button>' +
        '<button type="button" class="btn btn-primary" id="guest-submit">Continue</button>',
    });
    var input = panel.querySelector('#guest-name');
    var submit = panel.querySelector('#guest-submit');
    function submitGuest() {
      var name = normalizeName(input.value);
      if (!name) {
        toast('Please enter your name.');
        return;
      }
      submit.disabled = true;
      YSP.utils.callServer(
        'guestLogin',
        [name],
        function (res) {
          submit.disabled = false;
          closeModal();
          if (res && res.success && res.user) {
            res.user.isGuest = true;
            setSession(res.user);
            show('homepage-panel');
            loadHomepage();
          } else {
            toast((res && res.message) || 'Unable to start guest session.');
          }
        },
        function (err) {
          submit.disabled = false;
          toast('Guest login failed.');
          console.error(err);
        },
        { success: true, user: { name: name, role: 'Guest' } }
      );
    }
    if (submit) {
      submit.addEventListener('click', submitGuest);
    }
    if (input) {
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          submitGuest();
        }
      });
      window.setTimeout(function () {
        input.focus();
      }, 20);
    }
  }

  function doLogin() {
    var usernameInput = $('#username');
    var passwordInput = $('#password');
    var loginBtn = $('#login-btn');
    var username = usernameInput ? usernameInput.value.trim() : '';
    var password = passwordInput ? passwordInput.value.trim() : '';
    if (!username || !password) {
      toast('Enter both username and password.');
      return;
    }
    if (loginBtn) {
      loginBtn.disabled = true;
    }
    YSP.utils.callServer(
      'validateLogin',
      [username, password],
      function (res) {
        if (loginBtn) {
          loginBtn.disabled = false;
        }
        if (res && res.success && res.user) {
          setSession(res.user);
          show('main-menu-panel');
        } else {
          toast((res && res.message) || 'Invalid credentials.');
        }
      },
      function (err) {
        if (loginBtn) {
          loginBtn.disabled = false;
        }
        toast('Login failed. Please try again.');
        console.error(err);
      },
      {
        success: true,
        user: {
          name: username.split('@')[0] || 'Member',
          email: username,
          role: 'Member',
          id: 'YSP-0000',
        },
      }
    );
  }

  function setSession(user) {
    var safeUser = user || {};
    YSP.state.session = safeUser;
    window.__SESSION__ = safeUser;
    $('#welcome-name').textContent = normalizeName(safeUser.name || safeUser.fullName || 'Member');
    if ($('#password')) {
      $('#password').value = '';
      $('#password').setAttribute('type', 'password');
    }
    if ($('#username')) {
      $('#username').value = safeUser.email || '';
    }
    var eyeToggle = $('#eye-toggle');
    if (eyeToggle) {
      eyeToggle.classList.remove('is-visible');
      eyeToggle.setAttribute('aria-pressed', 'false');
    }
    buildDashboard(safeUser);
    buildProfile(safeUser);
    loadHomepage();
    bindDirectory();
    bindManualAttendance();
  }

  function buildDashboard(user) {
    var tilesRoot = $('#dashboard-tiles');
    if (!tilesRoot) {
      return;
    }
    tilesRoot.innerHTML = '';
    var dashboardConfig = [
      {
        id: 'home',
        label: 'Homepage',
        description: 'News, mission, projects and contacts.',
        icon: '🏠',
        target: 'homepage-panel',
        action: function () {
          loadHomepage();
        },
      },
      {
        id: 'profile',
        label: 'Profile & QR ID',
        description: 'View your membership details.',
        icon: '🪪',
        target: 'profile-panel',
        action: function () {
          buildProfile(user);
        },
      },
      {
        id: 'qr-scan',
        label: 'QR Attendance',
        description: 'Scan member QR codes for events.',
        icon: '📷',
        target: 'qr-attendance-panel',
        action: function () {
          setupQrAttendance();
        },
      },
      {
        id: 'manual',
        label: 'Manual Attendance',
        description: 'Search members and record attendance.',
        icon: '📝',
        target: 'manual-attendance-panel',
        action: function () {
          setupManualAttendance();
          bindManualAttendance();
        },
      },
      {
        id: 'kpi',
        label: 'Attendance Dashboard',
        description: 'Charts of attendance trends.',
        icon: '📊',
        target: 'attendance-dashboard-panel',
        action: function () {
          loadKpis();
        },
      },
      {
        id: 'transparency',
        label: 'Attendance Transparency',
        description: 'Your attendance records.',
        icon: '📅',
        target: 'attendance-trans-panel',
        action: function () {
          loadMyAttendance();
        },
      },
      {
        id: 'events',
        label: 'Manage Events',
        description: 'Create and manage activities.',
        icon: '🎪',
        target: 'manage-events-panel',
        action: function () {
          loadEvents();
        },
      },
      {
        id: 'directory',
        label: 'Directory',
        description: 'Find officers and members.',
        icon: '🧑‍🤝‍🧑',
        target: 'directory-panel',
        action: function () {
          bindDirectory();
        },
      },
      {
        id: 'announcements',
        label: 'Announcements',
        description: 'Publish updates to members.',
        icon: '📣',
        target: 'announcements-panel',
        action: function () {
          loadAnnouncements();
        },
      },
      {
        id: 'feedback',
        label: 'Submit Feedback',
        description: 'Share your thoughts with the council.',
        icon: '💬',
        target: 'submit-feedback-panel',
        action: function () {
          loadMyFeedback();
        },
      },
      {
        id: 'feedback-admin',
        label: 'Feedback Inbox',
        description: 'Review feedback submissions.',
        icon: '📥',
        target: 'view-feedback-panel',
        action: function () {
          loadFeedbackAdmin();
        },
      },
      {
        id: 'access-logs',
        label: 'Access Logs',
        description: 'Monitor sign-in activity.',
        icon: '🗒️',
        target: 'view-logs-panel',
        action: function () {
          loadAccessLogs();
        },
      },
    ];

    var allowedTargets;
    if (isGuest(user)) {
      allowedTargets = {
        'homepage-panel': true,
        'directory-panel': true,
        'submit-feedback-panel': true,
        'attendance-trans-panel': true,
      };
    }

    dashboardConfig
      .filter(function (config) {
        if (!allowedTargets) {
          return true;
        }
        return !!allowedTargets[config.target];
      })
      .forEach(function (config) {
        var tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'tile';
        tile.setAttribute('role', 'listitem');
        tile.innerHTML =
          '<span class="tile-icon" aria-hidden="true">' +
          config.icon +
          '</span>' +
          '<span class="tile-title">' +
          esc(config.label) +
          '</span>' +
          '<span class="muted">' +
          esc(config.description) +
          '</span>';
        tile.addEventListener('click', function () {
          try {
            if (typeof config.action === 'function') {
              config.action();
            }
          } catch (err) {
            console.error('Tile action failed', config.id, err);
          }
          show(config.target);
        });
        tilesRoot.appendChild(tile);
      });

    var logoutTile = document.createElement('button');
    logoutTile.type = 'button';
    logoutTile.className = 'tile';
    logoutTile.id = 'logout-tile';
    logoutTile.innerHTML =
      '<span class="tile-icon" aria-hidden="true">🚪</span>' +
      '<span class="tile-title">Log Out</span>' +
      '<span class="muted">Sign out from this device.</span>';
    logoutTile.addEventListener('click', function () {
      performLogout();
    });
    tilesRoot.appendChild(logoutTile);
  }

  function performLogout() {
    YSP.utils.callServer(
      'logout',
      [],
      function () {
        YSP.state.session = null;
        window.__SESSION__ = null;
        if ($('#username')) {
          $('#username').value = '';
        }
        if ($('#password')) {
          $('#password').value = '';
          $('#password').setAttribute('type', 'password');
        }
        var eyeToggle = $('#eye-toggle');
        if (eyeToggle) {
          eyeToggle.classList.remove('is-visible');
          eyeToggle.setAttribute('aria-pressed', 'false');
        }
        show('login-panel');
        toast('Signed out successfully.');
      },
      function (err) {
        console.error(err);
        toast('Unable to log out right now.');
      },
      { success: true }
    );
  }

  function buildProfile(user) {
    var profileName = $('#profile-name');
    var profileRole = $('#profile-role');
    var profileEmail = $('#profile-email');
    var profileId = $('#profile-id');
    var avatar = $('#profile-avatar');
    var qrContainer = $('#qrid');
    var downloadBtn = $('#btn-download-qr');

    if (!qrContainer) {
      return;
    }

    profileName.textContent = normalizeName(user && (user.fullName || user.name));
    profileRole.textContent = user && (user.role || user.position || 'Member');
    profileEmail.textContent = user && (user.email || 'no-email@ysp.org');
    profileId.textContent = user && (user.id || user.memberId || 'ID unavailable');
    if (avatar) {
      var avatarUrl = (user && user.avatarUrl) || 'https://placehold.co/400x400?text=Member';
      avatar.src = avatarUrl;
    }

    qrContainer.innerHTML = '';
    if (typeof QRCode === 'function') {
      qrCodeInstance = new QRCode(qrContainer, {
        text: String(user && (user.id || user.memberId || user.email || 'YSP')),
        width: 180,
        height: 180,
        colorDark: '#1d1d1f',
        colorLight: '#ffffff',
      });
    } else {
      qrContainer.textContent = 'QR generator unavailable.';
    }

    if (downloadBtn && downloadBtn.dataset.bound !== '1') {
      downloadBtn.dataset.bound = '1';
      downloadBtn.addEventListener('click', function () {
        var canvas = qrContainer.querySelector('canvas');
        var img = qrContainer.querySelector('img');
        var href = null;
        if (canvas && canvas.toDataURL) {
          href = canvas.toDataURL('image/png');
        } else if (img && img.src) {
          href = img.src;
        }
        if (!href) {
          toast('QR image not ready yet.');
          return;
        }
        var link = document.createElement('a');
        link.href = href;
        link.download = (user && user.id ? user.id : 'ysp-id') + '-qr.png';
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
    }
  }

  window.bindLogin = bindLogin;
  window.doLogin = doLogin;
  window.setSession = setSession;
  window.buildDashboard = buildDashboard;
  window.buildProfile = buildProfile;
})();
