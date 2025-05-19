const form = document.getElementById('scheduler-form');
const chartCanvas = document.getElementById('seek-chart');
const directionContainer = document.getElementById('direction-container');
const directionSelect = document.getElementById('direction');
const seekTimeDisplay = document.getElementById('seek-time');
const seekSequenceDisplay = document.getElementById('seek-sequence');
const compareBtn = document.getElementById('compare-btn');
const comparisonResults = document.getElementById('comparison-results');
const comparisonContainer = document.getElementById('comparison-container');

let chart = null;

// Show/hide direction dropdown based on algorithm
document.getElementById('algorithm').addEventListener('change', function () {
  const dirAlgos = ['SCAN', 'LOOK', 'C-SCAN', 'C-LOOK'];
  directionContainer.style.display = dirAlgos.includes(this.value) ? 'block' : 'none';
});

// Form submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  await processForm(false);
});

// Compare button click
compareBtn.addEventListener('click', async () => {
  await processForm(true);
});

async function processForm(compare) {
  const requests = document.getElementById('requests').value.trim();
  const head = parseInt(document.getElementById('head').value);
  const cylinders = parseInt(document.getElementById('cylinders').value);
  const algorithm = document.getElementById('algorithm').value;
  const direction = directionSelect.value;

  if (!requests || isNaN(head) || isNaN(cylinders)) {
    alert("Please fill all fields correctly.");
    return;
  }

  const data = {
    requests,
    head,
    cylinders,
    algorithm,
    direction,
    compare
  };

  try {
    const res = await fetch('/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const json = await res.json();
    if (json.error) throw new Error(json.error);

    seekTimeDisplay.innerText = json.total_seek;
    seekSequenceDisplay.innerText = json.sequence.join(' → ');

    if (compare && json.optimal) {
      displayComparisonResults(json.optimal, algorithm, json.total_seek);
      visualizeBoth(json.sequence, json.optimal, algorithm);
    } else {
      comparisonResults.classList.remove('active');
      visualizeSingle(json.sequence, algorithm);
    }

  } catch (err) {
    alert("Error: " + err.message);
  }
}

function displayComparisonResults(optimal, selectedAlgo, selectedSeekTime) {
  comparisonResults.classList.add('active');
  comparisonContainer.innerHTML = '';

  const allResults = optimal.all_results;
  const maxSeekTime = Math.max(...Object.values(allResults));

  const header = document.createElement('div');
  header.className = 'col-span-2 text-center mb-2';

  if (optimal.algorithm === selectedAlgo) {
    header.innerHTML = `<p class="text-lg font-bold text-green-300">
      ${selectedAlgo} is already the optimal algorithm with seek time: ${optimal.seek_time}
    </p>`;
  } else {
    header.innerHTML = `<p class="text-lg font-bold">
      Optimal algorithm is <span class="text-green-300">${optimal.algorithm}</span> with seek time: ${optimal.seek_time} 
      (Your choice: ${selectedAlgo} with ${selectedSeekTime})
    </p>`;
  }
  comparisonContainer.appendChild(header);

  Object.entries(allResults).forEach(([algo, seekTime]) => {
    const percentWidth = (seekTime / maxSeekTime) * 100;

    const row = document.createElement('div');
    row.className = 'col-span-2 flex items-center mb-2';

    const label = document.createElement('div');
    label.className = 'w-24 text-right pr-3';
    label.textContent = algo;

    const barContainer = document.createElement('div');
    barContainer.className = 'flex-1 bg-gray-700 rounded-full h-6';

    const bar = document.createElement('div');
    bar.className = 'h-6 rounded-full flex items-center pl-2 text-xs transition-all duration-500';
    bar.textContent = seekTime;
    bar.style.width = '0%';

    if (algo === optimal.algorithm) {
      bar.classList.add('bg-green-500');
    } else if (algo === selectedAlgo) {
      bar.classList.add('bg-blue-500');
    } else {
      bar.classList.add('bg-gray-500');
    }

    barContainer.appendChild(bar);
    row.appendChild(label);
    row.appendChild(barContainer);
    comparisonContainer.appendChild(row);

    setTimeout(() => {
      bar.style.width = `${percentWidth}%`;
    }, 100);
  });
}

async function visualizeSingle(sequence, algorithm) {
  const labels = [];
  const values = [];
  const colorMap = {
    FCFS: 'blue',
    SSTF: 'green',
    SCAN: 'orange',
    'C-SCAN': 'purple',
    'C-LOOK': 'brown',
    LOOK: 'red'
  };

  if (chart) chart.destroy();

  chart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Head Movement',
        data: values,
        borderColor: colorMap[algorithm] || 'blue',
        fill: false,
        tension: 0.3,
        pointBackgroundColor: 'white',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        y: { title: { display: true, text: 'Cylinder Number' } },
        x: { title: { display: true, text: 'Sequence Order' } }
      }
    }
  });

  for (let i = 0; i < sequence.length; i++) {
    await new Promise(res => setTimeout(res, 400));
    chart.data.labels.push(i);
    chart.data.datasets[0].data.push(sequence[i]);
    chart.update();
  }
}

async function visualizeBoth(selectedSeq, optimalData, selectedAlgo) {
  const labels = selectedSeq.map((_, i) => i);
  const datasets = [];

  const colorMap = {
    FCFS: 'blue',
    SSTF: 'green',
    SCAN: 'orange',
    'C-SCAN': 'purple',
    'C-LOOK': 'brown',
    LOOK: 'red'
  };

  // First: selected algorithm sequence
  datasets.push({
    label: `${selectedAlgo}`,
    data: selectedSeq,
    borderColor: colorMap[selectedAlgo] || 'blue',
    fill: false,
    tension: 0.3,
    pointBackgroundColor: 'white',
    pointRadius: 4
  });

  // Second: optimal algorithm sequence (only if different)
  if (optimalData.algorithm !== selectedAlgo) {
    try {
      const res = await fetch('/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: document.getElementById('requests').value.trim(),
          head: parseInt(document.getElementById('head').value),
          cylinders: parseInt(document.getElementById('cylinders').value),
          algorithm: optimalData.algorithm,
          direction: directionSelect.value
        })
      });
      const json = await res.json();
      datasets.push({
        label: `${optimalData.algorithm} (Optimal)`,
        data: json.sequence,
        borderColor: colorMap[optimalData.algorithm] || 'gray',
        borderDash: [5, 5],
        fill: false,
        tension: 0.3,
        pointBackgroundColor: 'yellow',
        pointRadius: 4
      });
    } catch (err) {
      console.error("Failed to fetch optimal sequence for comparison graph.");
    }
  }

  if (chart) chart.destroy();

  chart = new Chart(chartCanvas, {
    type: 'line',
    data: { labels: labels, datasets },
    options: {
      responsive: true,
      animation: false,
      scales: {
        y: { title: { display: true, text: 'Cylinder Number' } },
        x: { title: { display: true, text: 'Sequence Order' } }
      }
    }
  });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  const algo = document.getElementById('algorithm').value;
  const dirAlgos = ['SCAN', 'LOOK', 'C-SCAN', 'C-LOOK'];
  directionContainer.style.display = dirAlgos.includes(algo) ? 'block' : 'none';
});
