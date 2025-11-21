// Fungsi untuk navigasi ke halaman fitur
function navigateTo(feature) {
    console.log('Button diklik, feature:', feature); // Debug line

    switch(feature) {
        case 'time-management':
            console.log('Redirect ke waktu.html');
            window.location.href = 'waktu.html';
            break;
        case 'finance-management':
            console.log('Redirect ke keuangan.html');
            window.location.href = 'keuangan.html';
            break;
        case 'medication-reminder':
            console.log('Redirect ke obat.html');
            window.location.href = 'obat.html';
            break;
        default:
            alert('Fitur tidak ditemukan');
    }
    
    // Untuk implementasi nyata, gunakan:
    // window.location.href = `/${feature}.html`;
}

// Efek hover tambahan
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.feature-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.background = 'linear-gradient(135deg, #f5f7fa, #c3cfe2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.background = 'white';
        });
    });
});

// Tambahan: Local Storage untuk menyimpan preferensi pengguna
function saveUserPreference(feature) {
    const preferences = JSON.parse(localStorage.getItem('userPreferences')) || {};
    preferences.lastVisited = feature;
    preferences.lastVisit = new Date().toISOString();
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
}

// Modifikasi fungsi navigateTo untuk menyimpan preferensi
function navigateToWithPreference(feature) {
    saveUserPreference(feature);
    navigateTo(feature);
}

// Contoh penggunaan dengan preferensi (opsional)
function setupEnhancedNavigation() {
    const buttons = document.querySelectorAll('.feature-btn');
    buttons.forEach(button => {
        const card = button.closest('.feature-card');
        button.onclick = () => navigateToWithPreference(card.id);
    });
}

// Panggil fungsi setup saat halaman dimuat
document.addEventListener('DOMContentLoaded', setupEnhancedNavigation);