from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

def fcfs(requests, head):
    seek_sequence = []
    total_seek = 0
    current = head
    for req in requests:
        seek_sequence.append(req)
        total_seek += abs(current - req)
        current = req
    return seek_sequence, total_seek

def sstf(requests, head):
    seek_sequence = []
    total_seek = 0
    current = head
    pending = requests.copy()

    while pending:
        closest = min(pending, key=lambda x: abs(x - current))
        total_seek += abs(current - closest)
        seek_sequence.append(closest)
        current = closest
        pending.remove(closest)

    return seek_sequence, total_seek

def scan(requests, head, cylinders, direction):
    seek_sequence = []
    total_seek = 0
    current = head
    left = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])

    if direction == "left":
        for r in reversed(left):
            seek_sequence.append(r)
            total_seek += abs(current - r)
            current = r
        if current != 0:
            total_seek += current
            current = 0
            seek_sequence.append(current)  # Include end of disk
        for r in right:
            total_seek += abs(current - r)
            current = r
            seek_sequence.append(r)
    else:
        for r in right:
            seek_sequence.append(r)
            total_seek += abs(current - r)
            current = r
        if current != cylinders - 1:
            total_seek += (cylinders - 1) - current
            current = cylinders - 1
            seek_sequence.append(current)  # Include end of disk
        for r in reversed(left):
            total_seek += abs(current - r)
            current = r
            seek_sequence.append(r)

    return seek_sequence, total_seek

def look(requests, head, direction):
    seek_sequence = []
    total_seek = 0
    current = head
    left = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])

    if direction == "left":
        for r in reversed(left):
            seek_sequence.append(r)
            total_seek += abs(current - r)
            current = r
        for r in right:
            seek_sequence.append(r)
            total_seek += abs(current - r)
            current = r
    else:
        for r in right:
            seek_sequence.append(r)
            total_seek += abs(current - r)
            current = r
        for r in reversed(left):
            seek_sequence.append(r)
            total_seek += abs(current - r)
            current = r
    return seek_sequence, total_seek

def cscan(requests, head, cylinders):
    seek_sequence = []
    total_seek = 0
    current = head
    left = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])

    for r in right:
        seek_sequence.append(r)
        total_seek += abs(current - r)
        current = r

    if current != cylinders - 1:
        total_seek += (cylinders - 1) - current
        current = cylinders - 1
        seek_sequence.append(current)  # Include end of disk

    total_seek += current  # Move from end to start
    current = 0
    seek_sequence.append(current)  # Include start of disk

    for r in left:
        seek_sequence.append(r)
        total_seek += abs(current - r)
        current = r

    return seek_sequence, total_seek

def clook(requests, head):
    seek_sequence = []
    total_seek = 0
    current = head
    left = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])

    for r in right:
        seek_sequence.append(r)
        total_seek += abs(current - r)
        current = r
    if left:
        total_seek += abs(current - left[0])
        current = left[0]
        seek_sequence.append(current)
        for r in left[1:]:
            seek_sequence.append(r)
            total_seek += abs(current - r)
            current = r

    return seek_sequence, total_seek

def find_optimal_algorithm(requests, head, cylinders):
    algos = ['FCFS', 'SSTF', 'SCAN', 'C-SCAN', 'C-LOOK', 'LOOK']
    results = {}

    results['FCFS'] = fcfs(requests, head)[1]
    results['SSTF'] = sstf(requests, head)[1]
    results['SCAN'] = min(
        scan(requests, head, cylinders, 'left')[1],
        scan(requests, head, cylinders, 'right')[1]
    )
    results['C-SCAN'] = cscan(requests, head, cylinders)[1]
    results['C-LOOK'] = clook(requests, head)[1]
    results['LOOK'] = min(
        look(requests, head, 'left')[1],
        look(requests, head, 'right')[1]
    )

    optimal = min(results, key=results.get)
    return optimal, results[optimal], results

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/schedule', methods=['POST'])
def schedule():
    data = request.get_json()
    requests = list(map(int, data['requests'].split(',')))
    head = int(data['head'])
    cylinders = int(data['cylinders'])
    algorithm = data['algorithm']
    direction = data.get('direction', 'right')
    compare = data.get('compare', False)

    if algorithm == 'FCFS':
        seq, total = fcfs(requests, head)
    elif algorithm == 'SSTF':
        seq, total = sstf(requests, head)
    elif algorithm == 'SCAN':
        seq, total = scan(requests, head, cylinders, direction)
    elif algorithm == 'C-SCAN':
        seq, total = cscan(requests, head, cylinders)
    elif algorithm == 'C-LOOK':
        seq, total = clook(requests, head)
    elif algorithm == 'LOOK':
        seq, total = look(requests, head, direction)
    else:
        return jsonify({'error': 'Invalid algorithm'}), 400

    result = {
        'sequence': [head] + seq,
        'total_seek': total
    }

    if compare:
        optimal_algo, optimal_seek, all_results = find_optimal_algorithm(requests, head, cylinders)
        result['optimal'] = {
            'algorithm': optimal_algo,
            'seek_time': optimal_seek,
            'all_results': all_results
        }

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
