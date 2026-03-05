// Wire up the second submit button (question 4) to render the Chart.js plot
// battleWinProbMod is defined in risk.js (only attacks when attacker > defender)

const modSubmitBtn = document.querySelectorAll('button')[1];
let chartInstance = null;

modSubmitBtn.addEventListener('click', () => {
  const canvas = document.getElementById('showImage');
  const mode = document.getElementById('typeSelect').value;

  const probFn = mode === 'winning' ? battleWinProbMod : battleWinProb;
  const label = mode === 'winning'
    ? '50% win boundary (only attack when a > d)'
    : '50% win boundary (always attack)';

  const boundaryPoints = [];
  for (let a = 2; a <= 100; a++) {
    let boundary = 0;
    for (let d = 1; d <= 300; d++) {
      if (probFn(a, d) >= 0.5) boundary = d;
      else break;
    }
    if (boundary > 0) boundaryPoints.push({ x: a, y: boundary });
  }

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(canvas, {
    type: 'scatter',
    data: {
      datasets: [{
        label,
        data: boundaryPoints,
        showLine: true,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.3)',
        pointRadius: 2,
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: 'Attacker armies' }, min: 0, max: 100 },
        y: { title: { display: true, text: 'Defender armies' }, min: 0, max: 140 }
      },
      plugins: {
        title: { display: true, text: label }
      }
    }
  });
});