import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCswQoKzD5wfSnheEPpia1PCGqxVnXNQm8",
    authDomain: "wedd-cb4d6.firebaseapp.com",
    projectId: "wedd-cb4d6",
    storageBucket: "wedd-cb4d6.firebasestorage.app",
    messagingSenderId: "533724418327",
    appId: "1:533724418327:web:8bf38f1451b265ec11e752",
    databaseURL: "https://wedd-cb4d6-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Default State (If completely new)
const defaultState = {
    theme: 'light',
    persiapan: [
        { id: 1, title: 'Menentukan Tanggal', desc: 'Diskusikan dengan keluarga kedua belah pihak', checked: false },
        { id: 2, title: 'Cincin Kawin', desc: 'Membeli sepasang cincin', checked: false },
        { id: 3, title: 'Mahar', desc: 'Sesuai kesepakatan', checked: false }
    ],
    timeline: [
        { id: 1, month: 'Bulan 12-10 Sebelum H', task: 'Tentukan tanggal dan budget', checked: false },
        { id: 2, month: 'Bulan 9-6 Sebelum H', task: 'DP Venue dan Catering', checked: false }
    ],
    berkasCPW: [
        { id: 1, title: 'FC KTP, KK, Akta Kelahiran', checked: false },
        { id: 2, title: 'Surat Pengantar RT/RW', checked: false },
        { id: 3, title: 'Surat N1, N2, N4 dari Kelurahan', checked: false }
    ],
    berkasCPP: [
        { id: 1, title: 'FC KTP, KK, Akta Kelahiran', checked: false },
        { id: 2, title: 'Surat Pengantar RT/RW', checked: false },
        { id: 3, title: 'Surat N1, N2, N4 dari Kelurahan', checked: false }
    ],
    budget: [],
    seserahan: [],
    vendorSeleksi: [],
    vendorFinal: [],
    jobdesk: [],
    catering: [],
    undangan: [],
    weddingDate: ''
};


let appState = null;
let isLoaded = false; // flag to prevent flashing empty UI

// Modal State
let currentEditStateKey = null;
let currentEditId = null;

// Listen to Firebase Realtime Database
onValue(ref(db, 'weddingTrackerData'), (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // Firebase removes empty arrays, so we must manually ensure they exist
        appState = {
            theme: data.theme || 'light',
            persiapan: data.persiapan || [],
            timeline: data.timeline || [],
            berkasCPW: data.berkasCPW || [],
            berkasCPP: data.berkasCPP || [],
            budget: data.budget || [],
            seserahan: data.seserahan || [],
            vendorSeleksi: data.vendorSeleksi || [],
            vendorFinal: data.vendorFinal || [],
            jobdesk: data.jobdesk || [],
            catering: data.catering || [],
            undangan: data.undangan || [],
            weddingDate: data.weddingDate || ''
        };
    } else {
        // If DB is totally empty (First ever load)
        appState = JSON.parse(JSON.stringify(defaultState));
        // Save default state to Firebase
        set(ref(db, 'weddingTrackerData'), appState);
    }

    // Once data is locked in, re-render UI
    isLoaded = true;
    renderAll();
    updateProgress();

    if (appState.theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
    }
});

// Save State to Firebase
function saveState() {
    if (appState) {
        set(ref(db, 'weddingTrackerData'), appState)
            .then(() => updateProgress())
            .catch(error => showToast("Gagal menyimpan ke database"));
    }
}

// Show Toast Notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Generate Unique ID
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// ====== UI Navigation & Theme ======

document.addEventListener('DOMContentLoaded', () => {

    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        if (!isLoaded) return;
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            appState.theme = 'light';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            appState.theme = 'dark';
        }
        saveState();
    });

    // Date Select Modal Logic
    const dateModal = document.getElementById('dateModal');
    const closeDateBtns = [document.getElementById('closeDateModalBtn'), document.getElementById('cancelDateModalBtn')];

    closeDateBtns.forEach(btn => {
        if (btn) btn.addEventListener('click', closeDateModal);
    });

    // Mobile Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    document.getElementById('mobileToggle').addEventListener('click', () => {
        sidebar.classList.add('open');
    });
    document.getElementById('mobileClose').addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    // Navigation Logic
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('pageTitle');

    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            const target = btn.getAttribute('data-target');
            btn.classList.add('active');
            document.getElementById(target).classList.add('active');

            pageTitle.textContent = btn.textContent.trim();

            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });

    // Modal Logic
    const editModal = document.getElementById('editModal');
    const closeModalBtns = [document.getElementById('closeModalBtn'), document.getElementById('cancelModalBtn')];

    closeModalBtns.forEach(btn => {
        if (btn) btn.addEventListener('click', closeEditModal);
    });

    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });

    const saveModalBtn = document.getElementById('saveModalBtn');
    if (saveModalBtn) saveModalBtn.addEventListener('click', saveEditedItem);
});

function closeEditModal() {
    const editModal = document.getElementById('editModal');
    if (editModal) editModal.classList.remove('show');
    currentEditStateKey = null;
    currentEditId = null;
}

// ====== EXPORT GLOBALLY FOR HTML ONCLICK COMPATIBILITY ======
window.addItem = addItem;
window.deleteItem = deleteItem;
window.editItem = editItem;
window.toggleCheck = toggleCheck;
window.addTimelineTask = addTimelineTask;
window.addBudget = addBudget;
window.updateBiayaAktual = updateBiayaAktual;
window.addSeserahan = addSeserahan;
window.addVendor = addVendor;
window.pindahFinal = pindahFinal;
window.addJobdesk = addJobdesk;
window.addCatering = addCatering;
window.updateCateringField = updateCateringField;
window.addUndangan = addUndangan;
window.updateUndanganField = updateUndanganField;
window.openDateModal = openDateModal;
window.closeDateModal = closeDateModal;
window.saveWeddingDate = saveWeddingDate;
window.updateCountdown = updateCountdown;

// ====== Render Functions ======

function renderAll() {
    if (!appState) return;
    renderList('persiapan', 'listPersiapan');
    renderTimeline();
    renderSimpleList('berkasCPW', 'listBerkasCPW');
    renderSimpleList('berkasCPP', 'listBerkasCPP');
    renderBudget();
    renderSeserahan();
    renderVendor('vendorSeleksi', 'listVendorSeleksi');
    renderVendor('vendorFinal', 'listVendorFinal');
    renderJobdesk();
    renderCatering();
    renderUndangan();
    updateCountdown();
}

// 1. Persiapan Menikah
function renderList(stateKey, elementId) {
    const list = document.getElementById(elementId);
    list.innerHTML = '';

    appState[stateKey].forEach(item => {
        const li = document.createElement('li');
        li.className = `item-row ${item.checked ? 'completed' : ''}`;
        li.innerHTML = `
            <div class="item-content">
                <input type="checkbox" class="checkbox-custom" ${item.checked ? 'checked' : ''} onchange="toggleCheck('${stateKey}', ${item.id})">
                <div class="item-text">
                    <span class="item-title">${item.title}</span>
                    ${item.desc ? `<span class="item-desc">${item.desc}</span>` : ''}
                    ${item.link ? `<a href="${item.link}" target="_blank" class="item-link" style="font-size: 0.8rem; margin-top: 4px; display: inline-flex; align-items: center; gap: 4px; color: var(--primary); text-decoration: none;"><i class="ri-link"></i> Referensi</a>` : ''}
                </div>
            </div>
            <div class="action-btns">
                <button class="btn-icon edit" onclick="editItem('${stateKey}', ${item.id})"><i class="ri-edit-line"></i></button>
                <button class="btn-icon delete" onclick="deleteItem('${stateKey}', ${item.id})"><i class="ri-delete-bin-line"></i></button>
            </div>
        `;
        list.appendChild(li);
    });
}

function addItem(stateKey) {
    if (!isLoaded) return;
    const titleInput = document.getElementById('inputPersiapanTitle');
    const descInput = document.getElementById('inputPersiapanDesc');
    const linkInput = document.getElementById('inputPersiapanLink');

    if (!titleInput.value.trim()) return showToast('Judul tidak boleh kosong');

    appState[stateKey].push({
        id: generateId(),
        title: titleInput.value.trim(),
        desc: descInput.value.trim(),
        link: linkInput ? linkInput.value.trim() : '',
        checked: false
    });

    titleInput.value = '';
    descInput.value = '';
    if (linkInput) linkInput.value = '';

    saveState();
    showToast('Berhasil ditambahkan');
}


// 2. Timeline Persiapan
function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    container.innerHTML = '';

    const grouped = appState.timeline.reduce((acc, curr) => {
        if (!acc[curr.month]) acc[curr.month] = [];
        acc[curr.month].push(curr);
        return acc;
    }, {});

    for (const [month, tasks] of Object.entries(grouped)) {
        let tasksHtml = tasks.map(t => `
            <li class="item-row ${t.checked ? 'completed' : ''}" style="margin-bottom: 8px;">
                <div class="item-content">
                    <input type="checkbox" class="checkbox-custom" ${t.checked ? 'checked' : ''} onchange="toggleCheck('timeline', ${t.id})">
                    <div class="item-text">
                        <span class="item-title">${t.task}</span>
                    </div>
                </div>
                <div class="action-btns">
                    <button class="btn-icon edit" onclick="editItem('timeline', ${t.id})"><i class="ri-edit-line"></i></button>
                    <button class="btn-icon delete" onclick="deleteItem('timeline', ${t.id})"><i class="ri-delete-bin-line"></i></button>
                </div>
            </li>
        `).join('');

        container.innerHTML += `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div class="timeline-month">${month}</div>
                    <ul class="todo-list">${tasksHtml}</ul>
                </div>
            </div>
        `;
    }
}

function addTimelineTask() {
    if (!isLoaded) return;
    const month = document.getElementById('inputTimelineMonth').value;
    const task = document.getElementById('inputTimelineTask').value;

    if (!task.trim()) return showToast('Tugas tidak boleh kosong');

    appState.timeline.push({
        id: generateId(),
        month: month,
        task: task.trim(),
        checked: false
    });

    document.getElementById('inputTimelineTask').value = '';
    saveState();
    showToast('Timeline ditambahkan');
}

// Generic Toggles & Deletes
function toggleCheck(stateKey, id) {
    if (!isLoaded) return;
    const index = appState[stateKey].findIndex(item => item.id == id);
    if (index !== -1) {
        appState[stateKey][index].checked = !appState[stateKey][index].checked;
        saveState();
    }
}

function deleteItem(stateKey, id) {
    if (!isLoaded) return;
    if (confirm('Hapus item ini?')) {
        appState[stateKey] = appState[stateKey].filter(item => item.id != id);
        saveState();
        renderAll();
        showToast('Item dihapus');
    }
}

function editItem(stateKey, id) {
    if (!isLoaded) return;
    const item = appState[stateKey].find(i => i.id == id);
    if (!item) return;

    currentEditStateKey = stateKey;
    currentEditId = id;

    const modal = document.getElementById('editModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = 'Edit Item';
    let html = '';

    switch (stateKey) {
        case 'persiapan':
            html += `<div class="form-group"><label>Judul</label><input type="text" id="editPersTitle" value="${item.title}"></div>`;
            html += `<div class="form-group"><label>Keterangan</label><input type="text" id="editPersDesc" value="${item.desc || ''}"></div>`;
            html += `<div class="form-group"><label>Link Referensi</label><input type="url" id="editPersLink" value="${item.link || ''}"></div>`;
            break;
        case 'timeline':
            html += `<div class="form-group"><label>Tugas</label><input type="text" id="editTlTask" value="${item.task}"></div>`;
            break;
        case 'berkasCPW':
        case 'berkasCPP':
            html += `<div class="form-group"><label>Berkas</label><input type="text" id="editBerkasTitle" value="${item.title}"></div>`;
            break;
        case 'budget':
            html += `<div class="form-group"><label>Kategori</label><input type="text" id="editBudKategori" value="${item.kategori}"></div>`;
            html += `<div class="form-group"><label>Item</label><input type="text" id="editBudItem" value="${item.item}"></div>`;
            html += `<div class="form-group"><label>Estimasi Biaya (Rp)</label><input type="number" id="editBudEst" value="${item.estimasi}"></div>`;
            break;
        case 'seserahan':
            html += `<div class="form-group"><label>Item</label><input type="text" id="editSesItem" value="${item.item}"></div>`;
            html += `<div class="form-group"><label>Brand/Merk</label><input type="text" id="editSesBrand" value="${item.brand || ''}"></div>`;
            html += `<div class="form-group"><label>Harga (Rp)</label><input type="number" id="editSesHarga" value="${item.harga}"></div>`;
            break;
        case 'vendorSeleksi':
        case 'vendorFinal':
            html += `<div class="form-group"><label>Kategori</label><input type="text" id="editVenKat" value="${item.kategori}"></div>`;
            html += `<div class="form-group"><label>Nama Vendor</label><input type="text" id="editVenNama" value="${item.nama}"></div>`;
            break;
        case 'jobdesk':
            html += `<div class="form-group"><label>Vendor/Divisi</label><input type="text" id="editJobVendor" value="${item.vendor}"></div>`;
            html += `<div class="form-group"><label>Tugas</label><input type="text" id="editJobTugas" value="${item.tugas}"></div>`;
            break;
        case 'catering':
            html += `<div class="form-group"><label>Nama Catering</label><input type="text" id="editCatNama" value="${item.nama}"></div>`;
            html += `<div class="form-group"><label>Paket</label><input type="text" id="editCatPaket" value="${item.paket || ''}"></div>`;
            html += `<div class="form-group"><label>Harga Estimasi (Rp)</label><input type="number" id="editCatHarga" value="${item.harga}"></div>`;
            break;
        case 'undangan':
            html += `<div class="form-group"><label>Nama Tamu</label><input type="text" id="editUndNama" value="${item.nama}"></div>`;
            html += `<div class="form-group"><label>Relasi</label><input type="text" id="editUndRelasi" value="${item.relasi || ''}"></div>`;
            html += `<div class="form-group"><label>Jumlah Orang</label><input type="number" id="editUndJumlah" value="${item.jumlah}"></div>`;
            break;
    }

    modalBody.innerHTML = html;
    modal.classList.add('show');
}

function saveEditedItem() {
    if (!currentEditStateKey || !currentEditId || !appState) return;

    const item = appState[currentEditStateKey].find(i => i.id == currentEditId);
    if (!item) return;

    try {
        switch (currentEditStateKey) {
            case 'persiapan':
                item.title = document.getElementById('editPersTitle').value.trim() || item.title;
                item.desc = document.getElementById('editPersDesc').value.trim();
                item.link = document.getElementById('editPersLink').value.trim();
                break;
            case 'timeline':
                item.task = document.getElementById('editTlTask').value.trim() || item.task;
                break;
            case 'berkasCPW':
            case 'berkasCPP':
                item.title = document.getElementById('editBerkasTitle').value.trim() || item.title;
                break;
            case 'budget':
                item.kategori = document.getElementById('editBudKategori').value.trim() || item.kategori;
                item.item = document.getElementById('editBudItem').value.trim() || item.item;
                item.estimasi = document.getElementById('editBudEst').value || item.estimasi;
                break;
            case 'seserahan':
                item.item = document.getElementById('editSesItem').value.trim() || item.item;
                item.brand = document.getElementById('editSesBrand').value.trim();
                item.harga = document.getElementById('editSesHarga').value || item.harga;
                break;
            case 'vendorSeleksi':
            case 'vendorFinal':
                item.kategori = document.getElementById('editVenKat').value.trim() || item.kategori;
                item.nama = document.getElementById('editVenNama').value.trim() || item.nama;
                break;
            case 'jobdesk':
                item.vendor = document.getElementById('editJobVendor').value.trim() || item.vendor;
                item.tugas = document.getElementById('editJobTugas').value.trim() || item.tugas;
                break;
            case 'catering':
                item.nama = document.getElementById('editCatNama').value.trim() || item.nama;
                item.paket = document.getElementById('editCatPaket').value.trim();
                item.harga = document.getElementById('editCatHarga').value || item.harga;
                break;
            case 'undangan':
                item.nama = document.getElementById('editUndNama').value.trim() || item.nama;
                item.relasi = document.getElementById('editUndRelasi').value.trim();
                item.jumlah = document.getElementById('editUndJumlah').value || item.jumlah;
                break;
        }

        saveState();
        renderAll();
        closeEditModal();
        showToast('Item berhasil diperbarui');
    } catch (e) {
        console.error("Error saving edit:", e);
        showToast('Gagal menyimpan perubahan');
    }
}

// 3. Berkas KUA
function renderSimpleList(stateKey, elementId) {
    const list = document.getElementById(elementId);
    list.innerHTML = '';

    appState[stateKey].forEach(item => {
        const li = document.createElement('li');
        li.className = `item-row ${item.checked ? 'completed' : ''}`;
        li.innerHTML = `
            <div class="item-content">
                <input type="checkbox" class="checkbox-custom" ${item.checked ? 'checked' : ''} onchange="toggleCheck('${stateKey}', ${item.id})">
                <div class="item-text">
                    <span class="item-title" style="font-size: 0.95rem;">${item.title}</span>
                </div>
            </div>
            <div class="action-btns" style="display:flex; gap: 4px; align-items:center;">
                <button class="btn-icon edit" style="padding:4px; font-size:1rem;" onclick="editItem('${stateKey}', ${item.id})"><i class="ri-edit-line"></i></button>
                <button class="btn-icon delete" style="padding:4px; font-size:1rem;" onclick="deleteItem('${stateKey}', ${item.id})"><i class="ri-close-line"></i></button>
            </div>
        `;
        list.appendChild(li);
    });
}

function addSimpleItem(elementId, inputId) {
    if (!isLoaded) return;
    const stateKey = elementId === 'listBerkasCPW' ? 'berkasCPW' : 'berkasCPP';
    const input = document.getElementById(inputId);

    if (!input.value.trim()) return;

    appState[stateKey].push({
        id: generateId(),
        title: input.value.trim(),
        checked: false
    });

    input.value = '';
    saveState();
}

// 4. Budget Nikah
function formatRp(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}

function renderBudget() {
    const tbody = document.getElementById('tableBudget');
    tbody.innerHTML = '';

    let tEstimasi = 0;
    let tAktual = 0;

    appState.budget.forEach(item => {
        tEstimasi += Number(item.estimasi);
        tAktual += Number(item.aktual);

        let statusBadge = item.aktual > 0 ? `<span class="badge success">Sudah Dibayar</span>` : `<span class="badge warning">Belum Dibayar</span>`;
        if (item.aktual > 0 && item.aktual < item.estimasi) {
            statusBadge = `<span class="badge primary">DP / Sebagian</span>`;
        } else if (item.aktual > item.estimasi) {
            statusBadge = `<span class="badge danger">Overbudget</span>`;
        }

        tbody.innerHTML += `
            <tr>
                <td><strong>${item.kategori}</strong></td>
                <td>${item.item}</td>
                <td>${formatRp(item.estimasi)}</td>
                <td>
                    <input type="number" value="${item.aktual}" onchange="updateBiayaAktual(${item.id}, this.value)" style="width: 120px; padding: 6px; font-size: 0.85rem;">
                </td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn-icon edit" onclick="editItem('budget', ${item.id})"><i class="ri-edit-line"></i></button>
                        <button class="btn-icon delete" onclick="deleteItem('budget', ${item.id})"><i class="ri-delete-bin-line"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });

    document.getElementById('totalEstimasi').textContent = formatRp(tEstimasi);
    document.getElementById('totalTerpakai').textContent = formatRp(tAktual);
    document.getElementById('sisaBudget').textContent = formatRp(tEstimasi - tAktual);
}

function addBudget() {
    if (!isLoaded) return;
    const kat = document.getElementById('budgetKategori').value;
    const item = document.getElementById('budgetItem').value;
    const est = document.getElementById('budgetEstimasi').value;

    if (!kat || !item || !est) return showToast('Lengkapi semua data budget');

    appState.budget.push({
        id: generateId(),
        kategori: kat,
        item: item,
        estimasi: est,
        aktual: 0
    });

    document.getElementById('budgetKategori').value = '';
    document.getElementById('budgetItem').value = '';
    document.getElementById('budgetEstimasi').value = '';

    saveState();
    showToast('Budget ditambahkan');
}

function updateBiayaAktual(id, value) {
    if (!isLoaded) return;
    const item = appState.budget.find(i => i.id == id);
    if (item) {
        item.aktual = value;
        saveState();
        showToast('Biaya aktual diupdate');
    }
}

// 5. Checklist Seserahan
function renderSeserahan() {
    const tbody = document.getElementById('tableSeserahan');
    tbody.innerHTML = '';

    appState.seserahan.forEach(item => {
        tbody.innerHTML += `
            <tr class="${item.checked ? 'completed' : ''}">
                <td>
                    <input type="checkbox" class="checkbox-custom" ${item.checked ? 'checked' : ''} onchange="toggleCheck('seserahan', ${item.id})">
                </td>
                <td style="${item.checked ? 'text-decoration: line-through; color: var(--text-muted);' : ''}"><strong>${item.item}</strong></td>
                <td>${item.brand || '-'}</td>
                <td>${formatRp(item.harga)}</td>
                <td>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn-icon edit" onclick="editItem('seserahan', ${item.id})"><i class="ri-edit-line"></i></button>
                        <button class="btn-icon delete" onclick="deleteItem('seserahan', ${item.id})"><i class="ri-delete-bin-line"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function addSeserahan() {
    if (!isLoaded) return;
    const item = document.getElementById('seserahanItem').value;
    const brand = document.getElementById('seserahanBrand').value;
    const harga = document.getElementById('seserahanHarga').value || 0;

    if (!item) return showToast('Nama item wajib diisi');

    appState.seserahan.push({
        id: generateId(),
        item: item,
        brand: brand,
        harga: harga,
        checked: false
    });

    document.getElementById('seserahanItem').value = '';
    document.getElementById('seserahanBrand').value = '';
    document.getElementById('seserahanHarga').value = '';

    saveState();
    showToast('Item Seserahan ditambahkan');
}

// 6. List Vendor
function renderVendor(stateKey, elementId) {
    const list = document.getElementById(elementId);
    list.innerHTML = '';

    appState[stateKey].forEach(item => {
        list.innerHTML += `
            <li class="item-row" style="padding: 12px; margin-bottom: 8px;">
                <div class="item-content">
                    <div class="stat-icon" style="width: 40px; height: 40px; font-size: 1.2rem;">
                        <i class="ri-store-2-line"></i>
                    </div>
                    <div class="item-text">
                        <span class="item-title" style="font-size: 1rem;">${item.nama}</span>
                        <span class="badge primary" style="width: fit-content; margin-top: 4px;">${item.kategori}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 4px; align-items: center;">
                    ${stateKey === 'vendorSeleksi' ?
                `<button class="btn-icon" style="color: var(--success);" onclick="pindahFinal(${item.id})" title="Pilih sebagai Final"><i class="ri-check-double-line"></i></button>`
                : ''}
                    <button class="btn-icon edit" onclick="editItem('${stateKey}', ${item.id})"><i class="ri-edit-line"></i></button>
                    <button class="btn-icon delete" onclick="deleteItem('${stateKey}', ${item.id})"><i class="ri-delete-bin-line"></i></button>
                </div>
            </li>
        `;
    });
}

function addVendor(type) {
    if (!isLoaded) return;
    const stateKey = type === 'seleksi' ? 'vendorSeleksi' : 'vendorFinal';
    const katId = type === 'seleksi' ? 'inputVendorKategori' : 'inputVendorKategoriFinal';
    const namaId = type === 'seleksi' ? 'inputVendorNama' : 'inputVendorNamaFinal';

    const kat = document.getElementById(katId).value;
    const nama = document.getElementById(namaId).value;

    if (!kat || !nama) return showToast('Lengkapi data vendor');

    appState[stateKey].push({
        id: generateId(),
        kategori: kat,
        nama: nama
    });

    document.getElementById(katId).value = '';
    document.getElementById(namaId).value = '';

    saveState();
}

function pindahFinal(id) {
    if (!isLoaded) return;
    const itemIndex = appState.vendorSeleksi.findIndex(i => i.id == id);
    if (itemIndex > -1) {
        const item = appState.vendorSeleksi[itemIndex];
        appState.vendorFinal.push(item);
        appState.vendorSeleksi.splice(itemIndex, 1);
        saveState();
        showToast('Vendor dipindah ke Final');
    }
}

// 7. Job Desk Vendor
function renderJobdesk() {
    const container = document.getElementById('jobdeskContainer');
    container.innerHTML = '';

    const grouped = appState.jobdesk.reduce((acc, curr) => {
        if (!acc[curr.vendor]) acc[curr.vendor] = [];
        acc[curr.vendor].push(curr);
        return acc;
    }, {});

    for (const [vendor, tasks] of Object.entries(grouped)) {
        let tasksHtml = tasks.map(t => `
            <li style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span><i class="ri-arrow-right-s-line" style="color: var(--primary);"></i> ${t.tugas}</span>
                <div style="display: flex; gap: 4px; align-items: center;">
                    <button class="btn-icon edit" style="width:24px;height:24px;font-size:0.9rem;" onclick="editItem('jobdesk', ${t.id})"><i class="ri-edit-line"></i></button>
                    <button class="btn-icon delete" style="width:24px;height:24px;font-size:0.9rem;" onclick="deleteItem('jobdesk', ${t.id})"><i class="ri-close-line"></i></button>
                </div>
            </li>
        `).join('');

        container.innerHTML += `
            <div class="card" style="margin-bottom: 16px;">
                <h3 class="accent-title" style="margin-bottom: 12px;"><i class="ri-user-settings-line"></i> ${vendor}</h3>
                <ul style="list-style: none; padding-left: 8px;">${tasksHtml}</ul>
            </div>
        `;
    }
}

function addJobdesk() {
    if (!isLoaded) return;
    const vendor = document.getElementById('jobdeskVendor').value;
    const tugas = document.getElementById('jobdeskTugas').value;

    if (!vendor || !tugas) return showToast('Lengkapi vendor dan tugasnya');

    appState.jobdesk.push({
        id: generateId(),
        vendor: vendor,
        tugas: tugas
    });

    document.getElementById('jobdeskVendor').value = '';
    document.getElementById('jobdeskTugas').value = '';

    saveState();
    showToast('Tugas ditambahkan');
}

// 8. List Catering/Resto
function renderCatering() {
    const tbody = document.getElementById('tableCatering');
    tbody.innerHTML = '';

    appState.catering.forEach(item => {
        const badgeKeputusan = item.keputusan === 'DP / Final' ? `<span class="badge success">${item.keputusan}</span>` :
            (item.keputusan === 'Ditolak' ? `<span class="badge danger">${item.keputusan}</span>` : `<span class="badge warning">${item.keputusan}</span>`);

        tbody.innerHTML += `
            <tr>
                <td><strong>${item.nama}</strong></td>
                <td>${item.paket}</td>
                <td>${formatRp(item.harga)}</td>
                <td>
                    <select onchange="updateCateringField(${item.id}, 'testFood', this.value === 'true')" style="padding: 4px; font-size: 0.85rem; width: auto;">
                        <option value="false" ${!item.testFood ? 'selected' : ''}>Belum</option>
                        <option value="true" ${item.testFood ? 'selected' : ''}>Sudah</option>
                    </select>
                </td>
                <td>
                    <select onchange="updateCateringField(${item.id}, 'keputusan', this.value)" style="padding: 4px; font-size: 0.85rem; width: auto;">
                        <option value="Pending" ${item.keputusan === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="DP / Final" ${item.keputusan === 'DP / Final' ? 'selected' : ''}>DP / Final</option>
                        <option value="Ditolak" ${item.keputusan === 'Ditolak' ? 'selected' : ''}>Ditolak</option>
                    </select>
                </td>
                <td>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn-icon edit" onclick="editItem('catering', ${item.id})"><i class="ri-edit-line"></i></button>
                        <button class="btn-icon delete" onclick="deleteItem('catering', ${item.id})"><i class="ri-delete-bin-line"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function addCatering() {
    if (!isLoaded) return;
    const nama = document.getElementById('cateringNama').value;
    const paket = document.getElementById('cateringPaket').value;
    const harga = document.getElementById('cateringHarga').value;

    if (!nama) return showToast('Nama catering wajib diisi');

    appState.catering.push({
        id: generateId(),
        nama: nama,
        paket: paket,
        harga: harga || 0,
        testFood: false,
        keputusan: 'Pending'
    });

    document.getElementById('cateringNama').value = '';
    document.getElementById('cateringPaket').value = '';
    document.getElementById('cateringHarga').value = '';

    saveState();
    showToast('Kandidat catering ditambahkan');
}

function updateCateringField(id, field, value) {
    if (!isLoaded) return;
    const item = appState.catering.find(i => i.id == id);
    if (item) {
        item[field] = value;
        saveState();
    }
}

// 9. List Undangan
function renderUndangan() {
    const tbody = document.getElementById('tableUndangan');
    tbody.innerHTML = '';

    let tTotal = 0;
    let tHadir = 0;
    let tTidak = 0;

    appState.undangan.forEach(item => {
        tTotal += Number(item.jumlah);
        if (item.konfirmasi === 'Hadir') tHadir += Number(item.jumlah);
        if (item.konfirmasi === 'Tidak Hadir') tTidak += Number(item.jumlah);

        const badgeKonfir = item.konfirmasi === 'Hadir' ? `<span class="badge success"><i class="ri-check-line"></i> Hadir</span>` :
            (item.konfirmasi === 'Tidak Hadir' ? `<span class="badge danger"><i class="ri-close-line"></i> Tidak Hadir</span>` : `<span class="badge warning">Pending</span>`);

        tbody.innerHTML += `
            <tr>
                <td><strong>${item.nama}</strong></td>
                <td><span class="badge primary">${item.relasi}</span></td>
                <td>${item.jumlah} Orang</td>
                <td>
                    <input type="checkbox" class="checkbox-custom" ${item.dikirim ? 'checked' : ''} onchange="updateUndanganField(${item.id}, 'dikirim', this.checked)">
                </td>
                <td>
                    <select onchange="updateUndanganField(${item.id}, 'konfirmasi', this.value)" style="padding: 4px; font-size: 0.85rem; width: auto;">
                        <option value="Pending" ${item.konfirmasi === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Hadir" ${item.konfirmasi === 'Hadir' ? 'selected' : ''}>Hadir</option>
                        <option value="Tidak Hadir" ${item.konfirmasi === 'Tidak Hadir' ? 'selected' : ''}>Tidak Hadir</option>
                    </select>
                </td>
                <td>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn-icon edit" onclick="editItem('undangan', ${item.id})"><i class="ri-edit-line"></i></button>
                        <button class="btn-icon delete" onclick="deleteItem('undangan', ${item.id})"><i class="ri-delete-bin-line"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });

    document.getElementById('totalUndangan').textContent = tTotal;
    document.getElementById('totalHadir').textContent = tHadir;
    document.getElementById('totalTidakHadir').textContent = tTidak;
}

function addUndangan() {
    if (!isLoaded) return;
    const nama = document.getElementById('undanganNama').value;
    const relasi = document.getElementById('undanganRelasi').value;
    const jml = document.getElementById('undanganJumlah').value;

    if (!nama) return showToast('Nama undangan wajib diisi');

    appState.undangan.push({
        id: generateId(),
        nama: nama,
        relasi: relasi || 'Umum',
        jumlah: jml,
        dikirim: false,
        konfirmasi: 'Pending'
    });

    document.getElementById('undanganNama').value = '';
    document.getElementById('undanganRelasi').value = '';
    document.getElementById('undanganJumlah').value = '1';

    saveState();
    showToast('Tamu undangan ditambahkan');
}

function updateUndanganField(id, field, value) {
    if (!isLoaded) return;
    const item = appState.undangan.find(i => i.id == id);
    if (item) {
        item[field] = value;
        saveState();
    }
}

// Overall Progress Indicator
function updateProgress() {
    let totalItems = 0;
    let completedItems = 0;

    const checklistKeys = ['persiapan', 'timeline', 'berkasCPW', 'berkasCPP', 'seserahan'];

    checklistKeys.forEach(key => {
        if (appState && appState[key]) {
            totalItems += appState[key].length;
            completedItems += appState[key].filter(item => item.checked).length;
        }
    });

    let percentage = 0;
    if (totalItems > 0) {
        percentage = Math.round((completedItems / totalItems) * 100);
    }

    document.getElementById('overallProgress').style.width = `${percentage}%`;
    document.getElementById('overallText').textContent = `${percentage}%`;
}

// ====== Countdown Widget ======
function openDateModal() {
    const modal = document.getElementById('dateModal');
    if (modal) {
        modal.classList.add('show');
        const dtInput = document.getElementById('inputWeddingDateTime');
        if (dtInput && appState && appState.weddingDate) {
            dtInput.value = appState.weddingDate;
        }
    }
}

function closeDateModal() {
    const modal = document.getElementById('dateModal');
    if (modal) modal.classList.remove('show');
}

function saveWeddingDate() {
    if (!isLoaded || !appState) return;
    const dtInput = document.getElementById('inputWeddingDateTime').value;
    appState.weddingDate = dtInput;
    saveState();
    closeDateModal();
    updateCountdown();
    showToast('Tanggal Hari H disimpan');
}

function updateCountdown() {
    const timerDisplay = document.getElementById('countdownTimer');
    if (!timerDisplay) return;

    if (!appState || !appState.weddingDate) {
        timerDisplay.textContent = 'Atur Tanggal';
        return;
    }

    const targetDate = new Date(appState.weddingDate).getTime();

    function calc() {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            timerDisplay.textContent = 'Hari H Telah Tiba! 🎉';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Pad single digits
        const h = hours < 10 ? '0' + hours : hours;
        const m = minutes < 10 ? '0' + minutes : minutes;
        const s = seconds < 10 ? '0' + seconds : seconds;

        if (days > 0) {
            timerDisplay.textContent = `${days}Hr ${h}:${m}:${s}`;
        } else {
            timerDisplay.textContent = `${h}:${m}:${s}`;
        }
    }

    calc(); // initial call
    // Set interval to update every second if not already running globally
    if (!window.countdownInterval) {
        window.countdownInterval = setInterval(() => {
            if (appState && appState.weddingDate) calc();
        }, 1000);
    }
}
