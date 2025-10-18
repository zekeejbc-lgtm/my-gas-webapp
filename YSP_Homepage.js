(function () {
  'use strict';

  var state = {
    loaded: false,
    data: null,
  };

  function loadHomepage(force) {
    if (state.loaded && !force) {
      renderHome(state.data || {});
      return;
    }
    YSP.utils.callServer(
      'getHomepageContent',
      [],
      function (res) {
        var payload = res && (res.data || res.home || res);
        state.loaded = true;
        state.data = payload || {};
        renderHome(payload || {});
      },
      function (err) {
        console.error(err);
        toast('Unable to load homepage right now.');
        renderHome(state.data || {});
      },
      {
        success: true,
        data: {
          about: 'Youth and Students for Peace (YSP) Tagum unites servant leaders dedicated to community impact.',
          mission: 'To cultivate character, compassion, and competence among emerging leaders.',
          vision: 'A generation of empowered youth creating sustainable peace initiatives.',
          objectives: [
            'Lead meaningful volunteer opportunities.',
            'Strengthen partnerships with local communities.',
            'Provide leadership development programs.',
          ],
          orgChartUrl: 'https://placehold.co/1280x720?text=YSP+Org+Chart',
          facebookUrl: 'https://www.facebook.com',
          email: 'ysp.tagum@gmail.com',
          developer: 'Built by YSP Tagum Digital Services.',
          projects: [
            {
              title: 'Peace Camp',
              description: 'A youth leadership training focused on mediation and collaboration.',
              imageUrl: 'https://placehold.co/640x360?text=Peace+Camp',
            },
            {
              title: 'Community Cleanup',
              description: 'Mobilizing volunteers to beautify key barangays.',
              imageUrl: 'https://placehold.co/640x360?text=Cleanup+Drive',
            },
          ],
        },
      }
    );
  }

  function renderHome(home) {
    var aboutEl = $('#home-about');
    var missionEl = $('#home-mission');
    var visionEl = $('#home-vision');
    var objectivesEl = $('#home-objectives');
    var orgChart = $('#home-org-chart');
    var developerInfo = $('#developer-info');
    var contactsSection = $('#contacts-section');

    if (aboutEl) {
      aboutEl.textContent = home && home.about ? home.about : 'Welcome to YSP Tagum.';
    }
    if (missionEl) {
      missionEl.textContent = home && home.mission ? home.mission : 'Mission will appear here.';
    }
    if (visionEl) {
      visionEl.textContent = home && home.vision ? home.vision : 'Vision will appear here.';
    }
    if (objectivesEl) {
      objectivesEl.innerHTML = '';
      var objectives = Array.isArray(home && home.objectives) ? home.objectives : [];
      if (!objectives.length && home && typeof home.objectives === 'string') {
        objectives = home.objectives.split(/\n+/);
      }
      if (!objectives.length) {
        objectives = ['Promote peace initiatives.', 'Develop youth leadership skills.'];
      }
      objectives.forEach(function (item) {
        var li = document.createElement('li');
        li.textContent = item;
        objectivesEl.appendChild(li);
      });
    }
    if (orgChart) {
      orgChart.src = YSP.safeImage ? YSP.safeImage(home && home.orgChartUrl) : (home && home.orgChartUrl) || orgChart.src;
    }
    if (developerInfo) {
      developerInfo.textContent = (home && home.developer) || 'Maintained by YSP Tagum Digital Services.';
    }

    renderProjects(deriveProjectsFromFlat(home));
    renderContacts(home);
  }

  function deriveProjectsFromFlat(map) {
    if (!map) {
      return [];
    }
    if (Array.isArray(map.projects)) {
      return map.projects;
    }
    var projects = [];
    for (var key in map) {
      if (!Object.prototype.hasOwnProperty.call(map, key)) {
        continue;
      }
      var match = key.match(/^project(ImageUrl|Desc|Title)_(\d+)/i);
      if (match) {
        var index = Number(match[2]);
        projects[index] = projects[index] || {};
        if (/image/i.test(match[1])) {
          projects[index].imageUrl = map[key];
        } else if (/desc/i.test(match[1])) {
          projects[index].description = map[key];
        } else if (/title/i.test(match[1])) {
          projects[index].title = map[key];
        }
      }
    }
    return projects.filter(function (project) {
      return project && (project.title || project.description || project.imageUrl);
    });
  }

  function renderProjects(projects) {
    var grid = $('#projects-grid');
    if (!grid) {
      return;
    }
    grid.innerHTML = '';
    if (!projects || !projects.length) {
      grid.innerHTML = '<p class="muted">Projects will appear here soon.</p>';
      return;
    }
    projects.forEach(function (project) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'project-card';
      card.innerHTML =
        '<img src="' +
        esc(project.imageUrl || 'https://placehold.co/640x360?text=YSP+Project') +
        '" alt="' +
        esc(project.title || 'YSP Project') +
        '" />' +
        '<div class="project-body">' +
        '<h4>' +
        esc(project.title || 'YSP Initiative') +
        '</h4>' +
        '<p>' +
        esc(project.description || 'More details coming soon.') +
        '</p>' +
        '</div>';
      card.addEventListener('click', function (event) {
        openProjectModal(project, card);
      });
      grid.appendChild(card);
    });
  }

  function openProjectModal(project, opener) {
    var title = project && project.title ? project.title : 'Project Highlight';
    var modal = showModal({
      title: title,
      opener: opener,
      bodyHtml:
        '<div class="ratio ratio-16x9"><img src="' +
        esc(project && project.imageUrl ? project.imageUrl : 'https://placehold.co/960x540?text=Project') +
        '" alt="' +
        esc(title) +
        '" /></div>' +
        '<p>' +
        esc(project && project.description ? project.description : 'Details will be available soon.') +
        '</p>',
      footerHtml: '<button type="button" class="btn btn-primary" data-close="1">Close</button>',
    });
    return modal;
  }

  function renderContacts(home) {
    var facebookBtn = $('#contact-facebook');
    var emailBtn = $('#contact-email');
    var facebookUrl = home && (home.facebookUrl || home.facebook);
    var email = home && (home.email || home.emailAddress);

    if (facebookBtn && facebookBtn.dataset.bound !== '1') {
      facebookBtn.dataset.bound = '1';
      facebookBtn.addEventListener('click', function () {
        if (facebookUrl) {
          openSafe(facebookUrl);
        } else {
          toast('No Facebook link available yet.');
        }
      });
    }

    if (emailBtn && emailBtn.dataset.bound !== '1') {
      emailBtn.dataset.bound = '1';
      emailBtn.addEventListener('click', function () {
        if (!email) {
          toast('No email address available yet.');
          return;
        }
        var composeUrl =
          'https://mail.google.com/mail/?view=cm&fs=1&to=' +
          encodeURIComponent(email) +
          '&su=%5BYSP%5D%20Issue%20Report';
        openSafe(composeUrl);
      });
    }
  }

  window.loadHomepage = loadHomepage;
  window.renderHome = renderHome;
  window.deriveProjectsFromFlat = deriveProjectsFromFlat;
  window.renderProjects = renderProjects;
  window.openProjectModal = openProjectModal;
  window.renderContacts = renderContacts;
})();
