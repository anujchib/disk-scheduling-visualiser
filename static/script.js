const form = document.getElementById('scheduler-form');
const chartCanvas = document.getElementById('seek-chart');
const direction = document.getElementById('direction');
const directionLabel = document.getElementById('direction-label');
const seekTimeDisplay = document.getElementById('seek-time');
const seekSequenceDisplay = document.getElementById('seek-sequence');
let chart = null;

document.getElementById('algorithm').addEventListener('change', function () {
  const show = ['SCAN'].includes(this.value);
  direction.style.display = show ? 'block' : 'none';
  directionLabel.style.display = show ? 'block' : 'none';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const requests = document.getElementById('requests').value.trim();
  const head = parseInt(document.getElementById('head').value);
  const cylinders = parseInt(document.getElementById('cylinders').value);
  const algorithm = document.getElementById('algorithm').value;
  const dir = document.getElementById('direction').value;

  if (!requests || isNaN(head) || isNaN(cylinders)) {
    alert("Please fill all fields correctly.");
    return;
  }

  const data = { requests, head, cylinders, algorithm, direction: dir };

  try {
    const res = await fetch('/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const json = await res.json();
    if (json.error) throw new Error(json.error);

    seekTimeDisplay.innerText = json.total_seek;
    seekSequenceDisplay.innerText = json.sequence.join(" → ");

    const labels = [];
    const values = [];
    const colors = {
      FCFS: 'blue',
      SSTF: 'green',
      SCAN: 'orange',
      'C-SCAN': 'purple',
      'C-LOOK': 'brown'
    };

    if (chart) chart.destroy();

    chart = new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Head Movement',
          data: values,
          borderColor: colors[algorithm],
          fill: false,
          tension: 0.3,
          pointBackgroundColor: 'red',
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        animation: false,
        scales: {
          y: {
            title: { display: true, text: 'Cylinder Number' }
          },
          x: {
            title: { display: true, text: 'Sequence Order' }
          }
        }
      }
    });

    for (let i = 0; i < json.sequence.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      chart.data.labels.push(i);
      chart.data.datasets[0].data.push(json.sequence[i]);
      chart.update();
    }

  } catch (err) {
    alert("Error: " + err.message);
  }
});
