// Inisialisasi data
let schedules = JSON.parse(localStorage.getItem('schedules')) || [];
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let notificationPermission = Notification.permission;

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
    console.log('Aplikasi TimeMaster dimuat');
    
    initializeApp();
    setupEventListeners();
    updateDashboard();
    renderAllViews();
    checkReminders();
    
    // Cek pengingat setiap menit
    setInterval(checkReminders, 60000);
});

function initializeApp() {
    // Set tanggal default untuk form
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    document.getElementById('scheduleDate').valueAsDate = today;
    document.getElementById('taskDueDate').value = formatDateTimeLocal(tomorrow);
    
    updatePermissionStatus();
}

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
    
    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchView(this.dataset.view);
        });
    });
    
    // Modal buttons
    document.getElementById('addScheduleBtn').addEventListener('click', function() {
        showModal('scheduleModal');
    });
    
    document.getElementById('addHabitBtn').addEventListener('click', function() {
        showModal('habitModal');
    });
    
    document.getElementById('addTaskBtn').addEventListener('click', function() {
        showModal('taskModal');
    });
    
    // Form submissions
    document.getElementById('scheduleForm').addEventListener('submit', handleScheduleSubmit);
    document.getElementById('habitForm').addEventListener('submit', handleHabitSubmit);
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    
    // Modal cancel buttons
    document.getElementById('cancelSchedule').addEventListener('click', function() {
        hideModal('scheduleModal');
    });
    
    document.getElementById('cancelHabit').addEventListener('click', function() {
        hideModal('habitModal');
    });
    
    document.getElementById('cancelTask').addEventListener('click', function() {
        hideModal('taskModal');
    });
    
    // Confirmation modal
    document.getElementById('confirmYes').addEventListener('click', executePendingAction);
    document.getElementById('confirmNo').addEventListener('click', function() {
        hideModal('confirmationModal');
    });
    
    // Notification permission
    document.getElementById('enableNotifications').addEventListener('click', requestNotificationPermission);
    
    // Task filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterTasks(this.dataset.filter);
        });
    });
    
    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideModal(this.id);
            }
        });
    });
}

// Tab Management
function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
    
    // Refresh view
    if (tabName === 'schedule') {
        renderScheduleViews();
    } else if (tabName === 'habits') {
        renderHabits();
    } else if (tabName === 'tasks') {
        renderTasks();
    } else if (tabName === 'analytics') {
        renderAnalytics();
    }
}

// View Management
function switchView(viewName) {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    
    document.getElementById('dailyView').classList.toggle('active', viewName === 'daily');
    document.getElementById('weeklyView').classList.toggle('active', viewName === 'weekly');
    
    renderScheduleViews();
}

// Modal Management
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Confirmation System
let pendingAction = null;

function showConfirmation(title, message, action) {
    document.getElementById('confirmationTitle').textContent = title;
    document.getElementById('confirmationMessage').textContent = message;
    pendingAction = action;
    showModal('confirmationModal');
}

function executePendingAction() {
    if (pendingAction && typeof pendingAction === 'function') {
        pendingAction();
    }
    pendingAction = null;
    hideModal('confirmationModal');
}

// Form Handlers
function handleScheduleSubmit(e) {
    e.preventDefault();
    console.log('Menambah jadwal...');
    
    const schedule = {
        id: Date.now(),
        title: document.getElementById('scheduleTitle').value,
        date: document.getElementById('scheduleDate').value,
        time: document.getElementById('scheduleTime').value,
        duration: parseInt(document.getElementById('scheduleDuration').value),
        repeat: document.getElementById('scheduleRepeat').value,
        reminder: parseInt(document.getElementById('scheduleReminder').value),
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    schedules.push(schedule);
    localStorage.setItem('schedules', JSON.stringify(schedules));
    
    hideModal('scheduleModal');
    e.target.reset();
    document.getElementById('scheduleDate').valueAsDate = new Date();
    
    showNotification('Jadwal berhasil ditambahkan!', 'success');
    renderScheduleViews();
    updateDashboard();
    
    scheduleNotification(schedule);
}

function handleHabitSubmit(e) {
    e.preventDefault();
    console.log('Menambah kebiasaan...');
    
    const habit = {
        id: Date.now(),
        name: document.getElementById('habitName').value,
        frequency: document.getElementById('habitFrequency').value,
        goal: parseInt(document.getElementById('habitGoal').value),
        reminder: document.getElementById('habitReminder').value,
        currentStreak: 0,
        longestStreak: 0,
        completedToday: false,
        history: [],
        createdAt: new Date().toISOString()
    };
    
    habits.push(habit);
    localStorage.setItem('habits', JSON.stringify(habits));
    
    hideModal('habitModal');
    e.target.reset();
    
    showNotification('Kebiasaan berhasil ditambahkan!', 'success');
    renderHabits();
    updateDashboard();
    
    if (habit.reminder) {
        scheduleHabitReminder(habit);
    }
}

function handleTaskSubmit(e) {
    e.preventDefault();
    console.log('Menambah tugas...');
    
    const task = {
        id: Date.now(),
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        priority: document.getElementById('taskPriority').value,
        dueDate: document.getElementById('taskDueDate').value,
        reminder: parseInt(document.getElementById('taskReminder').value),
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    hideModal('taskModal');
    e.target.reset();
    document.getElementById('taskDueDate').value = getDefaultDueDate();
    
    showNotification('Tugas berhasil ditambahkan!', 'success');
    renderTasks();
    updateDashboard();
    
    scheduleTaskReminder(task);
}

// Rendering Functions
function renderAllViews() {
    renderScheduleViews();
    renderHabits();
    renderTasks();
    renderAnalytics();
}

function renderScheduleViews() {
    renderDailyView();
    renderWeeklyView();
}

function renderDailyView() {
    const timeSlots = document.querySelector('.time-slots');
    if (!timeSlots) return;
    
    const today = new Date().toISOString().split('T')[0];
    const todaySchedules = schedules.filter(schedule => schedule.date === today);
    
    let html = '';
    
    // Buat time slots dari 06:00 sampai 22:00
    for (let hour = 6; hour <= 22; hour++) {
        const timeStart = `${hour.toString().padStart(2, '0')}:00`;
        const timeEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
        
        const slotSchedules = todaySchedules.filter(schedule => {
            const scheduleHour = parseInt(schedule.time.split(':')[0]);
            return scheduleHour === hour;
        });
        
        html += `
            <div class="time-slot">
                <div class="time-slot-header">
                    <span class="time-range">${timeStart} - ${timeEnd}</span>
                    <span class="schedule-count">${slotSchedules.length} kegiatan</span>
                </div>
                <div class="schedule-items">
                    ${slotSchedules.map(schedule => `
                        <div class="schedule-item">
                            <div class="schedule-item-info">
                                <h4>${schedule.title}</h4>
                                <p>Durasi: ${schedule.duration} menit</p>
                            </div>
                            <div class="schedule-item-actions">
                                <button class="btn-action btn-success" onclick="completeSchedule(${schedule.id})">✓</button>
                                <button class="btn-action btn-warning" onclick="editSchedule(${schedule.id})">✏️</button>
                                <button class="btn-action btn-danger" onclick="deleteSchedule(${schedule.id})">🗑️</button>
                            </div>
                        </div>
                    `).join('')}
                    ${slotSchedules.length === 0 ? '<p class="no-schedule">Tidak ada jadwal</p>' : ''}
                </div>
            </div>
        `;
    }
    
    timeSlots.innerHTML = html;
}

function renderWeeklyView() {
    const weekCalendar = document.querySelector('.week-calendar');
    if (!weekCalendar) return;
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    let html = '';
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dateString = day.toISOString().split('T')[0];
        
        const daySchedules = schedules.filter(schedule => schedule.date === dateString);
        const dayName = day.toLocaleDateString('id-ID', { weekday: 'long' });
        const dateFormatted = day.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        html += `
            <div class="day-column">
                <div class="day-header">
                    ${dayName}<br>${dateFormatted}
                </div>
                <div class="day-schedules">
                    ${daySchedules.map(schedule => `
                        <div class="schedule-item">
                            <div class="schedule-item-info">
                                <h4>${schedule.title}</h4>
                                <p>${schedule.time} • ${schedule.duration} menit</p>
                            </div>
                        </div>
                    `).join('')}
                    ${daySchedules.length === 0 ? '<p class="no-schedule">Tidak ada jadwal</p>' : ''}
                </div>
            </div>
        `;
    }
    
    weekCalendar.innerHTML = html;
}

function renderHabits() {
    const habitsGrid = document.getElementById('habitsGrid');
    if (!habitsGrid) return;
    
    if (habits.length === 0) {
        habitsGrid.innerHTML = '<p class="empty-state">Belum ada kebiasaan. Tambahkan kebiasaan pertama Anda!</p>';
        return;
    }
    
    const html = habits.map(habit => {
        const completionRate = habit.history.length > 0 ? 
            Math.round((habit.history.filter(h => h.completed).length / habit.history.length) * 100) : 0;
        
        return `
            <div class="habit-card">
                <div class="habit-header">
                    <div class="habit-name">${habit.name}</div>
                    <button class="btn-action ${habit.completedToday ? 'btn-success' : 'btn-secondary'}" 
                            onclick="toggleHabit(${habit.id})">
                        ${habit.completedToday ? '✓' : '○'}
                    </button>
                </div>
                <div class="habit-stats">
                    <div class="habit-stat">
                        <div class="habit-stat-value">${habit.currentStreak}</div>
                        <div class="habit-stat-label">Streak</div>
                    </div>
                    <div class="habit-stat">
                        <div class="habit-stat-value">${completionRate}%</div>
                        <div class="habit-stat-label">Success</div>
                    </div>
                    <div class="habit-stat">
                        <div class="habit-stat-value">${habit.longestStreak}</div>
                        <div class="habit-stat-label">Terlama</div>
                    </div>
                </div>
                <div class="habit-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${completionRate}%"></div>
                    </div>
                </div>
                <div class="habit-actions">
                    <button class="btn btn-warning btn-sm" onclick="editHabit(${habit.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteHabit(${habit.id})">Hapus</button>
                </div>
            </div>
        `;
    }).join('');
    
    habitsGrid.innerHTML = html;
}

function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    if (!tasksList) return;
    
    const filter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    let filteredTasks = tasks;
    
    switch (filter) {
        case 'pending':
            filteredTasks = tasks.filter(task => !task.completed);
            break;
        case 'completed':
            filteredTasks = tasks.filter(task => task.completed);
            break;
        case 'overdue':
            filteredTasks = tasks.filter(task => !task.completed && new Date(task.dueDate) < new Date());
            break;
    }
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<p class="empty-state">Tidak ada tugas yang sesuai dengan filter.</p>';
        return;
    }
    
    const html = filteredTasks.map(task => {
        const dueDate = new Date(task.dueDate);
        const isOverdue = !task.completed && dueDate < new Date();
        const priorityClass = `priority-${task.priority}`;
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
                <div class="task-header">
                    <h3 class="task-title">${task.title}</h3>
                    <span class="task-priority ${priorityClass}">${getPriorityText(task.priority)}</span>
                </div>
                <div class="task-due">
                    ⏰ ${dueDate.toLocaleString('id-ID')}
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                <div class="task-actions">
                    <button class="btn ${task.completed ? 'btn-secondary' : 'btn-success'}" 
                            onclick="toggleTask(${task.id})">
                        ${task.completed ? '❌ Batalkan' : '✅ Selesai'}
                    </button>
                    <button class="btn btn-warning" onclick="editTask(${task.id})">✏️ Edit</button>
                    <button class="btn btn-danger" onclick="deleteTask(${task.id})">🗑️ Hapus</button>
                    ${!task.completed ? `
                        <button class="btn btn-secondary" onclick="snoozeTask(${task.id})">⏸️ Tunda</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    tasksList.innerHTML = html;
}

function renderAnalytics() {
    // Implementasi sederhana untuk analitik
    updateDashboard();
    
    // Update top habits
    const topHabits = document.getElementById('topHabits');
    if (topHabits) {
        const sortedHabits = [...habits].sort((a, b) => b.currentStreak - a.currentStreak).slice(0, 3);
        topHabits.innerHTML = sortedHabits.map(habit => `
            <div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 8px;">
                <strong>${habit.name}</strong><br>
                Streak: ${habit.currentStreak} hari
            </div>
        `).join('') || '<p>Belum ada data kebiasaan</p>';
    }
    
    // Update best time
    const bestTime = document.getElementById('bestTime');
    if (bestTime) {
        bestTime.innerHTML = '<p>Analisis waktu terbaik akan ditampilkan di sini</p>';
    }
}

// Action Functions
function completeSchedule(id) {
    const schedule = schedules.find(s => s.id === id);
    if (schedule) {
        schedule.completed = true;
        localStorage.setItem('schedules', JSON.stringify(schedules));
        renderScheduleViews();
        updateDashboard();
        showNotification('Jadwal diselesaikan!', 'success');
    }
}

function deleteSchedule(id) {
    showConfirmation(
        'Hapus Jadwal',
        'Apakah Anda yakin ingin menghapus jadwal ini?',
        () => {
            schedules = schedules.filter(s => s.id !== id);
            localStorage.setItem('schedules', JSON.stringify(schedules));
            renderScheduleViews();
            updateDashboard();
            showNotification('Jadwal dihapus!', 'success');
        }
    );
}

function toggleHabit(id) {
    const habit = habits.find(h => h.id === id);
    if (habit) {
        const today = new Date().toISOString().split('T')[0];
        const todayHistory = habit.history.find(h => h.date === today);
        
        if (todayHistory) {
            todayHistory.completed = !todayHistory.completed;
        } else {
            habit.history.push({ date: today, completed: true });
        }
        
        habit.completedToday = !habit.completedToday;
        
        // Update streak
        if (habit.completedToday) {
            habit.currentStreak++;
            if (habit.currentStreak > habit.longestStreak) {
                habit.longestStreak = habit.currentStreak;
            }
        } else {
            habit.currentStreak = 0;
        }
        
        localStorage.setItem('habits', JSON.stringify(habits));
        renderHabits();
        updateDashboard();
        showNotification(`Kebiasaan ${habit.completedToday ? 'diselesaikan' : 'dibatalkan'}!`, 'success');
    }
}

function deleteHabit(id) {
    showConfirmation(
        'Hapus Kebiasaan',
        'Apakah Anda yakin ingin menghapus kebiasaan ini?',
        () => {
            habits = habits.filter(h => h.id !== id);
            localStorage.setItem('habits', JSON.stringify(habits));
            renderHabits();
            updateDashboard();
            showNotification('Kebiasaan dihapus!', 'success');
        }
    );
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        updateDashboard();
        showNotification(`Tugas ${task.completed ? 'diselesaikan' : 'dibatalkan'}!`, 'success');
    }
}

function deleteTask(id) {
    showConfirmation(
        'Hapus Tugas',
        'Apakah Anda yakin ingin menghapus tugas ini?',
        () => {
            tasks = tasks.filter(t => t.id !== id);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks();
            updateDashboard();
            showNotification('Tugas dihapus!', 'success');
        }
    );
}

function snoozeTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        const newDueDate = new Date(task.dueDate);
        newDueDate.setHours(newDueDate.getHours() + 24); // Tunda 24 jam
        task.dueDate = newDueDate.toISOString().slice(0, 16);
        
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        showNotification('Tugas ditunda 24 jam!', 'info');
    }
}

function filterTasks(filter) {
    renderTasks();
}

// Dashboard Update
function updateDashboard() {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's tasks
    const todayTasks = tasks.filter(task => {
        const taskDate = task.dueDate.split('T')[0];
        return taskDate === today && !task.completed;
    }).length;
    
    // Completed tasks
    const completedTasks = tasks.filter(task => task.completed).length;
    
    // Productivity score (sederhana)
    const totalTasks = tasks.length;
    const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    document.getElementById('todayTasks').textContent = todayTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('productivityScore').textContent = `${productivityScore}%`;
}

// Notification System
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            notificationPermission = permission;
            updatePermissionStatus();
            
            if (permission === 'granted') {
                showNotification('Notifikasi diaktifkan! Anda akan mendapat pengingat.', 'success');
                scheduleAllNotifications();
            }
        });
    } else {
        alert('Browser Anda tidak mendukung notifikasi.');
    }
}

function updatePermissionStatus() {
    const statusElement = document.getElementById('permissionStatus');
    const enableBtn = document.getElementById('enableNotifications');
    
    if (!statusElement || !enableBtn) return;
    
    if (notificationPermission === 'granted') {
        statusElement.textContent = '✅ Notifikasi diizinkan';
        statusElement.className = 'permission-status granted';
        enableBtn.style.display = 'none';
    } else if (notificationPermission === 'denied') {
        statusElement.textContent = '❌ Notifikasi ditolak. Izinkan melalui pengaturan browser.';
        statusElement.className = 'permission-status denied';
        enableBtn.style.display = 'block';
    } else {
        statusElement.textContent = '⏳ Menunggu izin notifikasi...';
        statusElement.className = 'permission-status';
        enableBtn.style.display = 'block';
    }
}

function scheduleNotification(schedule) {
    if (notificationPermission !== 'granted') return;
    
    const scheduleDate = new Date(`${schedule.date}T${schedule.time}`);
    const reminderTime = new Date(scheduleDate.getTime() - schedule.reminder * 60000);
    
    const now = new Date();
    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    if (timeUntilReminder > 0) {
        setTimeout(() => {
            if (notificationPermission === 'granted') {
                new Notification('⏰ Pengingat Jadwal', {
                    body: `Saatnya: ${schedule.title} pada ${schedule.time}`,
                    icon: '/icon.png',
                    tag: `schedule-${schedule.id}`
                });
            }
        }, timeUntilReminder);
    }
}

function scheduleAllNotifications() {
    schedules.forEach(schedule => scheduleNotification(schedule));
    tasks.forEach(task => scheduleTaskReminder(task));
    habits.forEach(habit => {
        if (habit.reminder) {
            scheduleHabitReminder(habit);
        }
    });
}

function scheduleTaskReminder(task) {
    if (notificationPermission !== 'granted' || task.reminder === 0) return;
    
    const dueDate = new Date(task.dueDate);
    const reminderTime = new Date(dueDate.getTime() - task.reminder * 60000);
    
    const now = new Date();
    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    if (timeUntilReminder > 0 && !task.completed) {
        setTimeout(() => {
            if (notificationPermission === 'granted' && !task.completed) {
                new Notification('📝 Pengingat Tugas', {
                    body: `Tugas: ${task.title} - Batas: ${dueDate.toLocaleString('id-ID')}`,
                    icon: '/icon.png',
                    tag: `task-${task.id}`
                });
            }
        }, timeUntilReminder);
    }
}

function scheduleHabitReminder(habit) {
    if (notificationPermission !== 'granted' || !habit.reminder) return;
    
    const [hours, minutes] = habit.reminder.split(':');
    const reminderTime = new Date();
    reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Jika waktu sudah lewat hari ini, jadwalkan untuk besok
    if (reminderTime < new Date()) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    const timeUntilReminder = reminderTime.getTime() - new Date().getTime();
    
    if (timeUntilReminder > 0) {
        setTimeout(() => {
            if (notificationPermission === 'granted') {
                new Notification('🔄 Pengingat Kebiasaan', {
                    body: `Waktu untuk: ${habit.name}`,
                    icon: '/icon.png',
                    tag: `habit-${habit.id}`
                });
            }
        }, timeUntilReminder);
    }
}

function checkReminders() {
    // Cek tugas yang hampir terlambat
    const now = new Date();
    tasks.forEach(task => {
        if (!task.completed) {
            const dueDate = new Date(task.dueDate);
            const timeUntilDue = dueDate.getTime() - now.getTime();
            
            // Jika kurang dari 1 jam dan belum diingatkan
            if (timeUntilDue > 0 && timeUntilDue < 3600000) {
                showNotification(`⏰ Tugas "${task.title}" hampir terlambat!`, 'warning');
            }
        }
    });
}

// Utility Functions
function formatDateTimeLocal(date) {
    return date.toISOString().slice(0, 16);
}

function getDefaultDueDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    return formatDateTimeLocal(tomorrow);
}

function getPriorityText(priority) {
    const texts = {
        low: 'Rendah',
        medium: 'Sedang',
        high: 'Tinggi'
    };
    return texts[priority] || priority;
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `custom-notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Edit functions (placeholder)
function editSchedule(id) {
    showNotification('Fitur edit jadwal akan segera hadir!', 'info');
}

function editHabit(id) {
    showNotification('Fitur edit kebiasaan akan segera hadir!', 'info');
}

function editTask(id) {
    showNotification('Fitur edit tugas akan segera hadir!', 'info');
}

// Export functions to global scope
window.completeSchedule = completeSchedule;
window.deleteSchedule = deleteSchedule;
window.toggleHabit = toggleHabit;
window.deleteHabit = deleteHabit;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.snoozeTask = snoozeTask;
window.editSchedule = editSchedule;
window.editHabit = editHabit;
window.editTask = editTask;