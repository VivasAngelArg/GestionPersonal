const monthGrid = document.querySelector('.month-grid');
const currentMonthText = document.querySelector('.current-month');
const btnPrev = document.querySelectorAll('.btn-nav')[0]; 
const btnNext = document.querySelectorAll('.btn-nav')[1]; 
const btnToday = document.querySelector('.btn-today');

// Elementos de Eventos
const popover = document.getElementById('eventPopover');
const closeBtn = document.querySelector('.close-btn');
const eventForm = document.getElementById('eventForm');
const eventDateInput = document.getElementById('eventDate');
const eventIdInput = document.getElementById('eventId'); 
const eventCategorySelect = document.getElementById('eventCategory');
const btnDeleteEvent = document.getElementById('btnDeleteEvent'); 

// Elementos de Categorías
const categoryModal = document.getElementById('categoryModal');
const closeCategoryBtn = document.querySelector('.close-category-btn');
const categoryForm = document.getElementById('categoryForm');
const btnOpenCategoryModal = document.getElementById('btnOpenCategoryModal');
const categoryListUl = document.getElementById('categoryList');
const catIdInput = document.getElementById('catId'); 

let date = new Date();
let currentMonth = date.getMonth();
let currentYear = date.getFullYear();
const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

let events = JSON.parse(localStorage.getItem('myCalendarEvents')) || [];
const defaultCategories = [
    { id: 'cat_1', name: '🏋️‍♂️ Powerlifting', color: '#ff5252' },
    { id: 'cat_2', name: '🥗 Comidas', color: '#4caf50' },
    { id: 'cat_3', name: '🔄 Rutinas', color: '#2196f3' },
    { id: 'cat_4', name: '💡 Ideas', color: '#ffeb3b' }
];
let categories = JSON.parse(localStorage.getItem('myCalendarCategories')) || defaultCategories;

// ==========================================
// RENDERIZADO VISUAL
// ==========================================
function renderCategories() {
    categoryListUl.innerHTML = '';
    eventCategorySelect.innerHTML = '';

    categories.forEach(cat => {
        const li = document.createElement('li');
        li.className = 'category-item';
        li.innerHTML = `
            <label class="category-label">
                <input type="checkbox" checked> 
                <span class="color-dot" style="background-color: ${cat.color}"></span>
                ${cat.name}
            </label>
            <div class="cat-actions">
                <button class="btn-edit-cat" onclick="editCategory('${cat.id}')" title="Editar categoría">✏️</button>
                <button class="btn-delete-cat" onclick="deleteCategory('${cat.id}')" title="Borrar categoría">🗑️</button>
            </div>
        `;
        categoryListUl.appendChild(li);

        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        eventCategorySelect.appendChild(option);
    });
}

function renderCalendar() {
    monthGrid.innerHTML = '';
    currentMonthText.textContent = `${monthNames[currentMonth]} de ${currentYear}`;

    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const today = new Date();

    for (let x = firstDayIndex; x > 0; x--) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell', 'inactive-month');
        dayCell.innerHTML = `<span class="date">${prevLastDay - x + 1}</span>`;
        monthGrid.appendChild(dayCell);
    }

    for (let i = 1; i <= lastDay; i++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell');
        const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        dayCell.addEventListener('click', (e) => openPopover(e, cellDateStr));

        if (i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            dayCell.classList.add('today');
            dayCell.innerHTML = `<span class="date active-circle">${i}</span>`;
        } else {
            dayCell.innerHTML = `<span class="date">${i}</span>`;
        }

        const dayEvents = events.filter(e => e.date === cellDateStr);
        dayEvents.forEach(evt => {
            const eventChip = document.createElement('div');
            eventChip.classList.add('event-chip');
            const categoryObj = categories.find(c => c.id === evt.categoryId);
            if(categoryObj) {
                eventChip.style.backgroundColor = categoryObj.color;
                eventChip.style.color = '#fff'; 
            }
            eventChip.textContent = `${evt.start} | ${evt.title}`; 
            
            eventChip.addEventListener('click', (e) => {
                e.stopPropagation();
                openPopoverForEdit(e, evt);
            });
            
            dayCell.appendChild(eventChip);
        });
        monthGrid.appendChild(dayCell);
    }

    const totalCells = monthGrid.children.length;
    const remainingCells = 42 - totalCells;
    for (let j = 1; j <= remainingCells; j++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell', 'inactive-month');
        dayCell.innerHTML = `<span class="date">${j}</span>`;
        monthGrid.appendChild(dayCell);
    }
}

// ==========================================
// SISTEMA DE ALERTAS Y CONFIRMACIONES VISUALES
// ==========================================
function customConfirm(title, message, isAlert = false) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        
        const btnOk = document.getElementById('btnConfirmOk');
        const btnCancel = document.getElementById('btnConfirmCancel');
        
        btnCancel.style.display = isAlert ? 'none' : 'block';
        modal.classList.remove('hidden');
        
        const newBtnOk = btnOk.cloneNode(true);
        btnOk.parentNode.replaceChild(newBtnOk, btnOk);
        const newBtnCancel = btnCancel.cloneNode(true);
        btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
        
        newBtnOk.addEventListener('click', () => {
            modal.classList.add('hidden');
            resolve(true); 
        });
        
        newBtnCancel.addEventListener('click', () => {
            modal.classList.add('hidden');
            resolve(false); 
        });
    });
}

// ==========================================
// LÓGICA DE CATEGORÍAS (CREAR, EDITAR, BORRAR)
// ==========================================
btnOpenCategoryModal.addEventListener('click', () => {
    catIdInput.value = ''; 
    categoryForm.reset();
    document.querySelector('#categoryModal h2').textContent = 'Nueva Categoría';
    categoryModal.classList.remove('hidden');
});

window.editCategory = function(catId) {
    const cat = categories.find(c => c.id === catId);
    if(cat) {
        catIdInput.value = cat.id;
        document.getElementById('catName').value = cat.name;
        document.getElementById('catColor').value = cat.color;
        document.querySelector('#categoryModal h2').textContent = 'Editar Categoría';
        categoryModal.classList.remove('hidden');
    }
}

window.deleteCategory = async function(catId) {
    const isInUse = events.some(e => e.categoryId === catId);
    if (isInUse) {
        await customConfirm("⚠️ Acción denegada", "No puedes borrar esta categoría porque tiene eventos asignados.", true);
        return;
    }
    const confirmed = await customConfirm("Borrar Categoría", "¿Estás seguro de eliminar esta categoría?");
    if(confirmed) {
        categories = categories.filter(c => c.id !== catId);
        localStorage.setItem('myCalendarCategories', JSON.stringify(categories));
        renderCategories();
    }
}

closeCategoryBtn.addEventListener('click', () => {
    categoryModal.classList.add('hidden');
});

categoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if(catIdInput.value) { 
        const index = categories.findIndex(c => c.id === catIdInput.value);
        categories[index].name = document.getElementById('catName').value;
        categories[index].color = document.getElementById('catColor').value;
    } else { 
        const newCategory = {
            id: 'cat_' + Date.now(),
            name: document.getElementById('catName').value,
            color: document.getElementById('catColor').value
        };
        categories.push(newCategory);
    }
    localStorage.setItem('myCalendarCategories', JSON.stringify(categories));
    categoryModal.classList.add('hidden');
    renderCategories();
    renderCalendar(); 
});

// ==========================================
// LÓGICA DE EVENTOS (CREAR, EDITAR, BORRAR)
// ==========================================
function positionPopover(e) {
    popover.classList.remove('hidden'); 
    let x = e.clientX;
    let y = e.clientY;
    const popoverRect = popover.getBoundingClientRect();
    if (x + popoverRect.width > window.innerWidth) x = window.innerWidth - popoverRect.width - 20;
    if (y + popoverRect.height > window.innerHeight) y = window.innerHeight - popoverRect.height - 20;
    popover.style.left = `${x}px`;
    popover.style.top = `${y}px`;
}

function openPopover(e, dateStr) {
    eventForm.reset(); 
    eventIdInput.value = ''; 
    eventDateInput.value = dateStr; 
    btnDeleteEvent.classList.add('hidden'); 
    document.getElementById('btnSaveEvent').textContent = 'Guardar';
    positionPopover(e);
}

function openPopoverForEdit(e, evtObj) {
    eventIdInput.value = evtObj.id;
    eventDateInput.value = evtObj.date;
    document.getElementById('eventTitle').value = evtObj.title;
    document.getElementById('eventCategory').value = evtObj.categoryId;
    document.getElementById('eventStart').value = evtObj.start;
    document.getElementById('eventEnd').value = evtObj.end;
    document.getElementById('eventDesc').value = evtObj.desc;
    
    btnDeleteEvent.classList.remove('hidden'); 
    document.getElementById('btnSaveEvent').textContent = 'Actualizar';
    positionPopover(e);
}

function closePopover() { popover.classList.add('hidden'); }

closeBtn.addEventListener('click', closePopover);
popover.addEventListener('click', (e) => e.stopPropagation());
window.addEventListener('click', (e) => {
    if (!popover.contains(e.target) && !e.target.closest('.day-cell') && !e.target.closest('.event-chip')) {
        closePopover();
    }
});

eventForm.addEventListener('submit', (e) => {
    e.preventDefault(); 
    const evtData = {
        date: eventDateInput.value,
        categoryId: eventCategorySelect.value,
        title: document.getElementById('eventTitle').value,
        start: document.getElementById('eventStart').value,
        end: document.getElementById('eventEnd').value,
        desc: document.getElementById('eventDesc').value
    };

    if (eventIdInput.value) { 
        const index = events.findIndex(ev => ev.id == eventIdInput.value);
        events[index] = { ...events[index], ...evtData };
    } else { 
        events.push({ id: Date.now(), ...evtData }); 
    }
    
    localStorage.setItem('myCalendarEvents', JSON.stringify(events)); 
    closePopover();
    renderCalendar(); 
});

btnDeleteEvent.addEventListener('click', async () => {
    const confirmed = await customConfirm("Borrar Evento", "¿Estás seguro de que quieres borrar este evento?");
    if(confirmed) {
        events = events.filter(ev => ev.id != eventIdInput.value);
        localStorage.setItem('myCalendarEvents', JSON.stringify(events));
        closePopover();
        renderCalendar();
    }
});

// ==========================================
// NAVEGACIÓN E INICIALIZACIÓN
// ==========================================
btnPrev.addEventListener('click', () => { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(); });
btnNext.addEventListener('click', () => { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar(); });
btnToday.addEventListener('click', () => { currentMonth = new Date().getMonth(); currentYear = new Date().getFullYear(); renderCalendar(); });

renderCategories();
renderCalendar();