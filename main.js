
const studentList = document.getElementById('student-list');
const studentNameInput = document.getElementById('student-name-input');
const addStudentButton = document.getElementById('add-student-button');
const seatingChartContainer = document.getElementById('seating-chart-container');
const randomizeButton = document.getElementById('randomize-button');

let students = [];

function renderStudentList() {
    studentList.innerHTML = '';
    students.forEach(student => {
        const li = document.createElement('li');
        li.textContent = student;
        studentList.appendChild(li);
    });
}

function addStudent() {
    const name = studentNameInput.value.trim();
    if (name) {
        students.push(name);
        studentNameInput.value = '';
        renderStudentList();
    }
}

function createSeatingChart() {
    for (let i = 0; i < 25; i++) { // Create 25 seats
        const seat = document.createElement('div');
        seat.classList.add('seat');
        seat.dataset.seatNumber = i + 1;
        seatingChartContainer.appendChild(seat);
    }
}

function assignSeats() {
    const seats = Array.from(document.querySelectorAll('.seat'));
    seats.forEach(seat => {
        seat.textContent = '';
        seat.classList.remove('assigned');
    });

    const shuffledStudents = [...students].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffledStudents.length; i++) {
        if (seats[i]) {
            seats[i].textContent = shuffledStudents[i];
            seats[i].classList.add('assigned');
        }
    }
}

addStudentButton.addEventListener('click', addStudent);
randomizeButton.addEventListener('click', assignSeats);

createSeatingChart();
