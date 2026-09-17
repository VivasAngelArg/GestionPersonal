const monthGrid = document.querySelector('.month-grid');
const currentMonthText = document.querySelector('.current-month');
const btnPrev = document.querySelectorAll('.btn-nav')[0]; 
const btnNext = document.querySelectorAll('.btn-nav')[1]; 
const btnToday = document.querySelector('.btn-today');

// --- VARIABLES DEL POPOVER (Reemplazo del Modal) ---
const popover = document.getElementById('eventPopover');
const closeBtn = document.querySelector('.close-btn');
const eventForm = document.getElementById('eventForm');
const eventDateInput = document.getElementById('eventDate');

let date = new Date();
let currentMonth = date.getMonth();
let currentYear = date.getFullYear();

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// --- BASE DE DATOS LOCAL ---
let events = JSON.parse(localStorage.getItem('myCalendarEvents')) || [];

function renderCalendar() {
    monthGrid.innerHTML = '';
    currentMonthText.textContent = `${monthNames[currentMonth]} de ${currentYear}`;

    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const today = new Date();

    // Días del mes anterior
    for (let x = firstDayIndex; x > 0; x--) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell', 'inactive-month');
        dayCell.innerHTML = `<span class="date">${prevLastDay - x + 1}</span>`;
        monthGrid.appendChild(dayCell);
    }

    // Días del mes actual
    for (let i = 1; i <= lastDay; i++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell');
        
        // Formateamos la fecha exacta (Ej: "2026-09-14")
        const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        // --- MODIFICACIÓN: Pasamos el evento (e) para calcular las coordenadas ---
        dayCell.addEventListener('click', (e) => openPopover(e, cellDateStr));

        if (i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            dayCell.classList.add('today');
            dayCell.innerHTML = `<span class="date active-circle">${i}</span>`;
        } else {
            dayCell.innerHTML = `<span class="date">${i}</span>`;
        }

        // --- INYECTAR EVENTOS ---
        const dayEvents = events.filter(e => e.date === cellDateStr);
        dayEvents.forEach(evt => {
            const eventChip = document.createElement('div');
            eventChip.classList.add('event-chip');
            eventChip.textContent = `${evt.start} | ${evt.title}`; 
            
            // Evitamos que al hacer clic en un evento se abra el popover del día
            eventChip.addEventListener('click', (e) => {
                e.stopPropagation();
                alert(`Detalles:\n${evt.title}\n${evt.start} - ${evt.end}\n${evt.desc}`);
            });
            
            dayCell.appendChild(eventChip);
        });

        monthGrid.appendChild(dayCell);
    }

    // Días del mes siguiente
    const totalCells = monthGrid.children.length;
    const remainingCells = 42 - totalCells;
    for (let j = 1; j <= remainingCells; j++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell', 'inactive-month');
        dayCell.innerHTML = `<span class="date">${j}</span>`;
        monthGrid.appendChild(dayCell);
    }
}

// --- LÓGICA DEL POPOVER ---
function openPopover(e, dateStr) {
    eventDateInput.value = dateStr; 
    
    // Al quitarle la clase 'hidden', el CSS lo mostrará automáticamente en el centro
    popover.classList.remove('hidden'); 

    // Borramos los estilos en línea (top y left) por si quedaron guardados en la memoria del navegador
    popover.style.left = '';
    popover.style.top = '';
}

function closePopover() {
    popover.classList.add('hidden');
    eventForm.reset(); 
}

closeBtn.addEventListener('click', closePopover);

// Evitar que el clic dentro del popover lo cierre
popover.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Cerrar el popover haciendo clic afuera (en cualquier lugar que no sea el popover ni las celdas)
window.addEventListener('click', (e) => {
    if (!popover.contains(e.target) && !e.target.closest('.day-cell')) {
        closePopover();
    }
});

// --- GUARDAR EVENTO ---
eventForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Evita recargar la página

    const newEvent = {
        id: Date.now(), 
        date: eventDateInput.value,
        title: document.getElementById('eventTitle').value,
        start: document.getElementById('eventStart').value,
        end: document.getElementById('eventEnd').value,
        desc: document.getElementById('eventDesc').value
    };

    events.push(newEvent); 
    localStorage.setItem('myCalendarEvents', JSON.stringify(events)); 
    
    closePopover();
    renderCalendar(); 
});

// Navegación
btnPrev.addEventListener('click', () => { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(); });
btnNext.addEventListener('click', () => { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar(); });
btnToday.addEventListener('click', () => { currentMonth = new Date().getMonth(); currentYear = new Date().getFullYear(); renderCalendar(); });

renderCalendar();