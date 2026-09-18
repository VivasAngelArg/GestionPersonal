import { StorageService } from './storageService.js';

// DOM
const monthGrid = document.getElementById('monthGrid');
const currentMonthText = document.querySelector('.current-month');
const btnPrev = document.querySelectorAll('.btn-nav')[0]; 
const btnNext = document.querySelectorAll('.btn-nav')[1]; 
const btnToday = document.querySelector('.btn-today');

// Modos
const tabModeEdit = document.getElementById('tabModeEdit');
const tabModePaint = document.getElementById('tabModePaint');
const tabModeSummary = document.getElementById('tabModeSummary');
const paintPalette = document.getElementById('paintPalette');
const presetChipsContainer = document.getElementById('presetChipsContainer');

// Popover
const popover = document.getElementById('eventPopover');
const popoverTitle = document.getElementById('popoverTitle');
const closeBtn = document.querySelector('.close-btn');
const eventForm = document.getElementById('eventForm');
const eventIdInput = document.getElementById('eventId'); 
const eventDateInput = document.getElementById('eventDate'); 
const eventCategorySelect = document.getElementById('eventCategory');
const btnDeleteEvent = document.getElementById('btnDeleteEvent'); 

// Categorías
const categoryModal = document.getElementById('categoryModal');
const closeCategoryBtn = document.querySelector('.close-category-btn');
const categoryForm = document.getElementById('categoryForm');
const btnOpenCategoryModal = document.getElementById('btnOpenCategoryModal');
const categoryListUl = document.getElementById('categoryList');
const catIdInput = document.getElementById('catId'); 

// Backup & Resumen
const btnExportBackup = document.getElementById('btnExportBackup');
const btnImportBackup = document.getElementById('btnImportBackup');
const fileImportBackup = document.getElementById('fileImportBackup');
const summaryModal = document.getElementById('summaryModal');
const closeSummaryBtn = document.querySelector('.close-summary-btn');
const summaryMonthText = document.getElementById('summaryMonthText');
const summaryStatsList = document.getElementById('summaryStatsList');

// Estado global
let date = new Date();
let currentMonth = date.getMonth();
let currentYear = date.getFullYear();
const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

let currentMode = 'edit'; 
let selectedCategoryId = null;
let enabledCategories = new Set(); 

let events = [];
let categories = [];

async function initApp() {
    categories = await StorageService.getCategories();
    events = await StorageService.getEvents();

    categories.forEach(c => enabledCategories.add(c.id));
    if (categories.length > 0) selectedCategoryId = categories[0].id;

    renderCategories();
    renderCalendar();
    setupEventListeners();
}

function setMode(mode) {
    currentMode = mode;
    tabModeEdit.classList.toggle('active', mode === 'edit');
    tabModePaint.classList.toggle('active', mode === 'paint');
    document.body.classList.toggle('mode-paint', mode === 'paint');

    if (mode === 'paint') {
        paintPalette.classList.remove('hidden');
        renderPalette();
    } else {
        paintPalette.classList.add('hidden');
    }
}

function renderCategories() {
    categoryListUl.innerHTML = '';
    eventCategorySelect.innerHTML = '';

    categories.forEach(cat => {
        const li = document.createElement('li');
        li.className = 'category-item';

        const isChecked = enabledCategories.has(cat.id);

        li.innerHTML = `
            <label class="category-label">
                <input type="checkbox" data-catid="${cat.id}" ${isChecked ? 'checked' : ''}>
                <span class="color-dot" style="background-color: ${cat.color}"></span>
                ${cat.name}
            </label>
            <div class="cat-actions">
                <button class="btn-edit-cat" data-id="${cat.id}">✏️</button>
                <button class="btn-delete-cat" data-id="${cat.id}">🗑️</button>
            </div>
        `;
        categoryListUl.appendChild(li);

        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        eventCategorySelect.appendChild(option);
    });

    categoryListUl.querySelectorAll('input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', (e) => {
            const catId = e.target.dataset.catid;
            if (e.target.checked) enabledCategories.add(catId);
            else enabledCategories.delete(catId);
            renderCalendar();
        });
    });

    categoryListUl.querySelectorAll('.btn-edit-cat').forEach(btn => {
        btn.addEventListener('click', () => editCategory(btn.dataset.id));
    });
    categoryListUl.querySelectorAll('.btn-delete-cat').forEach(btn => {
        btn.addEventListener('click', () => deleteCategory(btn.dataset.id));
    });

    renderPalette();
}

function renderPalette() {
    presetChipsContainer.innerHTML = '';
    categories.forEach(cat => {
        const chip = document.createElement('div');
        chip.className = `preset-chip ${cat.id === selectedCategoryId ? 'selected' : ''}`;
        chip.style.backgroundColor = cat.color;
        chip.style.color = '#ffffff';
        chip.textContent = cat.name;

        chip.addEventListener('click', () => {
            selectedCategoryId = cat.id;
            renderPalette();
        });

        presetChipsContainer.appendChild(chip);
    });
}

function renderCalendar() {
    monthGrid.innerHTML = '';
    currentMonthText.textContent = `${monthNames[currentMonth]} de ${currentYear}`;

    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const today = new Date();

    // DÍAS DEL MES ANTERIOR
    const prevMonthDate = new Date(currentYear, currentMonth, 0);
    const prevMonthNum = prevMonthDate.getMonth() + 1;
    const prevYearNum = prevMonthDate.getFullYear();

    for (let x = firstDayIndex; x > 0; x--) {
        const dayNum = prevLastDay - x + 1;
        const cellDateStr = `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        
        const dayCell = createDayCell(dayNum, cellDateStr, true);
        monthGrid.appendChild(dayCell);
    }

    // DÍAS DEL MES ACTUAL
    for (let i = 1; i <= lastDay; i++) {
        const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isToday = (i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear());
        
        const dayCell = createDayCell(i, cellDateStr, false, isToday);
        monthGrid.appendChild(dayCell);
    }

    // DÍAS DEL MES SIGUIENTE
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
    const nextMonthNum = nextMonthDate.getMonth() + 1;
    const nextYearNum = nextMonthDate.getFullYear();

    // AQUÍ VA EL BLOQUE DINÁMICO
    const totalCells = monthGrid.children.length;
    const targetTotalCells = totalCells > 35 ? 42 : 35; // Define 5 o 6 filas dinámicamente
    const remainingCells = targetTotalCells - totalCells;

    for (let j = 1; j <= remainingCells; j++) {
        const cellDateStr = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
        const dayCell = createDayCell(j, cellDateStr, true);
        monthGrid.appendChild(dayCell);
    }
} // <-- AQUÍ CIERRA renderCalendar()

// FUNCIÓN AUXILIAR (Fuera de renderCalendar)
function createDayCell(dayNumber, cellDateStr, isInactive = false, isToday = false) {
    const dayCell = document.createElement('div');
    dayCell.classList.add('day-cell');
    if (isInactive) dayCell.classList.add('inactive-month');
    if (isToday) dayCell.classList.add('today');

    const cellHeader = document.createElement('div');
    cellHeader.className = 'day-cell-header';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'date';
    if (isToday) dateSpan.classList.add('active-circle');
    dateSpan.textContent = dayNumber;

    cellHeader.appendChild(dateSpan);
    dayCell.appendChild(cellHeader);

    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'events-container';

    const dayEvents = events.filter(e => e.date === cellDateStr && enabledCategories.has(e.categoryId));

    dayEvents.forEach(evt => {
        const eventChip = document.createElement('div');
        eventChip.classList.add('event-chip');

        const categoryObj = categories.find(c => c.id === evt.categoryId);
        if (categoryObj) {
            eventChip.style.backgroundColor = categoryObj.color;
            eventChip.style.color = '#ffffff';
        }

        eventChip.textContent = evt.start ? `${evt.start} | ${evt.title}` : evt.title;

        eventChip.addEventListener('click', (e) => {
            if (currentMode === 'edit') {
                e.stopPropagation();
                openPopoverForEdit(e, evt);
            }
        });

        eventsContainer.appendChild(eventChip);
    });

    dayCell.appendChild(eventsContainer);

    dayCell.addEventListener('click', (e) => {
        if (currentMode === 'paint') {
            handlePaintClick(cellDateStr);
        } else {
            openPopover(e, cellDateStr);
        }
    });

    return dayCell;
}

async function handlePaintClick(dateStr) {
    if (!selectedCategoryId) return;
    const catObj = categories.find(c => c.id === selectedCategoryId);
    if (!catObj) return;

    const existingIndex = events.findIndex(e => e.date === dateStr && e.categoryId === selectedCategoryId);

    if (existingIndex !== -1) {
        await StorageService.deleteEvent(events[existingIndex].id);
    } else {
        await StorageService.saveEvent({
            date: dateStr,
            categoryId: selectedCategoryId,
            title: catObj.name,
            desc: 'Turno / Asignación rápida'
        });
    }

    events = await StorageService.getEvents();
    renderCalendar();
}

function openPopover(e, dateStr) {
    eventForm.reset(); 
    eventIdInput.value = ''; 
    eventDateInput.value = dateStr; 
    btnDeleteEvent.classList.add('hidden'); 
    document.getElementById('btnSaveEvent').textContent = 'Guardar';

    const [, month, day] = dateStr.split('-');
    popoverTitle.textContent = `Evento del ${parseInt(day)} de ${monthNames[parseInt(month) - 1]}`;
    popover.classList.remove('hidden');
}

function openPopoverForEdit(e, evtObj) {
    eventIdInput.value = evtObj.id;
    eventDateInput.value = evtObj.date;
    document.getElementById('eventTitle').value = evtObj.title;
    document.getElementById('eventCategory').value = evtObj.categoryId;
    document.getElementById('eventStart').value = evtObj.start || '';
    document.getElementById('eventEnd').value = evtObj.end || '';
    document.getElementById('eventDesc').value = evtObj.desc || '';

    btnDeleteEvent.classList.remove('hidden'); 
    document.getElementById('btnSaveEvent').textContent = 'Actualizar';

    const [, month, day] = evtObj.date.split('-');
    popoverTitle.textContent = `Editar evento del ${parseInt(day)} de ${monthNames[parseInt(month) - 1]}`;
    popover.classList.remove('hidden');
}

closeBtn.addEventListener('click', () => popover.classList.add('hidden'));

eventForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    const evtData = {
        id: eventIdInput.value ? parseFloat(eventIdInput.value) : null,
        date: eventDateInput.value,
        categoryId: eventCategorySelect.value,
        title: document.getElementById('eventTitle').value,
        start: document.getElementById('eventStart').value,
        end: document.getElementById('eventEnd').value,
        desc: document.getElementById('eventDesc').value
    };

    await StorageService.saveEvent(evtData);
    events = await StorageService.getEvents();
    popover.classList.add('hidden');
    renderCalendar(); 
});

btnDeleteEvent.addEventListener('click', async () => {
    const confirmed = await customConfirm("Borrar Evento", "¿Estás seguro de eliminar este evento?");
    if (confirmed) {
        await StorageService.deleteEvent(eventIdInput.value);
        events = await StorageService.getEvents();
        popover.classList.add('hidden');
        renderCalendar();
    }
});

btnOpenCategoryModal.addEventListener('click', () => {
    catIdInput.value = '';
    categoryForm.reset();
    categoryModal.classList.remove('hidden');
});

closeCategoryBtn.addEventListener('click', () => categoryModal.classList.add('hidden'));

categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const catData = {
        id: catIdInput.value || null,
        name: document.getElementById('catName').value,
        color: document.getElementById('catColor').value
    };
    const saved = await StorageService.saveCategory(catData);
    enabledCategories.add(saved.id);
    categories = await StorageService.getCategories();
    categoryModal.classList.add('hidden');
    renderCategories();
    renderCalendar();
});

async function editCategory(catId) {
    const cat = categories.find(c => c.id === catId);
    if (cat) {
        catIdInput.value = cat.id;
        document.getElementById('catName').value = cat.name;
        document.getElementById('catColor').value = cat.color;
        categoryModal.classList.remove('hidden');
    }
}

async function deleteCategory(catId) {
    const isInUse = events.some(e => e.categoryId === catId);
    if (isInUse) {
        await customConfirm("⚠️ Acción denegada", "No puedes borrar esta categoría porque tiene eventos asignados.", true);
        return;
    }
    const confirmed = await customConfirm("Borrar Categoría", "¿Deseas eliminar esta categoría?");
    if (confirmed) {
        await StorageService.deleteCategory(catId);
        enabledCategories.delete(catId);
        categories = await StorageService.getCategories();
        renderCategories();
        renderCalendar();
    }
}

async function openSummaryModal() {
    summaryMonthText.textContent = `${monthNames[currentMonth]} de ${currentYear}`;
    summaryStatsList.innerHTML = '';

    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthEvents = events.filter(e => e.date.startsWith(monthPrefix));

    categories.forEach(cat => {
        const count = monthEvents.filter(e => e.categoryId === cat.id).length;
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        statItem.innerHTML = `
            <div class="stat-info">
                <span class="stat-badge" style="background-color: ${cat.color}"></span>
                <span class="stat-name">${cat.name}</span>
            </div>
            <span class="stat-count">${count} días</span>
        `;
        summaryStatsList.appendChild(statItem);
    });

    summaryModal.classList.remove('hidden');
}

closeSummaryBtn.addEventListener('click', () => summaryModal.classList.add('hidden'));

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
        
        newBtnOk.addEventListener('click', () => { modal.classList.add('hidden'); resolve(true); });
        newBtnCancel.addEventListener('click', () => { modal.classList.add('hidden'); resolve(false); });
    });
}

function setupEventListeners() {
    tabModeEdit.addEventListener('click', () => setMode('edit'));
    tabModePaint.addEventListener('click', () => setMode('paint'));
    tabModeSummary.addEventListener('click', openSummaryModal);

    btnExportBackup.addEventListener('click', () => StorageService.exportBackupJSON());
    btnImportBackup.addEventListener('click', () => fileImportBackup.click());
    fileImportBackup.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            try {
                await StorageService.importBackupJSON(e.target.files[0]);
                await initApp();
                await customConfirm("Backup Restaurado", "Los datos se han cargado exitosamente.", true);
            } catch (err) {
                await customConfirm("Error", "Ocurrió un problema al leer el archivo de backup.", true);
            }
        }
    });

    btnPrev.addEventListener('click', () => { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(); });
    btnNext.addEventListener('click', () => { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar(); });
    btnToday.addEventListener('click', () => { currentMonth = new Date().getMonth(); currentYear = new Date().getFullYear(); renderCalendar(); });
}
// Ocultar / Mostrar Barra Lateral
const btnMenu = document.querySelector('.btn-menu');
const sidebar = document.querySelector('.sidebar');

if (btnMenu && sidebar) {
    btnMenu.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
}
initApp();