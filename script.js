// ===========================
//  KONFIGURACJA
// ===========================

// IP urządzenia, na którym działa server.js (port 3000)
const API_URL = "http://172.20.10.4:3000/api/tables";
    "node server\\server.js:3000/api/tables";

// 14 stolików: 5 na górze, 9 na dole po prawej
const defaultTables = [
    // górne 5
    { id: 'T1',  x: 37, y: 12, status: 'free',     seats: 4 },
    { id: 'T2',  x: 50, y: 12, status: 'free',     seats: 4 },
    { id: 'T3',  x: 63, y: 12, status: 'reserved', seats: 4 },
    { id: 'T4',  x: 76, y: 12, status: 'free',     seats: 4 },
    { id: 'T5',  x: 89, y: 12, status: 'pending',  seats: 4 },

    // dolna prawa siatka 3x3
    { id: 'T6',  x: 63, y: 45, status: 'free',     seats: 4 },
    { id: 'T7',  x: 76, y: 45, status: 'free',     seats: 4 },
    { id: 'T8',  x: 89, y: 45, status: 'reserved', seats: 4 },

    { id: 'T9',  x: 63, y: 66, status: 'free',     seats: 4 },
    { id: 'T10', x: 76, y: 66, status: 'pending',  seats: 4 },
    { id: 'T11', x: 89, y: 66, status: 'free',     seats: 4 },

    { id: 'T12', x: 63, y: 87, status: 'free',     seats: 4 },
    { id: 'T13', x: 76, y: 87, status: 'free',     seats: 4 },
    { id: 'T14', x: 89, y: 87, status: 'free',     seats: 4 }
];

const statusLabels = {
    free: 'Wolny',
    reserved: 'Zarezerwowany',
    pending: 'W trakcie potwierdzania'
};

const clone = obj => JSON.parse(JSON.stringify(obj));

// ===========================
//  STAN APLIKACJI
// ===========================

let tables = [];              // będzie załadowane z API
let selectedTableId = null;
let currentRole = 'user';     // 'user' | 'admin'
let adminUnlocked = false;
let modalMode = 'create';     // 'create' | 'edit'

// ===========================
//  DOM ELEMENTY
// ===========================

const floorMapEl          = document.getElementById('floor-map');
const tableListEl         = document.getElementById('table-list');
const noSelectionTextEl   = document.getElementById('no-selection-text');
const detailsContentEl    = document.getElementById('details-content');
const detailIdEl          = document.getElementById('detail-id');
const detailStatusDotEl   = document.getElementById('detail-status-dot');
const detailStatusTextEl  = document.getElementById('detail-status-text');
const detailSeatsEl       = document.getElementById('detail-seats');
const reservationInfoRow  = document.getElementById('reservation-info');
const reservationTextEl   = document.getElementById('reservation-text');

const reserveBtn          = document.getElementById('reserve-btn');
const editBtn             = document.getElementById('edit-res-btn');
const deleteBtn           = document.getElementById('delete-res-btn');

const pendingListEl       = document.getElementById('pending-list');
const noPendingTextEl     = document.getElementById('no-pending-text');

const modalEl             = document.getElementById('reservation-modal');
const reservationForm     = document.getElementById('reservation-form');
const cancelBtn           = document.getElementById('reservation-cancel');
const inputFirstName      = document.getElementById('firstName');
const inputLastName       = document.getElementById('lastName');
const inputEmail          = document.getElementById('email');
const inputPhone          = document.getElementById('phone');
const inputDate           = document.getElementById('date');
const inputTime           = document.getElementById('time');

const roleUserBtn         = document.getElementById('role-user');
const roleAdminBtn        = document.getElementById('role-admin');

// ===========================
//  API – ładowanie/zapis
// ===========================

async function loadTablesFromStorage() {
    try {
        const res = await fetch(API_URL);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length) {
                return data;
            }
        }
    } catch (e) {
        console.error('Błąd ładowania z serwera:', e);
    }

    const fallback = clone(defaultTables);
    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fallback)
        });
    } catch (e) {
        console.error('Błąd zapisu domyślnych danych na serwer:', e);
    }
    return fallback;
}

async function saveTablesToStorage() {
    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tables)
        });
    } catch (e) {
        console.error('Błąd zapisu na serwer:', e);
    }
}

// ===========================
//  ROLE I UI
// ===========================

function updateRoleUI() {
    if (currentRole === 'user') {
        document.body.classList.add('mode-user');
        document.body.classList.remove('mode-admin');
        roleUserBtn.classList.add('role-btn-active');
        roleAdminBtn.classList.remove('role-btn-active');

        reserveBtn.style.display = 'inline-flex';
        editBtn.style.display    = 'none';
        deleteBtn.style.display  = 'none';
    } else {
        document.body.classList.add('mode-admin');
        document.body.classList.remove('mode-user');
        roleAdminBtn.classList.add('role-btn-active');
        roleUserBtn.classList.remove('role-btn-active');

        reserveBtn.style.display = 'inline-flex';
        editBtn.style.display    = 'inline-flex';
        deleteBtn.style.display  = 'inline-flex';
    }

    if (selectedTableId) {
        const t = tables.find(t => t.id === selectedTableId);
        if (t) updateButtonsForTable(t);
    } else {
        reserveBtn.disabled = true;
        editBtn.disabled    = true;
        deleteBtn.disabled  = true;
    }

    renderPendingList();
}

roleUserBtn.addEventListener('click', () => {
    currentRole = 'user';
    updateRoleUI();
});

roleAdminBtn.addEventListener('click', () => {
    if (!adminUnlocked) {
        const pw = prompt('Podaj hasło administratora:');
        if (pw !== 'admin') {
            alert('Nieprawidłowe hasło.');
            return;
        }
        adminUnlocked = true;
    }
    currentRole = 'admin';
    updateRoleUI();
});

// ===========================
//  RENDER: PLAN I LISTA
// ===========================

function renderTablesOnMap() {
    floorMapEl.querySelectorAll('.table').forEach(el => el.remove());

    tables.forEach(table => {
        const el = document.createElement('div');
        el.classList.add('table', 'table--' + table.status);
        el.dataset.id = table.id;
        el.textContent = table.id;

        el.style.left = table.x + '%';
        el.style.top  = table.y + '%';
        el.style.transform = 'translate(-50%, -50%)';

        el.addEventListener('click', () => selectTable(table.id));
        floorMapEl.appendChild(el);
    });

    if (selectedTableId) {
        const exists = tables.some(t => t.id === selectedTableId);
        if (exists) {
            selectTable(selectedTableId);
        } else {
            selectedTableId = null;
        }
    }
}

function renderTableList() {
    tableListEl.innerHTML = '';
    tables.forEach(table => {
        const li = document.createElement('li');
        li.classList.add('table-list-item');
        li.dataset.id = table.id;

        li.innerHTML = `
            <span class="table-list-id">${table.id}</span>
            <span class="status-pill">
                <span class="status-dot ${table.status}"></span>
                ${statusLabels[table.status]}
            </span>
        `;
        li.addEventListener('click', () => selectTable(table.id));
        tableListEl.appendChild(li);
    });
}

// ===========================
//  PENDING LIST (ADMIN)
// ===========================

function renderPendingList() {
    if (!pendingListEl) return;

    const pendingTables = tables.filter(
        t => t.status === 'pending' && t.reservation
    );

    pendingListEl.innerHTML = '';

    if (pendingTables.length === 0) {
        noPendingTextEl.style.display = 'block';
        return;
    }

    noPendingTextEl.style.display = 'none';

    pendingTables.forEach(table => {
        const li = document.createElement('li');
        li.classList.add('pending-item');

        const topRow = document.createElement('div');
        topRow.classList.add('pending-row');
        topRow.innerHTML =
            `<span class="pending-id">${table.id}</span>` +
            `<span>${table.reservation.firstName} ${table.reservation.lastName}</span>`;

        const bottomRow = document.createElement('div');
        bottomRow.classList.add('pending-row');

        const infoSpan = document.createElement('span');
        infoSpan.textContent = `${table.reservation.date} ${table.reservation.time}`;

        const actions = document.createElement('div');
        actions.classList.add('pending-actions');

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Potwierdź';
        confirmBtn.classList.add('btn-primary', 'btn-small');
        confirmBtn.addEventListener('click', () => confirmReservation(table.id));

        const rejectBtn = document.createElement('button');
        rejectBtn.textContent = 'Odrzuć';
        rejectBtn.classList.add('btn-secondary', 'btn-small');
        rejectBtn.addEventListener('click', () => rejectReservation(table.id));

        actions.appendChild(confirmBtn);
        actions.appendChild(rejectBtn);

        bottomRow.appendChild(infoSpan);
        bottomRow.appendChild(actions);

        li.appendChild(topRow);
        li.appendChild(bottomRow);

        li.addEventListener('click', e => {
            if (e.target.tagName.toLowerCase() === 'button') return;
            selectTable(table.id);
        });

        pendingListEl.appendChild(li);
    });
}

// ===========================
//  LOGIKA STOLIKÓW
// ===========================

function isReservable(table) {
    return table.status === 'free' && !table.reservation;
}

function updateButtonsForTable(table) {
    if (currentRole === 'user') {
        editBtn.disabled   = true;
        deleteBtn.disabled = true;

        if (isReservable(table)) {
            reserveBtn.disabled = false;
            reserveBtn.textContent = 'Zarezerwuj';
        } else {
            reserveBtn.disabled = true;
            reserveBtn.textContent = 'Stolik zajęty';
        }
    } else {
        reserveBtn.textContent = 'Zarezerwuj';
        editBtn.textContent    = 'Edytuj rezerwację';
        deleteBtn.textContent  = 'Usuń rezerwację';

        const hasRes = table.status !== 'free' || !!table.reservation;

        reserveBtn.disabled = hasRes;
        editBtn.disabled    = !hasRes;
        deleteBtn.disabled  = !hasRes;
    }
}

function selectTable(id) {
    selectedTableId = id;

    document.querySelectorAll('.table').forEach(el =>
        el.classList.toggle('selected', el.dataset.id === id)
    );
    document.querySelectorAll('.table-list-item').forEach(li =>
        li.classList.toggle('active', li.dataset.id === id)
    );

    const t = tables.find(t => t.id === id);
    if (!t) return;

    noSelectionTextEl.style.display = 'none';
    detailsContentEl.style.display  = 'block';

    detailIdEl.textContent         = t.id;
    detailSeatsEl.textContent      = t.seats + ' miejsca';
    detailStatusTextEl.textContent = statusLabels[t.status];
    detailStatusDotEl.className    = 'status-dot ' + t.status;

    if (t.reservation) {
        reservationInfoRow.style.display = 'block';
        reservationTextEl.textContent =
            `${t.reservation.firstName} ${t.reservation.lastName}, ` +
            `${t.reservation.date} ${t.reservation.time}`;
    } else {
        reservationInfoRow.style.display = 'none';
        reservationTextEl.textContent = '';
    }

    updateButtonsForTable(t);
}

// ===========================
//  MODAL REZERWACJI
// ===========================

function openReservationModal(mode) {
    if (!selectedTableId) return;
    const t = tables.find(t => t.id === selectedTableId);
    if (!t) return;

    modalMode = mode;

    if (currentRole === 'user') {
        if (!isReservable(t)) {
            alert('Ten stolik jest już zajęty.');
            return;
        }
        inputFirstName.value = '';
        inputLastName.value  = '';
        inputEmail.value     = '';
        inputPhone.value     = '';
        inputDate.value      = '';
        inputTime.value      = '';
    } else {
        if (mode === 'create') {
            if (t.status !== 'free' || t.reservation) {
                alert('Ten stolik ma już rezerwację.');
                return;
            }
            inputFirstName.value = '';
            inputLastName.value  = '';
            inputEmail.value     = '';
            inputPhone.value     = '';
            inputDate.value      = '';
            inputTime.value      = '';
        } else {
            inputFirstName.value = t.reservation?.firstName || '';
            inputLastName.value  = t.reservation?.lastName  || '';
            inputEmail.value     = t.reservation?.email     || '';
            inputPhone.value     = t.reservation?.phone     || '';
            inputDate.value      = t.reservation?.date      || '';
            inputTime.value      = t.reservation?.time      || '';
        }
    }

    modalEl.classList.remove('hidden');
    modalEl.classList.add('visible');
}

function closeReservationModal() {
    modalEl.classList.remove('visible');
    setTimeout(() => modalEl.classList.add('hidden'), 150);
}

reserveBtn.addEventListener('click', () => openReservationModal('create'));
editBtn.addEventListener('click',   () => openReservationModal('edit'));

cancelBtn.addEventListener('click', e => {
    e.preventDefault();
    closeReservationModal();
});

// ===========================
//  WALIDACJA DATY/CZASU
// ===========================

function isDateTimeInPast(dateStr, timeStr) {
    if (!dateStr || !timeStr) return true;
    const now = new Date();
    const selected = new Date(`${dateStr}T${timeStr}`);
    return selected <= now;
}

function setMinDate() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const min = `${yyyy}-${mm}-${dd}`;
    inputDate.setAttribute('min', min);
}

// zapis rezerwacji
reservationForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!selectedTableId) return;

    // walidacja daty/czasu
    if (isDateTimeInPast(inputDate.value, inputTime.value)) {
        alert('Nie można wybrać przeszłej daty lub czasu.');
        return;
    }

    const t = tables.find(t => t.id === selectedTableId);
    if (!t) return;

    if (currentRole === 'user' && !isReservable(t)) {
        alert('Ten stolik jest już zajęty.');
        closeReservationModal();
        return;
    }

    t.reservation = {
        firstName: inputFirstName.value.trim(),
        lastName : inputLastName.value.trim(),
        email    : inputEmail.value.trim(),
        phone    : inputPhone.value.trim(),
        date     : inputDate.value,
        time     : inputTime.value
    };

    if (currentRole === 'user') {
        t.status = 'pending';
    } else {
        if (modalMode === 'create' && t.status === 'free') {
            t.status = 'reserved';
        }
    }

    await saveTablesToStorage();
    renderTablesOnMap();
    renderTableList();
    renderPendingList();
    selectTable(t.id);

    closeReservationModal();
});

// ===========================
//  ADMIN: POTWIERDŹ / ODRZUĆ
// ===========================

async function confirmReservation(id) {
    const t = tables.find(t => t.id === id);
    if (!t || !t.reservation) return;

    t.status = 'reserved';

    await saveTablesToStorage();
    renderTablesOnMap();
    renderTableList();
    renderPendingList();
    if (selectedTableId === id) selectTable(id);
}

async function rejectReservation(id) {
    const t = tables.find(t => t.id === id);
    if (!t || !t.reservation) return;

    const sure = confirm('Odrzucić rezerwację dla ' + id + '?');
    if (!sure) return;

    delete t.reservation;
    t.status = 'free';

    await saveTablesToStorage();
    renderTablesOnMap();
    renderTableList();
    renderPendingList();
    if (selectedTableId === id) selectTable(id);
}

deleteBtn.addEventListener('click', () => {
    if (currentRole !== 'admin') return;
    if (!selectedTableId) return;
    rejectReservation(selectedTableId);
});

// ===========================
//  START + POLLING
// ===========================

reserveBtn.disabled = true;
editBtn.disabled    = true;
deleteBtn.disabled  = true;

async function init() {
    setMinDate();
    tables = await loadTablesFromStorage();
    renderTablesOnMap();
    renderTableList();
    renderPendingList();
    updateRoleUI();
}

init();

// автооновлення кожні 5 секунд
setInterval(async () => {
    const updated = await loadTablesFromStorage();
    if (JSON.stringify(updated) !== JSON.stringify(tables)) {
        tables = updated;
        renderTablesOnMap();
        renderTableList();
        renderPendingList();
    }
}, 1000);
