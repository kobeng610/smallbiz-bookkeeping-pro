// Application State
const APP = {
    version: '1.0.0',
    licenseKey: null,
    deviceFingerprint: null,
    transactions: [],
    categories: {
        income: ['Sales', 'Services', 'Consulting', 'Products', 'Other Income'],
        expense: ['Advertising', 'Car & Truck', 'Commissions', 'Contract Labor', 'Depreciation', 
                  'Employee Benefits', 'Insurance', 'Legal & Professional', 'Office Expense', 
                  'Rent', 'Repairs & Maintenance', 'Supplies', 'Travel', 'Meals', 'Utilities', 
                  'Wages', 'Other Expenses']
    },
    chart: null,
    editingTransactionId: null
};

// Device Fingerprinting
function generateDeviceFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    const canvasData = canvas.toDataURL();
    
    const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvasHash: hashString(canvasData)
    };
    
    return hashString(JSON.stringify(fingerprint));
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

// License System
const VALID_LICENSES = {
    'SBKP-2025-XXXX-TRIAL': { type: 'trial', deviceFingerprint: null },
    'SBKP-2025-DEMO-00001': { type: 'full', deviceFingerprint: null },
    'SBKP-2025-PROD-12345': { type: 'full', deviceFingerprint: null }
};

function validateLicenseFormat(key) {
    const pattern = /^SBKP-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{5}$/;
    return pattern.test(key);
}

function activateLicense(licenseKey) {
    const messageEl = document.getElementById('licenseMessage');
    
    if (!validateLicenseFormat(licenseKey)) {
        messageEl.textContent = 'Invalid license key format';
        messageEl.className = 'license-message error';
        return false;
    }
    
    const licenseData = VALID_LICENSES[licenseKey];
    if (!licenseData) {
        messageEl.textContent = 'Invalid license key';
        messageEl.className = 'license-message error';
        return false;
    }
    
    const deviceFP = generateDeviceFingerprint();
    
    if (licenseData.deviceFingerprint && licenseData.deviceFingerprint !== deviceFP) {
        messageEl.textContent = 'This license is already activated on another device';
        messageEl.className = 'license-message error';
        return false;
    }
    
    // Activate license
    licenseData.deviceFingerprint = deviceFP;
    APP.licenseKey = licenseKey;
    APP.deviceFingerprint = deviceFP;
    
    // Save to localStorage
    localStorage.setItem('sbkp_license', licenseKey);
    localStorage.setItem('sbkp_fingerprint', deviceFP);
    
    messageEl.textContent = 'License activated successfully!';
    messageEl.className = 'license-message success';
    
    setTimeout(() => {
        showMainApp();
    }, 1000);
    
    return true;
}

function checkLicense() {
    const savedLicense = localStorage.getItem('sbkp_license');
    const savedFingerprint = localStorage.getItem('sbkp_fingerprint');
    
    if (!savedLicense || !savedFingerprint) {
        return false;
    }
    
    const licenseData = VALID_LICENSES[savedLicense];
    if (!licenseData) {
        return false;
    }
    
    const currentFingerprint = generateDeviceFingerprint();
    if (savedFingerprint !== currentFingerprint) {
        return false;
    }
    
    APP.licenseKey = savedLicense;
    APP.deviceFingerprint = savedFingerprint;
    return true;
}

function showMainApp() {
    document.getElementById('licenseScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    document.getElementById('licenseInfo').textContent = `License: ${APP.licenseKey}`;
    loadData();
    initializeApp();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('sbkp_license');
        localStorage.removeItem('sbkp_fingerprint');
        location.reload();
    }
}

// Data Management
function saveData() {
    localStorage.setItem('sbkp_transactions', JSON.stringify(APP.transactions));
}

function loadData() {
    const saved = localStorage.getItem('sbkp_transactions');
    if (saved) {
        APP.transactions = JSON.parse(saved);
    }
}

// Transaction Management
function addTransaction(transaction) {
    transaction.id = Date.now().toString();
    APP.transactions.push(transaction);
    saveData();
    renderTransactions();
    updateDashboard();
}

function updateTransaction(id, transaction) {
    const index = APP.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        transaction.id = id;
        APP.transactions[index] = transaction;
        saveData();
        renderTransactions();
        updateDashboard();
    }
}

function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        APP.transactions = APP.transactions.filter(t => t.id !== id);
        saveData();
        renderTransactions();
        updateDashboard();
    }
}

function deleteSelectedTransactions() {
    const checkboxes = document.querySelectorAll('.transaction-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('Please select transactions to delete');
        return;
    }
    
    if (confirm(`Delete ${checkboxes.length} selected transaction(s)?`)) {
        checkboxes.forEach(cb => {
            APP.transactions = APP.transactions.filter(t => t.id !== cb.dataset.id);
        });
        saveData();
        renderTransactions();
        updateDashboard();
    }
}

// Rendering
function renderTransactions() {
    const container = document.getElementById('transactionsList');
    const searchTerm = document.getElementById('searchTransaction').value.toLowerCase();
    const typeFilter = document.getElementById('filterType').value;
    const categoryFilter = document.getElementById('filterCategory').value;
    
    let filtered = APP.transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm) || 
                            t.notes?.toLowerCase().includes(searchTerm);
        const matchesType = typeFilter === 'all' || t.type === typeFilter;
        const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
        return matchesSearch && matchesType && matchesCategory;
    });
    
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding: 32px; text-align: center; color: var(--text-secondary);">No transactions found</div>';
        return;
    }
    
    container.innerHTML = filtered.map(t => `
        <div class="transaction-item">
            <input type="checkbox" class="transaction-checkbox" data-id="${t.id}">
            <div>${new Date(t.date).toLocaleDateString()}</div>
            <div class="transaction-type ${t.type}">${t.type}</div>
            <div>${t.category}</div>
            <div>${t.description}</div>
            <div class="transaction-amount">$${parseFloat(t.amount).toFixed(2)}</div>
            <div class="transaction-actions">
                <button class="action-btn" onclick="editTransaction('${t.id}')">Edit</button>
                <button class="action-btn" onclick="deleteTransaction('${t.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateDashboard() {
    const income = APP.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const expenses = APP.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    document.getElementById('totalRevenue').textContent = `$${income.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${expenses.toFixed(2)}`;
    document.getElementById('netIncome').textContent = `$${(income - expenses).toFixed(2)}`;
    document.getElementById('totalTransactions').textContent = APP.transactions.length;
    
    updateChart();
}

function updateChart() {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return;
    
    // Get last 6 months
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            year: d.getFullYear(),
            month: d.getMonth()
        });
    }
    
    const monthlyData = months.map(m => {
        const income = APP.transactions
            .filter(t => {
                const d = new Date(t.date);
                return t.type === 'income' && d.getFullYear() === m.year && d.getMonth() === m.month;
            })
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const expense = APP.transactions
            .filter(t => {
                const d = new Date(t.date);
                return t.type === 'expense' && d.getFullYear() === m.year && d.getMonth() === m.month;
            })
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        return { income, expense };
    });
    
    if (APP.chart) {
        APP.chart.destroy();
    }
    
    APP.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months.map(m => m.label),
            datasets: [
                {
                    label: 'Income',
                    data: monthlyData.map(d => d.income),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)'
                },
                {
                    label: 'Expenses',
                    data: monthlyData.map(d => d.expense),
                    backgroundColor: 'rgba(239, 68, 68, 0.8)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Modal Management
function showTransactionModal(transactionId = null) {
    const modal = document.getElementById('transactionModal');
    const form = document.getElementById('transactionForm');
    
    APP.editingTransactionId = transactionId;
    
    if (transactionId) {
        const transaction = APP.transactions.find(t => t.id === transactionId);
        document.getElementById('modalTitle').textContent = 'Edit Transaction';
        document.getElementById('txDate').value = transaction.date;
        document.getElementById('txType').value = transaction.type;
        updateCategoryOptions(transaction.type);
        document.getElementById('txCategory').value = transaction.category;
        document.getElementById('txDescription').value = transaction.description;
        document.getElementById('txAmount').value = transaction.amount;
        document.getElementById('txNotes').value = transaction.notes || '';
    } else {
        document.getElementById('modalTitle').textContent = 'Add Transaction';
        form.reset();
        document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
        updateCategoryOptions('income');
    }
    
    modal.classList.add('show');
}

function hideTransactionModal() {
    document.getElementById('transactionModal').classList.remove('show');
    APP.editingTransactionId = null;
}

function updateCategoryOptions(type) {
    const categorySelect = document.getElementById('txCategory');
    const categories = APP.categories[type] || [];
    categorySelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function editTransaction(id) {
    showTransactionModal(id);
}

// Reports
function generateReports() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }
    
    const filtered = APP.transactions.filter(t => {
        return t.date >= startDate && t.date <= endDate;
    });
    
    generateIncomeStatement(filtered, startDate, endDate);
    generateCashFlow(filtered, startDate, endDate);
    generateCategoryAnalysis(filtered, startDate, endDate);
}

function generateIncomeStatement(transactions, startDate, endDate) {
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const totalIncome = income.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const netIncome = totalIncome - totalExpenses;
    
    const html = `
        <div style="font-family: 'Roboto Mono', monospace; font-size: 14px;">
            <p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
            <hr style="margin: 16px 0;">
            <p><strong>Total Income:</strong> $${totalIncome.toFixed(2)}</p>
            <p><strong>Total Expenses:</strong> $${totalExpenses.toFixed(2)}</p>
            <hr style="margin: 16px 0;">
            <p style="font-size: 16px;"><strong>Net Income:</strong> $${netIncome.toFixed(2)}</p>
        </div>
    `;
    
    document.getElementById('incomeStatement').innerHTML = html;
}

function generateCashFlow(transactions, startDate, endDate) {
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const cashIn = income.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const cashOut = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const netCash = cashIn - cashOut;
    
    const html = `
        <div style="font-family: 'Roboto Mono', monospace; font-size: 14px;">
            <p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
            <hr style="margin: 16px 0;">
            <p><strong>Cash In:</strong> $${cashIn.toFixed(2)}</p>
            <p><strong>Cash Out:</strong> $${cashOut.toFixed(2)}</p>
            <hr style="margin: 16px 0;">
            <p style="font-size: 16px;"><strong>Net Cash Flow:</strong> $${netCash.toFixed(2)}</p>
        </div>
    `;
    
    document.getElementById('cashFlow').innerHTML = html;
}

function generateCategoryAnalysis(transactions, startDate, endDate) {
    const byCategory = {};
    
    transactions.forEach(t => {
        if (!byCategory[t.category]) {
            byCategory[t.category] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            byCategory[t.category].income += parseFloat(t.amount);
        } else {
            byCategory[t.category].expense += parseFloat(t.amount);
        }
    });
    
    let html = `
        <div style="font-family: 'Roboto Mono', monospace; font-size: 14px;">
            <p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
            <hr style="margin: 16px 0;">
    `;
    
    for (const [category, amounts] of Object.entries(byCategory)) {
        const total = amounts.income - amounts.expense;
        html += `<p><strong>${category}:</strong> $${total.toFixed(2)}</p>`;
    }
    
    html += '</div>';
    document.getElementById('categoryAnalysis').innerHTML = html;
}

// Tax Center
function generateTaxSummary() {
    const year = parseInt(document.getElementById('taxYear').value);
    
    const yearTransactions = APP.transactions.filter(t => {
        return new Date(t.date).getFullYear() === year;
    });
    
    const totalIncome = yearTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const expensesByCategory = {};
    yearTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            if (!expensesByCategory[t.category]) {
                expensesByCategory[t.category] = 0;
            }
            expensesByCategory[t.category] += parseFloat(t.amount);
        });
    
    const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);
    const netProfit = totalIncome - totalExpenses;
    
    let html = `
        <div style="font-family: 'Roboto Mono', monospace;">
            <h3>Schedule C - Tax Year ${year}</h3>
            <hr style="margin: 16px 0;">
            <h4>Gross Income</h4>
            <p><strong>Total Income:</strong> $${totalIncome.toFixed(2)}</p>
            <hr style="margin: 16px 0;">
            <h4>Expenses</h4>
    `;
    
    for (const [category, amount] of Object.entries(expensesByCategory)) {
        html += `<p><strong>${category}:</strong> $${amount.toFixed(2)}</p>`;
    }
    
    html += `
            <hr style="margin: 16px 0;">
            <p><strong>Total Expenses:</strong> $${totalExpenses.toFixed(2)}</p>
            <hr style="margin: 16px 0;">
            <h4 style="font-size: 18px;"><strong>Net Profit:</strong> $${netProfit.toFixed(2)}</h4>
        </div>
    `;
    
    document.getElementById('taxSummary').innerHTML = html;
}

// Export Functions
function exportToPDF(reportType) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('SmallBiz BookKeeping Pro', 20, 20);
    doc.setFontSize(12);
    doc.text(`Report: ${reportType}`, 20, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 40);
    
    doc.save(`${reportType}-report.pdf`);
    alert('PDF export feature - Full implementation requires report content rendering');
}

function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(APP.transactions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, 'transactions.xlsx');
}

// Initialize App
function initializeApp() {
    updateDashboard();
    renderTransactions();
    populateCategoryFilter();
    setDefaultDates();
}

function populateCategoryFilter() {
    const select = document.getElementById('filterCategory');
    const allCategories = [...APP.categories.income, ...APP.categories.expense];
    select.innerHTML = '<option value="all">All Categories</option>' +
        allCategories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function setDefaultDates() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    document.getElementById('reportStartDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('reportEndDate').value = lastDay.toISOString().split('T')[0];
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check license on load
    if (checkLicense()) {
        showMainApp();
    }
    
    // License activation
    document.getElementById('activateBtn').addEventListener('click', () => {
        const key = document.getElementById('licenseKeyInput').value.trim().toUpperCase();
        activateLicense(key);
    });
    
    document.getElementById('licenseKeyInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('activateBtn').click();
        }
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
        });
    });
    
    // Transaction modal
    document.getElementById('addTransactionBtn').addEventListener('click', () => showTransactionModal());
    document.querySelector('.close').addEventListener('click', hideTransactionModal);
    document.querySelector('.cancel-btn').addEventListener('click', hideTransactionModal);
    
    // Transaction form
    document.getElementById('txType').addEventListener('change', (e) => {
        updateCategoryOptions(e.target.value);
    });
    
    document.getElementById('transactionForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const transaction = {
            date: document.getElementById('txDate').value,
            type: document.getElementById('txType').value,
            category: document.getElementById('txCategory').value,
            description: document.getElementById('txDescription').value,
            amount: document.getElementById('txAmount').value,
            notes: document.getElementById('txNotes').value
        };
        
        if (APP.editingTransactionId) {
            updateTransaction(APP.editingTransactionId, transaction);
        } else {
            addTransaction(transaction);
        }
        
        hideTransactionModal();
    });
    
    // Filters
    document.getElementById('searchTransaction').addEventListener('input', renderTransactions);
    document.getElementById('filterType').addEventListener('change', renderTransactions);
    document.getElementById('filterCategory').addEventListener('change', renderTransactions);
    
    // Bulk actions
    document.getElementById('selectAllBtn').addEventListener('click', () => {
        document.querySelectorAll('.transaction-checkbox').forEach(cb => cb.checked = true);
    });
    
    document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelectedTransactions);
    
    document.getElementById('exportSelectedBtn').addEventListener('click', () => {
        const selected = Array.from(document.querySelectorAll('.transaction-checkbox:checked'))
            .map(cb => APP.transactions.find(t => t.id === cb.dataset.id));
        
        if (selected.length === 0) {
            alert('Please select transactions to export');
            return;
        }
        
        const ws = XLSX.utils.json_to_sheet(selected);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Selected Transactions');
        XLSX.writeFile(wb, 'selected-transactions.xlsx');
    });
    
    // Reports
    document.getElementById('generateReportBtn').addEventListener('click', generateReports);
    
    document.querySelectorAll('.export-pdf').forEach(btn => {
        btn.addEventListener('click', () => {
            exportToPDF(btn.dataset.report);
        });
    });
    
    // Tax
    document.getElementById('generateTaxBtn').addEventListener('click', generateTaxSummary);
    document.getElementById('exportTaxPdfBtn').addEventListener('click', () => exportToPDF('tax'));
    document.getElementById('exportTaxExcelBtn').addEventListener('click', exportToExcel);
});
