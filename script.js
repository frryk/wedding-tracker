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
    weddingDate: null,
    berkasCPWLink: '',
    berkasCPPLink: ''
};


let appState = null;
let isLoaded = false; // flag to prevent flashing empty UI

// Modal State
let currentEditStateKey = null;
let currentEditId = null;

let currentDeleteStateKey = null;
let currentDeleteId = null;

// Temp packages array for vendor edit modal
let currentVendorPackages = [];
let currentEditPackageIdx = -1; // index of package being edited inline

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
            weddingDate: data.weddingDate || '',
            berkasCPWLink: data.berkasCPWLink || '',
            berkasCPPLink: data.berkasCPPLink || ''
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
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function filterMobileToggle(open) {
        if (open) {
            sidebar.classList.add('open');
            if (sidebarOverlay) sidebarOverlay.classList.add('show');
        } else {
            sidebar.classList.remove('open');
            if (sidebarOverlay) sidebarOverlay.classList.remove('show');
        }
    }

    document.getElementById('mobileToggle').addEventListener('click', () => filterMobileToggle(true));
    document.getElementById('mobileClose').addEventListener('click', () => filterMobileToggle(false));
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => filterMobileToggle(false));
    }

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

            if (window.innerWidth <= 992) {
                filterMobileToggle(false);
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

    // Delete Modal Logic
    const deleteModal = document.getElementById('deleteModal');
    const closeDeleteBtns = [document.getElementById('closeDeleteModalBtn'), document.getElementById('cancelDeleteBtn')];

    closeDeleteBtns.forEach(btn => {
        if (btn) btn.addEventListener('click', closeDeleteModal);
    });

    window.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });

    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDelete);
});

function closeEditModal() {
    const editModal = document.getElementById('editModal');
    if (editModal) editModal.classList.remove('show');
    currentEditStateKey = null;
    currentEditId = null;
}

function closeDeleteModal() {
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) deleteModal.classList.remove('show');
    currentDeleteStateKey = null;
    currentDeleteId = null;
}

// ====== EXPORT GLOBALLY FOR HTML ONCLICK COMPATIBILITY ======
window.addItem = addItem;
window.deleteItem = deleteItem;
window.confirmDelete = confirmDelete;
window.closeDeleteModal = closeDeleteModal;
window.editItem = editItem;
window.toggleCheck = toggleCheck;
window.addTimelineTask = addTimelineTask;
window.addBudget = addBudget;
window.addSeserahan = addSeserahan;
window.addVendor = addVendor;
window.pindahFinal = pindahFinal;
window.addJobdesk = addJobdesk;
window.addCatering = addCatering;
window.addSimpleItem = addSimpleItem;
window.populateJobdeskVendorSelect = populateJobdeskVendorSelect;
window.updateCateringField = updateCateringField;
window.addUndangan = addUndangan;
window.updateUndanganField = updateUndanganField;
window.openDateModal = openDateModal;
window.closeDateModal = closeDateModal;
window.saveWeddingDate = saveWeddingDate;
window.updateCountdown = updateCountdown;
window.editGlobalLink = editGlobalLink;
window.renderSeserahan = renderSeserahan;
window.addPackageToModal = addPackageToModal;
window.removePackageFromModal = removePackageFromModal;
window.editPackageInModal = editPackageInModal;
window.savePackageEdit = savePackageEdit;
window.cancelPackageEdit = cancelPackageEdit;

// ====== Render Functions ======

function renderAll() {
    if (!appState) return;
    renderList('persiapan', 'listPersiapan');
    renderTimeline();
    renderSimpleList('berkasCPW', 'listBerkasCPW');
    renderSimpleList('berkasCPP', 'listBerkasCPP');
    renderGlobalLinks();
    renderBudget();
    renderSeserahan();
    renderVendor('vendorSeleksi', 'listVendorSeleksi');
    renderVendor('vendorFinal', 'listVendorFinal');
    renderJobdesk();
    renderCatering();
    renderUndangan();
    updateCountdown();
    populateJobdeskVendorSelect();
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

    // Sort timeline by the numerical value inside the month string descending (e.g., 12 > 11 > 10)
    const sortedTimeline = [...appState.timeline].sort((a, b) => {
        const numA = parseInt((a.month.match(/\d+/) || [0])[0]);
        const numB = parseInt((b.month.match(/\d+/) || [0])[0]);
        return numB - numA;
    });

    const grouped = sortedTimeline.reduce((acc, curr) => {
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
    currentDeleteStateKey = stateKey;
    currentDeleteId = id;
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) deleteModal.classList.add('show');
}

function confirmDelete() {
    if (!isLoaded || !currentDeleteStateKey || currentDeleteId === null) return;
    
    appState[currentDeleteStateKey] = appState[currentDeleteStateKey].filter(item => item.id != currentDeleteId);
    saveState();
    renderAll();
    showToast('Item dihapus');
    closeDeleteModal();
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
            html = `
                <div class="form-group">
                    <label>Judul</label>
                    <input type="text" id="editPersTitle" value="${item.title}">
                </div>
                <div class="form-group">
                    <label>Keterangan</label>
                    <input type="text" id="editPersDesc" value="${item.desc || ''}">
                </div>
                <div class="form-group">
                    <label>Link Referensi</label>
                    <input type="url" id="editPersLink" value="${item.link || ''}">
                </div>
            `;
            break;
        case 'timeline':
            html = `
                <div class="form-group">
                    <label>Tugas</label>
                    <input type="text" id="editTlTask" value="${item.task}">
                </div>
            `;
            break;
        case 'berkasCPW':
        case 'berkasCPP':
            html = `
                <div class="form-group">
                    <label>Berkas</label>
                    <input type="text" id="editBerkasTitle" value="${item.title}">
                </div>
            `;
            break;
        case 'budget':
            const kats = ['Venue', 'Konsumsi', 'Attire', 'Entertainment', 'Transport', 'Seserahan', 'Tamu', 'KUA'];
            const katOptions = kats.map(k => `<option value="${k}" ${item.kategori === k ? 'selected' : ''}>${k}</option>`).join('');
            
            html = `
                <div class="grid-2" style="gap:12px;">
                    <div class="form-group">
                        <label>Kategori</label>
                        <select id="editBudKategori" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border);">
                            ${katOptions}
                            ${!kats.includes(item.kategori) && item.kategori ? `<option value="${item.kategori}" selected>${item.kategori}</option>` : ''}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Detail Item</label>
                        <input type="text" id="editBudItem" value="${item.item || ''}" style="width:100%;">
                    </div>
                </div>
                <div class="form-group" style="margin-top:12px;">
                    <label>Vendor</label>
                    <input type="text" id="editBudVendor" value="${item.vendor || ''}" style="width:100%;">
                </div>
                <div class="grid-2" style="gap:12px; margin-top:12px;">
                    <div class="form-group">
                        <label>Harga Satuan (Rp)</label>
                        <input type="number" id="editBudHarga" value="${item.harga || item.estimasi || 0}" style="width:100%;">
                    </div>
                    <div class="form-group">
                        <label>Qty</label>
                        <input type="number" id="editBudQty" value="${item.qty || 1}" min="1" style="width:100%;">
                    </div>
                </div>
                <div class="grid-2" style="gap:12px; margin-top:12px;">
                    <div class="form-group">
                        <label>DP Dibayar (Rp)</label>
                        <input type="number" id="editBudDp" value="${item.dpAkhir || 0}" style="width:100%;">
                    </div>
                    <div class="form-group">
                        <label>Tanggal DP</label>
                        <input type="date" id="editBudDpDate" value="${item.dpDate || ''}" style="width:100%;">
                    </div>
                </div>
                <div class="grid-2" style="gap:12px; margin-top:12px;">
                    <div class="form-group">
                        <label>Pelunasan (Rp)</label>
                        <input type="number" id="editBudLunas" value="${item.lunasAkhir || (item.aktual && !item.dpAkhir && !item.lunasAkhir ? item.aktual : 0)}" style="width:100%;">
                    </div>
                    <div class="form-group">
                        <label>Tanggal Lunas</label>
                        <input type="date" id="editBudLunasDate" value="${item.lunasDate || ''}" style="width:100%;">
                    </div>
                </div>
                <div class="form-group" style="margin-top:12px;">
                    <label>Keterangan</label>
                    <input type="text" id="editBudKet" value="${item.keterangan || ''}" style="width:100%;">
                </div>
            `;
            break;
        case 'seserahan':
            html = `
                <div class="form-group">
                    <label>Kategori</label>
                    <select id="editSesKat" style="padding:8px; border-radius:6px; border:1px solid var(--border);">
                        <option value="Dipakai Bersama" ${item.kategori === 'Dipakai Bersama' ? 'selected' : ''}>Dipakai Bersama</option>
                        <option value="Dipakai Pria" ${item.kategori === 'Dipakai Pria' ? 'selected' : ''}>Dipakai Pria</option>
                        <option value="Dipakai Wanita" ${item.kategori === 'Dipakai Wanita' ? 'selected' : ''}>Dipakai Wanita</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Item</label>
                    <input type="text" id="editSesItem" value="${item.item}">
                </div>
                <div class="form-group">
                    <label>Brand/Merk</label>
                    <input type="text" id="editSesBrand" value="${item.brand || ''}">
                </div>
                <div class="form-group">
                    <label>Harga (Rp)</label>
                    <input type="number" id="editSesHarga" value="${item.harga}">
                </div>
                <div class="form-group">
                    <label>Link Pembelian</label>
                    <input type="url" id="editSesLink" value="${item.link || ''}">
                </div>
            `;
            break;
        case 'vendorSeleksi':
        case 'vendorFinal':
            modalTitle.textContent = `Detail Vendor: ${item.nama}`;
            // Backward compat: migrate old flat fields into packages array
            if (!item.packages) {
                item.packages = [];
                if (item.harga || item.fasilitas || item.sk) {
                    item.packages.push({
                        id: generateId(),
                        nama: 'Paket 1',
                        harga: item.harga || '',
                        fasilitas: item.fasilitas || '',
                        sk: item.sk || ''
                    });
                    delete item.harga; delete item.fasilitas; delete item.sk;
                }
            }
            currentVendorPackages = JSON.parse(JSON.stringify(item.packages || []));
            html = `
                <div class="grid-2" style="gap:12px;">
                    <div class="form-group">
                        <label>Kategori</label>
                        <input type="text" id="editVenKat" value="${item.kategori}">
                    </div>
                    <div class="form-group">
                        <label>Nama Vendor</label>
                        <input type="text" id="editVenNama" value="${item.nama}">
                    </div>
                </div>
                <div class="form-group" style="margin-top:12px;">
                    <label>@username IG</label>
                    <input type="text" id="editVenIg" value="${item.ig || ''}">
                </div>
                <hr style="margin:16px 0; border:none; border-top:1px solid var(--border);">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
                    <strong style="font-size:0.95rem;"><i class="ri-price-tag-3-line" style="color:var(--primary);"></i> Paket Harga</strong>
                </div>
                <div id="modalPackageList"></div>
                <div style="background:var(--bg-main); border:1px dashed var(--border); border-radius:8px; padding:14px; margin-top:10px;">
                    <p style="font-size:0.8rem; font-weight:600; color:var(--text-muted); margin-bottom:10px; text-transform:uppercase; letter-spacing:.5px;">+ Tambah Paket Baru</p>
                    <div class="form-group" style="margin-bottom:8px;">
                        <label>Nama Paket</label>
                        <input type="text" id="newPktNama" placeholder="cth: Paket Silver / Paket Gold">
                    </div>
                    <div class="form-group" style="margin-bottom:8px;">
                        <label><i class="ri-money-dollar-circle-line" style="color:var(--primary);"></i> Harga</label>
                        <input type="number" id="newPktHarga" placeholder="Nominal angka (cth: 5000000)" min="0">
                    </div>
                    <div class="form-group" style="margin-bottom:8px;">
                        <label><i class="ri-star-line" style="color:var(--primary);"></i> Fasilitas</label>
                        <textarea id="newPktFasilitas" style="width:100%; border-radius:6px; border:1px solid var(--border); padding:8px; font-family:inherit; min-height:60px; resize:vertical; outline:none; background:var(--bg-card); color:var(--text-main);" placeholder="3 Fotografer, 2 Videografer, Album fisik..."></textarea>
                    </div>
                    <div class="form-group" style="margin-bottom:10px;">
                        <label><i class="ri-file-text-line" style="color:var(--primary);"></i> S&amp;K</label>
                        <textarea id="newPktSk" style="width:100%; border-radius:6px; border:1px solid var(--border); padding:8px; font-family:inherit; min-height:60px; resize:vertical; outline:none; background:var(--bg-card); color:var(--text-main);" placeholder="DP 50% saat booking, pelunasan H-7..."></textarea>
                    </div>
                    <button type="button" onclick="addPackageToModal()" class="btn-secondary" style="width:100%;"><i class="ri-add-line"></i> Tambah Paket</button>
                </div>
            `;
            break;
        case 'jobdesk':
            const vendorOptions = appState.vendorFinal.map(v =>
                `<option value="${v.nama}" ${item.vendor === v.nama ? 'selected' : ''}>${v.nama}</option>`
            ).join('');

            html = `
                <div class="form-group">
                    <label>Vendor/Divisi</label>
                    <select id="editJobVendor" style="padding:8px; border-radius:6px; border:1px solid var(--border);">
                        ${vendorOptions || `<option value="${item.vendor}" selected>${item.vendor}</option>`}
                    </select>
                </div>
                <div class="form-group">
                    <label>Tugas</label>
                    <textarea id="editJobTugas" style="width:100%; border-radius:6px; border:1px solid var(--border); padding:10px; font-family:inherit; min-height:80px; resize:vertical;">${item.tugas}</textarea>
                </div>
            `;
            break;
        case 'catering':
            html = `
                <div class="form-group">
                    <label>Nama Catering</label>
                    <input type="text" id="editCatNama" value="${item.nama}">
                </div>
                <div class="form-group">
                    <label>Paket</label>
                    <input type="text" id="editCatPaket" value="${item.paket || ''}">
                </div>
                <div class="form-group">
                    <label>Harga Estimasi (Rp)</label>
                    <input type="number" id="editCatHarga" value="${item.harga}">
                </div>
            `;
            break;
        case 'undangan':
            html = `
                <div class="grid-2" style="gap:12px;">
                    <div class="form-group">
                        <label>Nama Tamu</label>
                        <input type="text" id="editUndNama" value="${item.nama}">
                    </div>
                    <div class="form-group">
                        <label>Pihak</label>
                        <select id="editUndPihak" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border);">
                            <option value="CPW" ${item.pihak === 'CPW' ? 'selected' : ''}>Pihak CPW</option>
                            <option value="CPP" ${item.pihak === 'CPP' ? 'selected' : ''}>Pihak CPP</option>
                        </select>
                    </div>
                </div>
                <div class="grid-2" style="gap:12px; margin-top:12px;">
                    <div class="form-group">
                        <label>Relasi</label>
                        <input type="text" id="editUndRelasi" value="${item.relasi || ''}">
                    </div>
                    <div class="form-group">
                        <label>Jumlah Orang</label>
                        <input type="number" id="editUndJumlah" value="${item.jumlah}" min="1">
                    </div>
                </div>
            `;
            break;
    }

    modalBody.innerHTML = html;
    modal.classList.add('show');

    // If vendor modal, render the existing packages list now that DOM exists
    if (currentEditStateKey === 'vendorSeleksi' || currentEditStateKey === 'vendorFinal') {
        renderModalPackageList();
    }
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
                item.vendor = document.getElementById('editBudVendor').value.trim();
                item.harga = Number(document.getElementById('editBudHarga').value) || item.harga || item.estimasi || 0;
                item.qty = Number(document.getElementById('editBudQty').value) || item.qty || 1;
                item.dpAkhir = Number(document.getElementById('editBudDp').value) || 0;
                item.dpDate = document.getElementById('editBudDpDate').value;
                item.lunasAkhir = Number(document.getElementById('editBudLunas').value) || 0;
                item.lunasDate = document.getElementById('editBudLunasDate').value;
                item.keterangan = document.getElementById('editBudKet').value.trim();
                
                // cleanup legacy fields so they don't corrupt the logic later
                if(item.estimasi) delete item.estimasi;
                if(item.aktual) delete item.aktual;
                break;
            case 'seserahan':
                item.kategori = document.getElementById('editSesKat').value.trim() || item.kategori;
                item.item = document.getElementById('editSesItem').value.trim() || item.item;
                item.brand = document.getElementById('editSesBrand').value.trim();
                item.harga = document.getElementById('editSesHarga').value || item.harga;
                item.link = document.getElementById('editSesLink').value.trim();
                break;
            case 'vendorSeleksi':
            case 'vendorFinal':
                item.kategori = document.getElementById('editVenKat').value.trim() || item.kategori;
                item.nama = document.getElementById('editVenNama').value.trim() || item.nama;
                item.ig = document.getElementById('editVenIg').value.trim();
                item.packages = JSON.parse(JSON.stringify(currentVendorPackages));
                currentVendorPackages = [];
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
                item.pihak = document.getElementById('editUndPihak').value.trim() || 'CPW';
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
                    <span class="item-title" style="font-size: 0.95rem;">
                        ${item.title}
                    </span>
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

function editGlobalLink(key) {
    if (!isLoaded) return;
    const currentLink = appState[key] || '';
    const name = key === 'berkasCPWLink' ? 'CPW' : 'CPP';
    const newLink = prompt(`Masukkan Link Google Drive untuk Berkas ${name}:`, currentLink);

    if (newLink !== null) {
        appState[key] = newLink.trim();
        saveState();
        renderGlobalLinks();
        showToast('Link GDrive diperbarui');
    }
}

function renderGlobalLinks() {
    const cpw = document.getElementById('linkCPWDisplay');
    const cpp = document.getElementById('linkCPPDisplay');

    if (cpw) {
        if (appState.berkasCPWLink) {
            cpw.href = appState.berkasCPWLink;
            cpw.style.display = 'inline-block';
        } else {
            cpw.style.display = 'none';
        }
    }

    if (cpp) {
        if (appState.berkasCPPLink) {
            cpp.href = appState.berkasCPPLink;
            cpp.style.display = 'inline-block';
        } else {
            cpp.style.display = 'none';
        }
    }
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
        // Fallbacks for older data schemas
        const harga = item.harga || item.estimasi || 0;
        const qty = item.qty || 1;
        const dpAkhir = item.dpAkhir || 0;
        const lunasAkhir = item.lunasAkhir || 0;
        // if user had older 'aktual' value we can add it to lunasAkhir for backwards compat
        const legacyAktual = item.aktual && !item.dpAkhir && !item.lunasAkhir ? Number(item.aktual) : 0; 
        
        const subtotalEstimasi = Number(harga) * Number(qty);
        const subtotalAktual = Number(dpAkhir) + Number(lunasAkhir) + legacyAktual;

        tEstimasi += subtotalEstimasi;
        tAktual += subtotalAktual;

        let statusBadge = `<span class="badge warning">Belum Dibayar</span>`;
        if (subtotalAktual > 0 && subtotalAktual < subtotalEstimasi) {
            statusBadge = `<span class="badge primary">DP / Sebagian</span>`;
        } else if (subtotalAktual >= subtotalEstimasi && subtotalEstimasi > 0) {
            statusBadge = `<span class="badge success">Lunas</span>`;
        }

        tbody.innerHTML += `
            <tr>
                <td><span class="badge" style="background:var(--bg-main); border:1px solid var(--border); color:var(--text-main); font-weight:500;">${item.kategori || '-'}</span></td>
                <td><strong>${item.item || '-'}</strong></td>
                <td>${item.vendor || '-'}</td>
                <td>
                    <div style="font-size:0.85rem;">${formatRp(harga)} x ${qty}</div>
                </td>
                <td>
                    <div style="font-weight:600; color:var(--text-main);">${formatRp(dpAkhir)}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${item.dpDate || '-'}</div>
                </td>
                <td>
                    <div style="font-weight:600; color:var(--text-main);">${formatRp(lunasAkhir + legacyAktual)}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${item.lunasDate || '-'}</div>
                </td>
                <td>
                    <div style="font-size:0.8rem; color:var(--text-muted);">Est: ${formatRp(subtotalEstimasi)}</div>
                    <div style="font-weight:600; color:var(--primary); margin-top:4px;">Akt: ${formatRp(subtotalAktual)}</div>
                </td>
                <td style="font-size:0.85rem; max-width:150px;">${item.keterangan || '-'}</td>
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
    const kategori = document.getElementById('budgetKat').value;
    const item = document.getElementById('budgetDetail').value;
    const vendor = document.getElementById('budgetVendor').value;
    const harga = document.getElementById('budgetHarga').value || 0;
    const qty = document.getElementById('budgetQty').value || 1;
    const dp = document.getElementById('budgetDp').value || 0;
    const dpDate = document.getElementById('budgetDpDate').value;
    const lunas = document.getElementById('budgetLunas').value || 0;
    const lunasDate = document.getElementById('budgetLunasDate').value;
    const ket = document.getElementById('budgetKet').value;

    if (!item || !harga) return showToast('Detail Item dan Harga per Satuan wajib diisi');

    appState.budget.push({
        id: generateId(),
        kategori: kategori,
        item: item,
        vendor: vendor,
        harga: Number(harga),
        qty: Number(qty),
        dpAkhir: Number(dp),
        dpDate: dpDate,
        lunasAkhir: Number(lunas),
        lunasDate: lunasDate,
        keterangan: ket
    });

    document.getElementById('budgetKat').value = 'Venue';
    document.getElementById('budgetDetail').value = '';
    document.getElementById('budgetVendor').value = '';
    document.getElementById('budgetHarga').value = '';
    document.getElementById('budgetQty').value = '1';
    document.getElementById('budgetDp').value = '';
    document.getElementById('budgetDpDate').value = '';
    document.getElementById('budgetLunas').value = '';
    document.getElementById('budgetLunasDate').value = '';
    document.getElementById('budgetKet').value = '';

    saveState();
    renderAll();
    showToast('Budget ditambahkan');
}

// Deprecated function left for backwards HTML compatibility
function updateBiayaAktual(id, value) {
    console.warn("Legacy updateBiayaAktual called. Expected to be unused in V2 template.");
}
window.updateBiayaAktual = updateBiayaAktual;

// 5. Checklist Seserahan
function renderSeserahan() {
    const tbody = document.getElementById('tableSeserahan');
    tbody.innerHTML = '';
    let totalHarga = 0;

    // Apply filter if available
    const filterElement = document.getElementById('filterSeserahan');
    const filterValue = filterElement ? filterElement.value : 'Semua';

    // Sort by kategori so they cluster together conceptually
    let sorted = [...appState.seserahan].sort((a, b) => (a.kategori || '').localeCompare(b.kategori || ''));

    if (filterValue !== 'Semua') {
        sorted = sorted.filter(item => item.kategori === filterValue);
    }

    sorted.forEach(item => {
        totalHarga += Number(item.harga || 0);
        let badgeClass = 'primary';
        if (item.kategori === 'Dipakai Wanita') badgeClass = 'danger'; // pinkish
        if (item.kategori === 'Dipakai Bersama') badgeClass = 'success'; // greenish

        tbody.innerHTML += `
            <tr class="${item.checked ? 'completed' : ''}">
                <td>
                    <input type="checkbox" class="checkbox-custom" ${item.checked ? 'checked' : ''} onchange="toggleCheck('seserahan', ${item.id})">
                </td>
                <td><span class="badge ${badgeClass}">${item.kategori || 'Lainnya'}</span></td>
                <td style="${item.checked ? 'text-decoration: line-through; color: var(--text-muted);' : ''}"><strong>${item.item}</strong></td>
                <td>${item.brand || '-'}</td>
                <td>${formatRp(item.harga)}</td>
                <td>
                    ${item.link ? `<a href="${item.link}" target="_blank" style="color:var(--primary); font-size:1.2rem;" title="Beli di Toko"><i class="ri-shopping-cart-line"></i></a>` : '-'}
                </td>
                <td>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn-icon edit" onclick="editItem('seserahan', ${item.id})"><i class="ri-edit-line"></i></button>
                        <button class="btn-icon delete" onclick="deleteItem('seserahan', ${item.id})"><i class="ri-delete-bin-line"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });

    const totalEl = document.getElementById('totalSeserahan');
    if (totalEl) totalEl.textContent = formatRp(totalHarga);
}

function addSeserahan() {
    if (!isLoaded) return;
    const kategori = document.getElementById('seserahanKategori').value;
    const item = document.getElementById('seserahanItem').value;
    const brand = document.getElementById('seserahanBrand').value;
    const harga = document.getElementById('seserahanHarga').value || 0;
    const link = document.getElementById('seserahanLink').value;

    if (!item) return showToast('Nama item wajib diisi');

    appState.seserahan.push({
        id: generateId(),
        kategori: kategori,
        item: item,
        brand: brand,
        harga: harga,
        link: link,
        checked: false
    });

    document.getElementById('seserahanItem').value = '';
    document.getElementById('seserahanBrand').value = '';
    document.getElementById('seserahanHarga').value = '';
    document.getElementById('seserahanLink').value = '';

    saveState();
    showToast('Item Seserahan ditambahkan');
}

// 6. List Vendor
function renderModalPackageList() {
    const container = document.getElementById('modalPackageList');
    if (!container) return;
    if (currentVendorPackages.length === 0) {
        container.innerHTML = `<p style="text-align:center; font-size:0.85rem; color:var(--text-muted); padding:10px 0;">Belum ada paket. Tambahkan di bawah.</p>`;
        return;
    }
    container.innerHTML = currentVendorPackages.map((pkg, idx) => {
        // Inline edit mode for this package
        if (idx === currentEditPackageIdx) {
            return `
                <div style="background:var(--primary-light); border:1px solid var(--primary); border-radius:8px; padding:14px; margin-bottom:8px;">
                    <p style="font-size:0.78rem; font-weight:700; color:var(--primary-dark); margin-bottom:10px; text-transform:uppercase; letter-spacing:.5px;">Edit Paket</p>
                    <div style="margin-bottom:8px;">
                        <label style="font-size:0.82rem; font-weight:600; display:block; margin-bottom:4px; color:var(--text-main);">Nama Paket</label>
                        <input type="text" id="editPktNama_${idx}" value="${pkg.nama || ''}" style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid var(--border); font-family:inherit; background:var(--bg-card); color:var(--text-main);">
                    </div>
                    <div style="margin-bottom:8px;">
                        <label style="font-size:0.82rem; font-weight:600; display:block; margin-bottom:4px; color:var(--text-main);">Harga</label>
                        <input type="number" id="editPktHarga_${idx}" value="${Number(pkg.harga) || ''}" min="0" style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid var(--border); font-family:inherit; background:var(--bg-card); color:var(--text-main);">
                    </div>
                    <div style="margin-bottom:8px;">
                        <label style="font-size:0.82rem; font-weight:600; display:block; margin-bottom:4px; color:var(--text-main);">Fasilitas</label>
                        <textarea id="editPktFasilitas_${idx}" style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid var(--border); font-family:inherit; min-height:60px; resize:vertical; background:var(--bg-card); color:var(--text-main);">${pkg.fasilitas || ''}</textarea>
                    </div>
                    <div style="margin-bottom:12px;">
                        <label style="font-size:0.82rem; font-weight:600; display:block; margin-bottom:4px; color:var(--text-main);">S&amp;K</label>
                        <textarea id="editPktSk_${idx}" style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid var(--border); font-family:inherit; min-height:60px; resize:vertical; background:var(--bg-card); color:var(--text-main);">${pkg.sk || ''}</textarea>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button type="button" onclick="savePackageEdit(${idx})" class="btn-primary" style="flex:1; padding:8px;"><i class="ri-check-line"></i> Simpan</button>
                        <button type="button" onclick="cancelPackageEdit()" class="btn-secondary" style="padding:8px 14px;">Batal</button>
                    </div>
                </div>
            `;
        }
        // View mode
        return `
            <div style="background:var(--bg-main); border:1px solid var(--border); border-radius:8px; padding:12px 14px; margin-bottom:8px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:600; font-size:0.92rem; margin-bottom:4px;">
                            <i class="ri-price-tag-3-line" style="color:var(--primary);"></i>
                            ${pkg.nama || 'Paket'}
                            ${Number(pkg.harga) > 0 ? `<span style="font-size:0.85rem; color:var(--primary); margin-left:8px; font-weight:500;">${formatRp(pkg.harga)}</span>` : (pkg.harga ? `<span style="font-size:0.85rem; color:var(--primary); margin-left:8px; font-weight:500;">${pkg.harga}</span>` : '')}
                        </div>
                        ${pkg.fasilitas ? `<div style="font-size:0.8rem; color:var(--text-muted); margin-top:3px;"><i class="ri-star-line" style="color:var(--primary);"></i> <strong>Fasilitas:</strong> ${pkg.fasilitas.replace(/\n/g,'<br>')}</div>` : ''}
                        ${pkg.sk ? `<div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;"><i class="ri-file-text-line" style="color:var(--primary);"></i> <strong>S&amp;K:</strong> ${pkg.sk.replace(/\n/g,'<br>')}</div>` : ''}
                    </div>
                    <div style="display:flex; gap:4px; flex-shrink:0;">
                        <button type="button" class="btn-icon edit" onclick="editPackageInModal(${idx})" title="Edit paket"><i class="ri-edit-line"></i></button>
                        <button type="button" class="btn-icon delete" onclick="removePackageFromModal(${idx})" title="Hapus paket"><i class="ri-delete-bin-line"></i></button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function editPackageInModal(idx) {
    currentEditPackageIdx = idx;
    renderModalPackageList();
}

function cancelPackageEdit() {
    currentEditPackageIdx = -1;
    renderModalPackageList();
}

function savePackageEdit(idx) {
    const nama = (document.getElementById(`editPktNama_${idx}`)?.value || '').trim();
    const harga = (document.getElementById(`editPktHarga_${idx}`)?.value || '').trim();
    const fasilitas = (document.getElementById(`editPktFasilitas_${idx}`)?.value || '').trim();
    const sk = (document.getElementById(`editPktSk_${idx}`)?.value || '').trim();

    if (!nama) return showToast('Nama Paket tidak boleh kosong');

    currentVendorPackages[idx] = { ...currentVendorPackages[idx], nama, harga: Number(harga) || 0, fasilitas, sk };

    // Persist immediately
    syncPackagesToAppState();

    currentEditPackageIdx = -1;
    renderModalPackageList();
    showToast('Paket diperbarui');
}

function addPackageToModal() {
    const nama = document.getElementById('newPktNama').value.trim();
    const harga = document.getElementById('newPktHarga').value.trim();
    const fasilitas = document.getElementById('newPktFasilitas').value.trim();
    const sk = document.getElementById('newPktSk').value.trim();

    if (!nama) return showToast('Isi Nama Paket terlebih dahulu');

    currentVendorPackages.push({ id: generateId(), nama, harga: Number(harga) || 0, fasilitas, sk });

    // Clear mini-form
    document.getElementById('newPktNama').value = '';
    document.getElementById('newPktHarga').value = '';
    document.getElementById('newPktFasilitas').value = '';
    document.getElementById('newPktSk').value = '';

    // Persist immediately
    syncPackagesToAppState();

    renderModalPackageList();
    showToast('Paket ditambahkan');
}

function removePackageFromModal(idx) {
    currentVendorPackages.splice(idx, 1);
    if (currentEditPackageIdx === idx) currentEditPackageIdx = -1;
    else if (currentEditPackageIdx > idx) currentEditPackageIdx--;

    // Persist immediately so vendor card updates right away
    syncPackagesToAppState();

    renderModalPackageList();
    showToast('Paket dihapus');
}

// Sync currentVendorPackages back to the item in appState and save
function syncPackagesToAppState() {
    if (!currentEditStateKey || !currentEditId || !appState) return;
    const item = appState[currentEditStateKey].find(i => i.id == currentEditId);
    if (!item) return;
    item.packages = JSON.parse(JSON.stringify(currentVendorPackages));
    saveState();
    renderAll();
}

function renderVendor(stateKey, elementId) {
    const list = document.getElementById(elementId);
    list.innerHTML = '';

    appState[stateKey].forEach(item => {
        const packages = item.packages || [];
        // Legacy single-field fallback (for items not yet edited)
        const hasLegacy = !item.packages && (item.harga || item.fasilitas || item.sk);
        let packagesHtml = '';
        if (packages.length > 0) {
            packagesHtml = `
                <div style="margin-top:10px; display:flex; flex-direction:column; gap:6px;">
                    ${packages.map(pkg => `
                        <div style="background:var(--bg-main); border:1px solid var(--border); border-radius:6px; padding:8px 12px; font-size:0.83rem;">
                            <div style="font-weight:600; color:var(--text-main); margin-bottom:3px;">
                                <i class="ri-price-tag-3-line" style="color:var(--primary);"></i>
                                ${pkg.nama || 'Paket'}
                                ${Number(pkg.harga) > 0 ? `<span style="color:var(--primary); margin-left:6px;">${formatRp(pkg.harga)}</span>` : (pkg.harga ? `<span style="color:var(--primary); margin-left:6px;">${pkg.harga}</span>` : '')}
                            </div>
                            ${pkg.fasilitas ? `<div style="color:var(--text-muted); margin-top:2px;"><i class="ri-star-line" style="color:var(--primary);"></i> <strong>Fasilitas:</strong> ${pkg.fasilitas}</div>` : ''}
                            ${pkg.sk ? `<div style="color:var(--text-muted); margin-top:2px;"><i class="ri-file-text-line" style="color:var(--primary);"></i> <strong>S&amp;K:</strong> ${pkg.sk}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (hasLegacy) {
            packagesHtml = `
                <div style="margin-top:8px; display:flex; flex-direction:column; gap:4px; font-size:0.85rem; color:var(--text-muted);">
                    ${item.harga ? `<span><i class="ri-money-dollar-circle-line" style="color:var(--primary);"></i> <strong>Harga:</strong> ${item.harga}</span>` : ''}
                    ${item.fasilitas ? `<span><i class="ri-star-line" style="color:var(--primary);"></i> <strong>Fasilitas:</strong> ${item.fasilitas}</span>` : ''}
                    ${item.sk ? `<span><i class="ri-file-text-line" style="color:var(--primary);"></i> <strong>S&amp;K:</strong> ${item.sk}</span>` : ''}
                </div>
            `;
        }

        list.innerHTML += `
            <li class="item-row" style="padding: 12px; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                <div class="item-content" style="flex:1; min-width:0;">
                    <div class="stat-icon" style="width: 40px; height: 40px; font-size: 1.2rem; flex-shrink:0;">
                        <i class="ri-store-2-line"></i>
                    </div>
                    <div class="item-text" style="min-width:0;">
                        <span class="item-title" style="font-size: 1rem; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            ${item.nama}
                            ${item.ig ? `<a href="https://instagram.com/${item.ig.replace('@', '')}" target="_blank" style="color:#d62976; font-size:1.1rem;" title="Buka Instagram"><i class="ri-instagram-line"></i></a>` : ''}
                        </span>
                        <span class="badge primary" style="width: fit-content; margin-top: 4px;">${item.kategori}</span>
                        ${packagesHtml}
                    </div>
                </div>
                <div style="display: flex; gap: 4px; align-items: flex-start; flex-shrink:0;">
                    ${stateKey === 'vendorSeleksi' ?
                `<button class="btn-icon" style="color: var(--success);" onclick="pindahFinal(${item.id})" title="Pilih sebagai Final"><i class="ri-check-double-line"></i></button>`
                : ''}
                    <button class="btn-icon edit" onclick="editItem('${stateKey}', ${item.id})"><i class="ri-edit-line"></i></button>
                    <button class="btn-icon delete" onclick="deleteItem('${stateKey}', ${item.id})"><i class="ri-delete-bin-line"></i></button>
                </div>
            </li>
        `;
    });

    if (stateKey === 'vendorFinal') {
        populateJobdeskVendorSelect();
    }
}

function populateJobdeskVendorSelect() {
    const select = document.getElementById('jobdeskVendor');
    if (!select || !appState) return;

    // Store current selection to restore if it still exists
    const currentVal = select.value;

    let html = '<option value="">-- Pilih Vendor --</option>';
    if (appState.vendorFinal) {
        appState.vendorFinal.forEach(v => {
            html += `<option value="${v.nama}">${v.nama}</option>`;
        });
    }
    select.innerHTML = html;

    if (currentVal && appState.vendorFinal && appState.vendorFinal.some(v => v.nama === currentVal)) {
        select.value = currentVal;
    }
}

function addVendor(type) {
    if (!isLoaded) return;
    const stateKey = type === 'seleksi' ? 'vendorSeleksi' : 'vendorFinal';
    const katId = type === 'seleksi' ? 'inputVendorKategori' : 'inputVendorKategoriFinal';
    const namaId = type === 'seleksi' ? 'inputVendorNama' : 'inputVendorNamaFinal';
    const igId = type === 'seleksi' ? 'inputVendorIg' : 'inputVendorIgFinal';

    const kat = document.getElementById(katId).value;
    const nama = document.getElementById(namaId).value;
    const ig = document.getElementById(igId).value;

    if (!kat || !nama) return showToast('Lengkapi Kategori dan Nama Vendor');

    const newId = generateId();
    appState[stateKey].push({
        id: newId,
        kategori: kat,
        nama: nama,
        ig: ig,
        packages: []
    });

    document.getElementById(katId).value = '';
    document.getElementById(namaId).value = '';
    document.getElementById(igId).value = '';

    saveState();
    showToast('Vendor ditambahkan! Tambah paket harga via modal.');
    // Auto-open edit modal so user can add packages
    editItem(stateKey, newId);
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
        let tasksHtml = tasks.map(t => {
            // Replace newlines with <br> for multiline display
            const formattedTugas = (t.tugas || '').replace(/\n/g, '<br>');
            return `
            <li style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                <span style="flex:1; line-height: 1.5;"><i class="ri-arrow-right-s-line" style="color: var(--primary);"></i> ${formattedTugas}</span>
                <div style="display: flex; gap: 4px; align-items: center; margin-top:2px;">
                    <button class="btn-icon edit" style="width:24px;height:24px;font-size:0.9rem;" onclick="editItem('jobdesk', ${t.id})"><i class="ri-edit-line"></i></button>
                    <button class="btn-icon delete" style="width:24px;height:24px;font-size:0.9rem;" onclick="deleteItem('jobdesk', ${t.id})"><i class="ri-close-line"></i></button>
            </li>
        `;
        }).join('');

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
    let tCpw = 0;
    let tCpp = 0;

    appState.undangan.forEach(item => {
        const qty = Number(item.jumlah);
        tTotal += qty;
        
        // Count pihak
        const pihak = item.pihak || 'CPW'; // Default if null for old data
        if (pihak === 'CPW') tCpw += qty;
        if (pihak === 'CPP') tCpp += qty;

        if (item.konfirmasi === 'Hadir') tHadir += qty;
        if (item.konfirmasi === 'Tidak Hadir') tTidak += qty;

        const badgePihak = pihak === 'CPW' 
            ? `<span class="badge" style="background: rgba(233, 30, 99, 0.1); color: #e91e63;">CPW</span>` 
            : `<span class="badge" style="background: rgba(33, 150, 243, 0.1); color: #2196f3;">CPP</span>`;

        const badgeKonfir = item.konfirmasi === 'Hadir' ? `<span class="badge success"><i class="ri-check-line"></i> Hadir</span>` :
            (item.konfirmasi === 'Tidak Hadir' ? `<span class="badge danger"><i class="ri-close-line"></i> Tidak Hadir</span>` : `<span class="badge warning">Pending</span>`);

        tbody.innerHTML += `
            <tr>
                <td><strong>${item.nama}</strong></td>
                <td>${badgePihak}</td>
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
    const cwEl = document.getElementById('totalCpw');
    if(cwEl) cwEl.textContent = tCpw;
    const cpEl = document.getElementById('totalCpp');
    if(cpEl) cpEl.textContent = tCpp;
}

function addUndangan() {
    if (!isLoaded) return;
    const nama = document.getElementById('undanganNama').value;
    const pihak = document.getElementById('undanganPihak').value;
    const relasi = document.getElementById('undanganRelasi').value;
    const jml = document.getElementById('undanganJumlah').value;

    if (!nama) return showToast('Nama undangan wajib diisi');

    appState.undangan.push({
        id: generateId(),
        nama: nama,
        pihak: pihak,
        relasi: relasi || 'Umum',
        jumlah: jml,
        dikirim: false,
        konfirmasi: 'Pending'
    });

    document.getElementById('undanganNama').value = '';
    document.getElementById('undanganPihak').value = 'CPW';
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
