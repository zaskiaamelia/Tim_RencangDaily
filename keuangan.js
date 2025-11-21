// Fungsi tombol home
function goHome() {
    console.log('Tombol home ditekan'); // Debug line
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

// Inisialisasi data
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let saldoAwal = 5000000; // Saldo awal Rp 5.000.000

// Elemen DOM
const expenseForm = document.getElementById('expense-form');
const expenseNameInput = document.getElementById('expense-name');
const expenseAmountInput = document.getElementById('expense-amount');
const expenseCategoryInput = document.getElementById('expense-category');
const expenseDateInput = document.getElementById('expense-date');
const expenseNotesInput = document.getElementById('expense-notes');
const expensesContainer = document.getElementById('expenses-container');
const noExpensesMessage = document.getElementById('no-expenses');
const saldoElement = document.getElementById('saldo');
const totalPengeluaranElement = document.getElementById('total-pengeluaran');
const pengeluaranBulanIniElement = document.getElementById('pengeluaran-bulan-ini');
const filterCategoryInput = document.getElementById('filter-category');
const filterMonthInput = document.getElementById('filter-month');
const resetFilterButton = document.getElementById('reset-filter');
const deleteAllButton = document.getElementById('delete-all');

// Set tanggal default ke hari ini
expenseDateInput.valueAsDate = new Date();

// Format angka ke format Rupiah
function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
}

// Format tanggal ke format Indonesia
function formatTanggal(tanggal) {
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return new Date(tanggal).toLocaleDateString('id-ID', options);
}

// Hitung total pengeluaran
function hitungTotalPengeluaran() {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

// Hitung pengeluaran bulan ini
function hitungPengeluaranBulanIni() {
  const sekarang = new Date();
  const bulanIni = sekarang.getMonth();
  const tahunIni = sekarang.getFullYear();

  return expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === bulanIni && expenseDate.getFullYear() === tahunIni;
    })
    .reduce((total, expense) => total + expense.amount, 0);
}

// Update ringkasan
function updateRingkasan() {
  const totalPengeluaran = hitungTotalPengeluaran();
  const pengeluaranBulanIni = hitungPengeluaranBulanIni();
  const saldo = saldoAwal - totalPengeluaran;

  saldoElement.textContent = formatRupiah(saldo);
  totalPengeluaranElement.textContent = formatRupiah(totalPengeluaran);
  pengeluaranBulanIniElement.textContent = formatRupiah(pengeluaranBulanIni);

  // Ubah warna saldo jika negatif
  if (saldo < 0) {
    saldoElement.style.color = '#e74c3c';
  } else {
    saldoElement.style.color = '#2ecc71';
  }
}

// Tampilkan daftar pengeluaran
function tampilkanPengeluaran(pengeluaranUntukDitampilkan = expenses) {
  expensesContainer.innerHTML = '';

  if (pengeluaranUntukDitampilkan.length === 0) {
    noExpensesMessage.style.display = 'block';
    expensesContainer.appendChild(noExpensesMessage);
    return;
  }

  noExpensesMessage.style.display = 'none';

  // Urutkan berdasarkan tanggal (terbaru di atas)
  pengeluaranUntukDitampilkan.sort((a, b) => new Date(b.date) - new Date(a.date));

  pengeluaranUntukDitampilkan.forEach((expense, index) => {
    const expenseItem = document.createElement('div');
    expenseItem.className = 'expense-item';

    expenseItem.innerHTML = `
            <div class="expense-details">
                <div class="expense-title">
                    ${expense.name}
                    <span class="expense-category">${expense.category}</span>
                </div>
                <div class="expense-meta">
                    <span class="expense-date">${formatTanggal(expense.date)}</span>
                    ${expense.notes ? <span class="expense-notes">- ${expense.notes}</span> : ''}
                </div>
            </div>
            <div class="expense-actions">
                <span class="expense-amount">${formatRupiah(expense.amount)}</span>
                <button class="delete-btn" data-id="${expense.id}">Hapus</button>
            </div>
        `;

    expensesContainer.appendChild(expenseItem);
  });

  // Tambahkan event listener untuk tombol hapus
  document.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', function () {
      const id = this.getAttribute('data-id');
      hapusPengeluaran(id);
    });
  });
}

// Tambah pengeluaran baru
function tambahPengeluaran(event) {
  event.preventDefault();

  const expense = {
    id: Date.now().toString(),
    name: expenseNameInput.value.trim(),
    amount: parseInt(expenseAmountInput.value),
    category: expenseCategoryInput.value,
    date: expenseDateInput.value,
    notes: expenseNotesInput.value.trim(),
  };

  expenses.push(expense);
  localStorage.setItem('expenses', JSON.stringify(expenses));

  updateRingkasan();
  tampilkanPengeluaran();

  // Reset form
  expenseForm.reset();
  expenseDateInput.valueAsDate = new Date();

  // Tampilkan pesan sukses
  alert('Pengeluaran berhasil ditambahkan!');
}

// Hapus pengeluaran
function hapusPengeluaran(id) {
  if (confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) {
    expenses = expenses.filter((expense) => expense.id !== id);
    localStorage.setItem('expenses', JSON.stringify(expenses));

    updateRingkasan();
    tampilkanPengeluaran();
  }
}

// Hapus semua pengeluaran
function hapusSemuaPengeluaran() {
  if (expenses.length === 0) {
    alert('Tidak ada pengeluaran untuk dihapus.');
    return;
  }

  if (confirm('Apakah Anda yakin ingin menghapus SEMUA pengeluaran? Tindakan ini tidak dapat dibatalkan.')) {
    expenses = [];
    localStorage.setItem('expenses', JSON.stringify(expenses));

    updateRingkasan();
    tampilkanPengeluaran();
  }
}

// Filter pengeluaran
function filterPengeluaran() {
  const categoryFilter = filterCategoryInput.value;
  const monthFilter = filterMonthInput.value;

  let filteredExpenses = expenses;

  // Filter berdasarkan kategori
  if (categoryFilter) {
    filteredExpenses = filteredExpenses.filter((expense) => expense.category === categoryFilter);
  }

  // Filter berdasarkan bulan
  if (monthFilter !== '') {
    const month = parseInt(monthFilter);
    filteredExpenses = filteredExpenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === month;
    });
  }

  tampilkanPengeluaran(filteredExpenses);
}

// Reset filter
function resetFilter() {
  filterCategoryInput.value = '';
  filterMonthInput.value = '';
  tampilkanPengeluaran();
}

// Event Listeners
expenseForm.addEventListener('submit', tambahPengeluaran);
filterCategoryInput.addEventListener('change', filterPengeluaran);
filterMonthInput.addEventListener('change', filterPengeluaran);
resetFilterButton.addEventListener('click', resetFilter);
deleteAllButton.addEventListener('click', hapusSemuaPengeluaran);

// Inisialisasi aplikasi
updateRingkasan();
tampilkanPengeluaran();