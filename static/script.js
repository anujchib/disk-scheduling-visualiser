const form = document.getElementById('scheduler-form');
const chartCanvas = document.getElementById('seek-chart');
const direction = document.getElementById('direction');
const directionContainer = document.getElementById('direction-container');
const directionLabel = document.getElementById('direction-label');
const seekTimeDisplay = document.getElementById('seek-time');
const seekSequenceDisplay = document.getElementById('seek-sequence');
const comparisonResults = document.getElementById('comparison-results');
const comparisonContainer = document.getElementById('comparison-container');
const compareBtn = document.getElementById('compare-btn');
let chart = null;

document.getElementById('algorithm').addEventListener('change', function () {
  const show = ['SCAN', 'LOOK'].includes(this.value);
  directionContainer.style.display = show ? 'block' : 'none';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  await processForm(false);
});

compareBtn.addEventListener('click', async () => {
  await processForm(true);
});

async function processForm(compare) {
  const requests = document.getElementById('requests').value.trim();
  const head = parseInt(document.getElementById('head').value);
  const cylinders = parseInt(document.getElementById('cylinders').value);
  const algorithm = document.getElementById('algorithm').value;
  const dir = document.getElementById('direction').value;

  if (!requests || isNaN(head) || isNaN(cylinders)) {
    alert("Please fill all fields correctly.");
    return;
  }

  const data = { 
    requests, 
    head, 
    cylinders, 
    algorithm, 
    direction: dir,
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
    seekSequenceDisplay.innerText = json.sequence.join(" → ");

    // Handle comparison results if available
    if (compare && json.optimal) {
      displayComparisonResults(json.optimal, algorithm, json.total_seek);
    } else {
      comparisonResults.classList.remove('active');
    }

    // Visualize the algorithm
    visualizeAlgorithm(json.sequence, algorithm);

  } catch (err) {
    alert("Error: " + err.message);
  }
}

function displayComparisonResults(optimal, selectedAlgo, selectedSeekTime) {
  // Show comparison section
  comparisonResults.classList.add('active');
  
  // Clear previous results
  comparisonContainer.innerHTML = '';
  
  // Create results table
  const allResults = optimal.all_results;
  
  // Header for comparison
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
  
  // Create algorithm comparison bars
  const algorithms = Object.keys(allResults);
  const maxSeekTime = Math.max(...Object.values(allResults));
  
  algorithms.forEach(algo => {
    const seekTime = allResults[algo];
    const percentWidth = (seekTime / maxSeekTime) * 100;
    
    const algoContainer = document.createElement('div');
    algoContainer.className = 'col-span-2 flex items-center mb-2';
    
    const algoLabel = document.createElement('div');
    algoLabel.className = 'w-24 text-right pr-3';
    algoLabel.textContent = algo;
    
    const barContainer = document.createElement('div');
    barContainer.className = 'flex-1 bg-gray-700 rounded-full h-6';
    
    const bar = document.createElement('div');
    bar.className = algo === optimal.algorithm ? 
      'bg-green-500 h-6 rounded-full flex items-center pl-2 text-xs transition-all duration-500' :
      (algo === selectedAlgo ? 
        'bg-blue-500 h-6 rounded-full flex items-center pl-2 text-xs transition-all duration-500' :
        'bg-gray-500 h-6 rounded-full flex items-center pl-2 text-xs transition-all duration-500');
    bar.style.width = '0%';
    bar.textContent = seekTime;
    
    // Append elements
    barContainer.appendChild(bar);
    algoContainer.appendChild(algoLabel);
    algoContainer.appendChild(barContainer);
    comparisonContainer.appendChild(algoContainer);
    
    // Animate the bar width
    setTimeout(() => {
      bar.style.width = `${percentWidth}%`;
    }, 100);
  });
}

async function visualizeAlgorithm(sequence, algorithm) {
  const labels = [];
  const values = [];
  const colors = {
    FCFS: 'blue',
    SSTF: 'green',
    SCAN: 'orange',
    'C-SCAN': 'purple',
    'C-LOOK': 'brown',
    'LOOK': 'red'
  };

  if (chart) chart.destroy();

  chart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Head Movement',
        data: values,
        borderColor: colors[algorithm] || 'blue',
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

  for (let i = 0; i < sequence.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    chart.data.labels.push(i);
    chart.data.datasets[0].data.push(sequence[i]);
    chart.update();
  }
}

// Initialize direction visibility based on initial algorithm selection
window.addEventListener('DOMContentLoaded', () => {
  const showDirection = ['SCAN', 'LOOK'].includes(document.getElementById('algorithm').value);
  directionContainer.style.display = showDirection ? 'block' : 'none';
});