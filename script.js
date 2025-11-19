
var STORAGE_KEY = 'credit_records_v1';

// الحالة
var records = [];
var filteredRecords = []; // لعرض مفلتر
var searchText = '';
var paidFilter = 'all';

// تحميل أولي
document.addEventListener('DOMContentLoaded', function () {
  loadRecords();
  ensureDefaultDate();
  bindEvents();
  render();
});

// تحميل من LocalStorage
function loadRecords() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      records = JSON.parse(raw);
    } else {
      records = [];
    }
  } catch (e) {
    records = [];
  }
}

// حفظ إلى LocalStorage
function saveRecords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {}
}

// تعيين تاريخ اليوم افتراضيًا
function ensureDefaultDate() {
  var dateInput = document.getElementById('date');
  var today = new Date();
  var yyyy = today.getFullYear();
  var mm = ('0' + (today.getMonth() + 1)).slice(-2);
  var dd = ('0' + today.getDate()).slice(-2);
  dateInput.value = yyyy + '-' + mm + '-' + dd;
}

// ربط الأحداث
function bindEvents() {
  var form = document.getElementById('addForm');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    addRecordFromForm();
  });

  var clearBtn = document.getElementById('clearAll');
  clearBtn.addEventListener('click', function () {
    if (confirm('هل تريد حذف كل السجلات؟ لا يمكن التراجع.')) {
      records = [];
      saveRecords();
      render();
    }
  });

  var searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', function () {
    searchText = this.value.toLowerCase();
    render();
  });

  var filterPaid = document.getElementById('filterPaid');
  filterPaid.addEventListener('change', function () {
    paidFilter = this.value;
    render();
  });

  // نموذج التعديل
  var editForm = document.getElementById('editForm');
  editForm.addEventListener('submit', function (e) {
    e.preventDefault();
    saveEditRecord();
  });
}

// إضافة سجل من النموذج
function addRecordFromForm() {
  var name = document.getElementById('name').value.trim();
  var amount = parseFloat(document.getElementById('amount').value);
  var price = parseFloat(document.getElementById('price').value);
  var date = document.getElementById('date').value;
  var paidStr = document.getElementById('paid').value;

  if (!name || isNaN(amount) || isNaN(price) || !date) {
    alert('يرجى ملء جميع الحقول بشكل صحيح.');
    return;
  }

  var rec = {
    id: generateId(),
    name: name,
    amount: amount,
    price: price,
    date: date,
    paid: paidStr === 'true'
  };

  records.unshift(rec); // إضافة في الأعلى
  saveRecords();
  resetAddForm();
  render();
}

// مولّد معرف بسيط
function generateId() {
  return 'r_' + new Date().getTime() + '_' + Math.floor(Math.random() * 100000);
}

// إعادة تعيين النموذج
function resetAddForm() {
  document.getElementById('name').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('price').value = '';
  ensureDefaultDate();
  document.getElementById('paid').value = 'false';
}

// حساب الربح لسجل واحد: price - (amount * 1.043)
function calcProfit(rec) {
  var costWithFee = rec.amount * 1.043;
  return rec.price - costWithFee;
}

// تصفية حسب البحث والحالة
function computeFiltered() {
  filteredRecords = records.filter(function (r) {
    var matchesSearch = !searchText || (r.name || '').toLowerCase().indexOf(searchText) !== -1;
    var matchesPaid = true;
    if (paidFilter === 'paid') matchesPaid = r.paid === true;
    else if (paidFilter === 'unpaid') matchesPaid = r.paid === false;
    return matchesSearch && matchesPaid;
  });
}

// تنسيق رقم بسيط بدون عملة
function fmtNumber(n) {
  var num = Math.round(n);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// تحديث الإحصائيات
function renderStats() {
  var totalTopUp = 0;
  var totalProfit = 0;
  var paidCount = 0;
  var unpaidCount = 0;

  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    totalTopUp += r.amount;
    totalProfit += calcProfit(r);
    if (r.paid) paidCount++;
    else unpaidCount++;
  }

  document.getElementById('totalTopUp').textContent = fmtNumber(totalTopUp);
  document.getElementById('totalProfit').textContent = fmtNumber(totalProfit);
  document.getElementById('paidCounts').textContent = paidCount + ' | ' + unpaidCount;
}

// رسم الجدول
function renderTable() {
  computeFiltered();

  var tbody = document.getElementById('recordsBody');
  tbody.innerHTML = '';

  for (var i = 0; i < filteredRecords.length; i++) {
    var r = filteredRecords[i];
    var tr = document.createElement('tr');

    // رقم تسلسلي
    var tdIndex = document.createElement('td');
    tdIndex.textContent = (i + 1);
    tr.appendChild(tdIndex);

    // الاسم
    var tdName = document.createElement('td');
    tdName.textContent = r.name;
    tr.appendChild(tdName);

    // المبلغ
    var tdAmount = document.createElement('td');
    tdAmount.textContent = fmtNumber(r.amount);
    tr.appendChild(tdAmount);

    // السعر
    var tdPrice = document.createElement('td');
    tdPrice.textContent = fmtNumber(r.price);
    tr.appendChild(tdPrice);

    // التاريخ
    var tdDate = document.createElement('td');
    tdDate.textContent = r.date;
    tr.appendChild(tdDate);

    // الحالة
    var tdPaid = document.createElement('td');
    var badge = document.createElement('span');
    badge.className = r.paid ? 'badge-paid' : 'badge-unpaid';
    badge.textContent = r.paid ? 'مدفوع' : 'غير مدفوع';
    tdPaid.appendChild(badge);
    tr.appendChild(tdPaid);

    // الربح
    var tdProfit = document.createElement('td');
    tdProfit.textContent = fmtNumber(calcProfit(r));
    tr.appendChild(tdProfit);

    // الإجراءات
    var tdActions = document.createElement('td');
    tdActions.className = 'text-center';

    var btnToggle = document.createElement('button');
    btnToggle.className = 'btn btn-sm btn-icon ' + (r.paid ? 'btn-outline-warning' : 'btn-outline-success');
    btnToggle.textContent = r.paid ? 'تعيين غير مدفوع' : 'تعيين مدفوع';
    btnToggle.addEventListener('click', createToggleHandler(r.id));

    var btnEdit = document.createElement('button');
    btnEdit.className = 'btn btn-sm btn-icon btn-outline-primary';
    btnEdit.textContent = 'تعديل';
    btnEdit.addEventListener('click', createEditHandler(r.id));

    var btnDelete = document.createElement('button');
    btnDelete.className = 'btn btn-sm btn-icon btn-outline-danger';
    btnDelete.textContent = 'حذف';
    btnDelete.addEventListener('click', createDeleteHandler(r.id));

    tdActions.appendChild(btnToggle);
    tdActions.appendChild(btnEdit);
    tdActions.appendChild(btnDelete);

    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  }
}

// معالجات الأزرار بأسلوب قديم
function createToggleHandler(id) {
  return function () {
    for (var i = 0; i < records.length; i++) {
      if (records[i].id === id) {
        records[i].paid = !records[i].paid;
        break;
      }
    }
    saveRecords();
    render();
  };
}

function createDeleteHandler(id) {
  return function () {
    if (!confirm('هل تريد حذف هذا السجل؟')) return;
    records = records.filter(function (r) { return r.id !== id; });
    saveRecords();
    render();
  };
}

function createEditHandler(id) {
  return function () {
    var rec = findRecordById(id);
    if (!rec) return;

    document.getElementById('editId').value = rec.id;
    document.getElementById('editName').value = rec.name;
    document.getElementById('editAmount').value = rec.amount;
    document.getElementById('editPrice').value = rec.price;
    document.getElementById('editDate').value = rec.date;
    document.getElementById('editPaid').value = rec.paid ? 'true' : 'false';

    $('#editModal').modal('show');
  };
}

function findRecordById(id) {
  for (var i = 0; i < records.length; i++) {
    if (records[i].id === id) return records[i];
  }
  return null;
}

function saveEditRecord() {
  var id = document.getElementById('editId').value;
  var name = document.getElementById('editName').value.trim();
  var amount = parseFloat(document.getElementById('editAmount').value);
  var price = parseFloat(document.getElementById('editPrice').value);
  var date = document.getElementById('editDate').value;
  var paidStr = document.getElementById('editPaid').value;

  if (!name || isNaN(amount) || isNaN(price) || !date) {
    alert('يرجى ملء جميع الحقول بشكل صحيح.');
    return;
  }

  for (var i = 0; i < records.length; i++) {
    if (records[i].id === id) {
      records[i].name = name;
      records[i].amount = amount;
      records[i].price = price;
      records[i].date = date;
      records[i].paid = paidStr === 'true';
      break;
    }
  }

  saveRecords();
  $('#editModal').modal('hide');
  render();
}

// إعادة الرسم العام
function render() {
  renderStats();
  renderTable();
}