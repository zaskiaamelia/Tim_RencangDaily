// Inisialisasi data
let medicines = JSON.parse(localStorage.getItem('medicines')) || [];
let notificationPermission = Notification.permission;

// Element references
const medicineForm = document.getElementById('medicineForm');
const medicineBody = document.getElementById('medicineBody');
const emptyState = document.getElementById('emptyState');
const enableNotificationsBtn = document.getElementById('enableNotifications');
const permissionStatus = document.getElementById('permissionStatus');
const waktuSelect = document.getElementById('waktu');
const customTimeGroup = document.getElementById('customTimeGroup');
const obatHariIniElement = document.getElementById('obatHariIni');
const totalObatElement = document.getElementById('totalObat');
const statusNotifElement = document.getElementById('statusNotif');
const upcomingReminders = document.getElementById('upcomingReminders');
const confirmationModal = document.getElementById('confirmationModal');
const modalMessage = document.getElementById('modalMessage');
const confirmTakenBtn = document.getElementById('confirmTaken');
const snoozeReminderBtn = document.getElementById('snoozeReminder');

// Waktu default untuk setiap periode
const defaultTimes = {
    pagi: '06:00',
    siang: '12:00',
    sore: '15:00',
    malam: '20:00'
};

// Fungsi tombol home
function goHome() {
    window.location.href = 'coba.html';
}

// Fungsi navigasi dengan history
function navigateTo(feature) {
    switch(feature) {
        case 'time-management':
            window.location.href = 'waktu.html';
            break;
        case 'finance-management':
            window.location.href = 'keuangan.html';
            break;
        case 'medication-reminder':
            window.location.href = 'obat.html';
            break;
    }
}

// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', function() {
    updateDashboard();
    renderMedicines();
    updateUpcomingReminders();
    updatePermissionStatus();
    
    // Event listeners
    medicineForm.addEventListener('submit', handleFormSubmit);
    enableNotificationsBtn.addEventListener('click', requestNotificationPermission);
    waktuSelect.addEventListener('change', handleTimeChange);
    
    // Modal event listeners
    confirmTakenBtn.addEventListener('click', handleMedicineTaken);
    snoozeReminderBtn.addEventListener('click', handleSnoozeReminder);
    
    // Filter buttons
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterMedicines(this.dataset.filter);
        });
    });
    
    // Cek pengingat setiap menit
    setInterval(checkReminders, 60000);
    
    // Jalankan pengecekan segera setelah load
    checkReminders();
});

// Fungsi untuk menangani perubahan waktu
function handleTimeChange() {
    if (waktuSelect.value === 'custom') {
        customTimeGroup.style.display = 'block';
    } else {
        customTimeGroup.style.display = 'none';
    }
}

// Fungsi untuk menangani submit form
function handleFormSubmit(e) {
    e.preventDefault();
    
    const namaObat = document.getElementById('namaObat').value;
    const dosis = document.getElementById('dosis').value;
    const waktu = document.getElementById('waktu').value;
    const waktuKustom = document.getElementById('waktuKustom').value;
    const frekuensi = document.getElementById('frekuensi').value;
    const keterangan = document.getElementById('keterangan').value;
    
    // Tentukan waktu yang sebenarnya
    let actualTime;
    if (waktu === 'custom') {
        if (!waktuKustom) {
            alert('Harap pilih waktu kustom!');
            return;
        }
        actualTime = waktuKustom;
    } else {
        actualTime = defaultTimes[waktu];
    }
    
    // Buat objek obat
    const medicine = {
        id: Date.now(),
        namaObat,
        dosis,
        waktu: actualTime,
        frekuensi,
        keterangan,
        aktif: true,
        dibuat: new Date().toISOString(),
        terakhirDiingatkan: null
    };
    
    // Tambahkan ke array
    medicines.push(medicine);
    
    // Simpan ke localStorage
    localStorage.setItem('medicines', JSON.stringify(medicines));
    
    // Update tampilan
    updateDashboard();
    renderMedicines();
    updateUpcomingReminders();
    
    // Reset form
    medicineForm.reset();
    customTimeGroup.style.display = 'none';
    
    // Tampilkan notifikasi
    showNotification('Jadwal obat berhasil ditambahkan!', 'success');
    
    // Jadwalkan notifikasi
    scheduleNotification(medicine);
}

// Fungsi untuk merender daftar obat
function renderMedicines(filter = 'semua') {
    let filteredMedicines = medicines;
    
    if (filter === 'hari_ini') {
        filteredMedicines = medicines.filter(medicine => isMedicineToday(medicine));
    } else if (filter === 'aktif') {
        filteredMedicines = medicines.filter(medicine => medicine.aktif);
    }
    
    if (filteredMedicines.length === 0) {
        emptyState.style.display = 'block';
        document.getElementById('medicineTable').style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    document.getElementById('medicineTable').style.display = 'table';
    
    // Kosongkan body tabel
    medicineBody.innerHTML = '';
    
    // Tambahkan setiap obat ke tabel
    filteredMedicines.forEach(medicine => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${medicine.namaObat}</td>
            <td>${formatTime(medicine.waktu)}</td>
            <td>${medicine.dosis}</td>
            <td>
                <span class="status-badge ${medicine.aktif ? 'status-aktif' : 'status-nonaktif'}">
                    ${medicine.aktif ? 'Aktif' : 'Nonaktif'}
                </span>
            </td>
            <td class="actions">
                <button class="btn-action btn-toggle" onclick="toggleMedicine(${medicine.id})">
                    ${medicine.aktif ? '⏸️' : '▶️'}
                </button>
                <button class="btn-action btn-edit" onclick="editMedicine(${medicine.id})">✏️</button>
                <button class="btn-action btn-hapus" onclick="deleteMedicine(${medicine.id})">🗑️</button>
            </td>
        `;
        
        medicineBody.appendChild(row);
    });
}

// Fungsi untuk filter obat
function filterMedicines(filter) {
    renderMedicines(filter);
}

// Fungsi untuk memperbarui dashboard
function updateDashboard() {
    const today = new Date().toLocaleDateString('id-ID');
    const obatHariIni = medicines.filter(medicine => 
        medicine.aktif && isMedicineToday(medicine)
    ).length;
    
    const totalObat = medicines.length;
    const statusNotif = notificationPermission === 'granted' ? 'Aktif' : 'Mati';
    
    obatHariIniElement.textContent = obatHariIni;
    totalObatElement.textContent = totalObat;
    statusNotifElement.textContent = statusNotif;
    statusNotifElement.style.color = statusNotif === 'Aktif' ? '#28a745' : '#dc3545';
}

// Fungsi untuk memperbarui daftar pengingat mendatang
function updateUpcomingReminders() {
    const now = new Date();
    const today = now.toLocaleDateString('id-ID');
    
    // Ambil obat aktif untuk hari ini
    const todayMedicines = medicines.filter(medicine => 
        medicine.aktif && isMedicineToday(medicine)
    ).sort((a, b) => a.waktu.localeCompare(b.waktu));
    
    if (todayMedicines.length === 0) {
        upcomingReminders.innerHTML = '<p>Tidak ada pengingat untuk hari ini.</p>';
        return;
    }
    
    let html = '';
    todayMedicines.forEach(medicine => {
        const [hours, minutes] = medicine.waktu.split(':');
        const reminderTime = new Date();
        reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const isPast = reminderTime < now;
        const timeClass = isPast ? 'past' : 'upcoming';
        
        html += `
            <div class="reminder-item ${timeClass}">
                <div class="reminder-time">${formatTime(medicine.waktu)}</div>
                <div class="reminder-details">
                    <div class="reminder-name">${medicine.namaObat}</div>
                    <div class="reminder-dosis">${medicine.dosis}</div>
                </div>
            </div>
        `;
    });
    
    upcomingReminders.innerHTML = html;
}

// Fungsi untuk meminta izin notifikasi
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            notificationPermission = permission;
            updatePermissionStatus();
            updateDashboard();
            
            if (permission === 'granted') {
                showNotification('Notifikasi diaktifkan! Anda akan mendapat pengingat obat.', 'success');
                // Jadwalkan ulang semua notifikasi
                medicines.forEach(medicine => {
                    if (medicine.aktif) {
                        scheduleNotification(medicine);
                    }
                });
            }
        });
    } else {
        alert('Browser Anda tidak mendukung notifikasi.');
    }
}

// Fungsi untuk memperbarui status izin
function updatePermissionStatus() {
    if (notificationPermission === 'granted') {
        permissionStatus.textContent = '✅ Notifikasi diizinkan';
        permissionStatus.className = 'permission-status granted';
        enableNotificationsBtn.style.display = 'none';
    } else if (notificationPermission === 'denied') {
        permissionStatus.textContent = '❌ Notifikasi ditolak. Izinkan melalui pengaturan browser.';
        permissionStatus.className = 'permission-status denied';
        enableNotificationsBtn.style.display = 'block';
    } else {
        permissionStatus.textContent = '⏳ Menunggu izin notifikasi...';
        permissionStatus.className = 'permission-status';
        enableNotificationsBtn.style.display = 'block';
    }
}

// Fungsi untuk menjadwalkan notifikasi
function scheduleNotification(medicine) {
    if (notificationPermission !== 'granted' || !medicine.aktif) return;
    
    const [hours, minutes] = medicine.waktu.split(':');
    const now = new Date();
    const notificationTime = new Date();
    notificationTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Jika waktu sudah lewat hari ini, jadwalkan untuk besok
    if (notificationTime < now) {
        notificationTime.setDate(notificationTime.getDate() + 1);
    }
    
    const timeUntilNotification = notificationTime.getTime() - now.getTime();
    
    if (timeUntilNotification > 0) {
        setTimeout(() => {
            if (medicine.aktif && isMedicineToday(medicine)) {
                showBrowserNotification(medicine);
            }
        }, timeUntilNotification);
    }
}

// Fungsi untuk menampilkan notifikasi browser
function showBrowserNotification(medicine) {
    if (notificationPermission !== 'granted') return;
    
    const notification = new Notification('⏰ Waktu Minum Obat', {
        body: `Saatnya minum ${medicine.namaObat} - ${medicine.dosis}`,
        icon: '/icon.png', // Ganti dengan path icon Anda
        tag: `medicine-${medicine.id}`,
        requireInteraction: true
    });
    
    notification.onclick = function() {
        window.focus();
        showConfirmationModal(medicine);
        notification.close();
    };
    
    // Simpan waktu terakhir diingatkan
    medicine.terakhirDiingatkan = new Date().toISOString();
    localStorage.setItem('medicines', JSON.stringify(medicines));
    
    // Tampilkan modal konfirmasi setelah 2 detik
    setTimeout(() => {
        showConfirmationModal(medicine);
    }, 2000);
}

// Fungsi untuk menampilkan modal konfirmasi
function showConfirmationModal(medicine) {
    modalMessage.textContent = `Apakah Anda sudah minum ${medicine.namaObat} (${medicine.dosis})?`;
    confirmationModal.style.display = 'flex';
    
    // Simpan ID obat yang sedang diingatkan
    confirmationModal.dataset.currentMedicineId = medicine.id;
}

// Fungsi untuk menangani konfirmasi minum obat
function handleMedicineTaken() {
    const medicineId = parseInt(confirmationModal.dataset.currentMedicineId);
    const medicine = medicines.find(m => m.id === medicineId);
    
    if (medicine) {
        medicine.terakhirDikonsumsi = new Date().toISOString();
        localStorage.setItem('medicines', JSON.stringify(medicines));
        showNotification(`✅ ${medicine.namaObat} telah dikonfirmasi diminum`, 'success');
    }
    
    confirmationModal.style.display = 'none';
    updateUpcomingReminders();
}

// Fungsi untuk menunda pengingat
function handleSnoozeReminder() {
    const medicineId = parseInt(confirmationModal.dataset.currentMedicineId);
    const medicine = medicines.find(m => m.id === medicineId);
    
    if (medicine) {
        // Jadwalkan ulang notifikasi dalam 10 menit
        setTimeout(() => {
            showBrowserNotification(medicine);
        }, 10 * 60 * 1000); // 10 menit
        
        showNotification(`⏰ Pengingat ${medicine.namaObat} ditunda 10 menit`, 'info');
    }
    
    confirmationModal.style.display = 'none';
}

// Fungsi untuk memeriksa pengingat
function checkReminders() {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
    
    medicines.forEach(medicine => {
        if (medicine.aktif && isMedicineToday(medicine) && medicine.waktu === currentTime) {
            if (!medicine.terakhirDiingatkan || 
                new Date(medicine.terakhirDiingatkan).toLocaleDateString() !== now.toLocaleDateString()) {
                showBrowserNotification(medicine);
            }
        }
    });
    
    updateUpcomingReminders();
}

// Fungsi utilitas
function isMedicineToday(medicine) {
    // Untuk sederhana, anggap semua obat aktif setiap hari
    // Anda bisa mengembangkan ini berdasarkan frekuensi
    return true;
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
}

function showNotification(message, type) {
    // Buat elemen notifikasi custom
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    if (type === 'success') {
        notification.style.background = '#28a745';
    } else if (type === 'error') {
        notification.style.background = '#dc3545';
    } else {
        notification.style.background = '#17a2b8';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Tambahkan style animasi
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .custom-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    }
    
    .reminder-item.past {
        opacity: 0.6;
        background: #f8f9fa;
    }
    
    .reminder-item.upcoming {
        background: #e7f3ff;
        border-color: #667eea;
    }
`;
document.head.appendChild(style);

// Fungsi untuk menghapus obat
function deleteMedicine(id) {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal obat ini?')) {
        medicines = medicines.filter(medicine => medicine.id !== id);
        localStorage.setItem('medicines', JSON.stringify(medicines));
        updateDashboard();
        renderMedicines();
        updateUpcomingReminders();
        showNotification('Jadwal obat berhasil dihapus!', 'success');
    }
}

// Fungsi untuk mengaktifkan/nonaktifkan obat
function toggleMedicine(id) {
    const medicine = medicines.find(m => m.id === id);
    if (medicine) {
        medicine.aktif = !medicine.aktif;
        localStorage.setItem('medicines', JSON.stringify(medicines));
        updateDashboard();
        renderMedicines();
        updateUpcomingReminders();
        
        if (medicine.aktif) {
            showNotification(`${medicine.namaObat} diaktifkan`, 'success');
            scheduleNotification(medicine);
        } else {
            showNotification(`${medicine.namaObat} dinonaktifkan`, 'info');
        }
    }
}

// Fungsi untuk mengedit obat
function editMedicine(id) {
    const medicine = medicines.find(m => m.id === id);
    if (!medicine) return;
    
    // Isi form dengan data obat
    document.getElementById('namaObat').value = medicine.namaObat;
    document.getElementById('dosis').value = medicine.dosis;
    document.getElementById('keterangan').value = medicine.keterangan || '';
    
    // Tentukan jenis waktu
    let waktuValue = 'custom';
    for (const [key, value] of Object.entries(defaultTimes)) {
        if (value === medicine.waktu) {
            waktuValue = key;
            break;
        }
    }
    
    document.getElementById('waktu').value = waktuValue;
    document.getElementById('frekuensi').value = medicine.frekuensi;
    
    if (waktuValue === 'custom') {
        customTimeGroup.style.display = 'block';
        document.getElementById('waktuKustom').value = medicine.waktu;
    } else {
        customTimeGroup.style.display = 'none';
    }
    
    // Hapus obat lama
    medicines = medicines.filter(m => m.id !== id);
    
    showNotification('Silakan edit data obat dan submit kembali', 'info');
}

// Ekspor fungsi untuk akses global
window.deleteMedicine = deleteMedicine;
window.toggleMedicine = toggleMedicine;
window.editMedicine = editMedicine;