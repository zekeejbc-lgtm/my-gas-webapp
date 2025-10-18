(function () {
  'use strict';

  var chartInstance = null;

  function loadKpis() {
    YSP.utils.callServer(
      'getAttendanceKPIs',
      [],
      function (res) {
        var data = res && res.data ? res.data : res;
        renderKpiChart($('#kpi-chart'), data || {});
      },
      function (err) {
        console.error(err);
        toast('Unable to load KPI data.');
      },
      {
        labels: ['Jan', 'Feb', 'Mar', 'Apr'],
        present: [32, 28, 40, 36],
        absent: [4, 6, 5, 3],
      }
    );
  }

  function renderKpiChart(canvas, kpi) {
    var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) {
      return;
    }
    var labels = (kpi && kpi.labels) || ['Jan', 'Feb', 'Mar'];
    var present = (kpi && kpi.present) || [0, 0, 0];
    var absent = (kpi && kpi.absent) || [0, 0, 0];
    if (chartInstance) {
      chartInstance.data.labels = labels;
      chartInstance.data.datasets[0].data = present;
      chartInstance.data.datasets[1].data = absent;
      chartInstance.update();
      return;
    }
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Present',
            data: present,
            backgroundColor: 'rgba(246, 66, 31, 0.85)',
            borderRadius: 12,
          },
          {
            label: 'Absent',
            data: absent,
            backgroundColor: 'rgba(29, 29, 31, 0.18)',
            borderRadius: 12,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            stacked: false,
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
        },
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });
  }

  window.loadKpis = loadKpis;
  window.renderKpiChart = function (canvas, data) {
    renderKpiChart(canvas, data);
  };
})();
