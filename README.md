# Disk Scheduling Visualizer 🚀

A web-based visual tool to simulate and compare various **Disk Scheduling Algorithms** such as FCFS, SSTF, SCAN, C-SCAN, and C-LOOK. Built with **Flask** (backend) and **HTML/CSS/JavaScript** (frontend using Chart.js).

---

## 🧠 What is Disk Scheduling?

Disk Scheduling algorithms decide the order in which disk I/O requests are processed. Since disk access time depends heavily on the movement of the disk head, efficient scheduling is important to reduce the total seek time and improve performance.

---

## 📊 Supported Algorithms

### 1. **FCFS (First Come First Serve)**
- Processes requests in the order they arrive.
- **Pros**: Simple and fair
- **Cons**: High total seek time in worst cases

### 2. **SSTF (Shortest Seek Time First)**
- Picks the request closest to the current head position.
- **Pros**: Better than FCFS in most cases
- **Cons**: May cause starvation for far requests

### 3. **SCAN (Elevator Algorithm)**
- The head moves in one direction servicing requests, then reverses.
- **Pros**: More uniform wait time
- **Cons**: May cause delay at extremes

### 4. **C-SCAN (Circular SCAN)**
- Like SCAN, but head returns to beginning after reaching end.
- **Pros**: Uniform wait time for all cylinders
- **Cons**: More total head movement than SCAN

### 5. **C-LOOK (Circular LOOK)**
- Like C-SCAN but only services requests in its path (ignores extremes with no requests).
- **Pros**: Better than C-SCAN
- **Cons**: Still more complex than SSTF

---

## 🖥️ Features

- Live animation of head movement using **Chart.js**
- Total seek time and head movement sequence
- Direction control (for SCAN family)
- Comparison with best-performing algorithm
- Clean, dark-themed UI using **Tailwind CSS**
- Deployable on **Railway** (backend) and **Vercel** (frontend)

---

## 🚀 Getting Started

### 🔧 Prerequisites

- Python 3.7+
- Flask
- Node.js (if modifying frontend with build tools)

### 🐍 Backend Setup (Flask)

```bash
pip install -r requirements.txt
python app.py
