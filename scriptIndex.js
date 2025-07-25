// scriptIndex.js
let transactions = JSON.parse(localStorage.getItem('mainTransactions')) || [];
function calculateCredit(index) {
  const nested = transactions[index].nestedTransactions || [];
  return nested.filter(n => n.type === 'credit').reduce((sum, n) => sum + parseFloat(n.amount || 0), 0);
}    
function calculateDebit(index) {
  const nested = transactions[index].nestedTransactions || [];
  return nested.filter(n => n.type === 'debit').reduce((sum, n) => sum + parseFloat(n.amount || 0), 0);
} 
function calculateBalance(index) {
  const credit = calculateCredit(index);
  const debit = calculateDebit(index);
  return transactions[index].amount + credit - debit;
}
function renderTransactions() {
  const list = document.getElementById('transactionList');
  list.innerHTML = '';
  transactions.forEach((tx, i) => {
    const credit = calculateCredit(i);
    const debit = calculateDebit(i);
    const balance = calculateBalance(i);
    const balClass = balance >= 0 ? 'positive' : 'negative';
    const div = document.createElement('div');
    div.className = 'transaction';
    div.innerHTML = `
    <table>
      <tr>
          <td colspan="2" class="date-time ">${formatDateTime(tx.dateTime)}</td>
          <td class="three-dots" onclick="toggleDropdown(event, ${i})">&#8942;</td>
          <td class="dropdown" id="dropdown-${i}">
            <button onclick="editTransaction(event, ${i})">Edit</button>
            <button onclick="deleteTransaction(event, ${i})">Delete</button>
          </td>
      </tr>
      <tr>
          <th colspan="3" class="title nowrap">${tx.title}</th>
          <th rowspan="3" class="balance nowrap ${balClass}">₹${balance.toFixed(2)}</th>
      </tr>
      <tr>
          <td colspan="2" class="note nowrap">${tx.note || ''}</td>
          <td class="amount nowrap">Amt: ₹${tx.amount.toFixed(2)}</td>
      </tr>
      <tr>
          <td colspan="2" class="credit nowrap">Cr: ₹${credit.toFixed(2)}</td>
          <td style="text-align:center" class="debit nowrap">Dr: ₹${debit.toFixed(2)}</td>
      </tr>
    </table>
    `;
    div.addEventListener('click', (e) => {
      if (!e.target.closest('.three-dots') && !e.target.closest('.dropdown')) {
        localStorage.setItem('selectedTransactionIndex', i);
        window.location.href = 'nested.html';
      }
    });
    list.appendChild(div);
  });
  localStorage.setItem('mainTransactions', JSON.stringify(transactions));
}
function toggleDropdown(e, index) {
  e.stopPropagation();
  document.querySelectorAll('.dropdown').forEach(d => d.style.display = 'none');
  const dropdown = document.getElementById(`dropdown-${index}`);
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}
document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown').forEach(d => d.style.display = 'none');
});
function showTransactionForm(index = null) {
  const t = index !== null ? transactions[index] : { title: '', amount: '', dateTime: '', note: '' };
  document.getElementById('transactionForm').innerHTML = `
    <div class="form-layer">
      <div></div>
      <div class="form-outline">
        <div class="form-section">
          <div class="form-group"> 
            <input id="title" type="text" placeholder="Title" value="${t.title || ''}">
          </div>
          <div class="form-group">
            <input id="amount" type="number" placeholder="Amount" value="${t.amount || ''}">
          </div>
          <div class="form-group">
            <input id="note" type="text" placeholder="Note" value="${t.note || ''}">
          </div>
          <div class="form-group">
            <input id="dateTime" type="datetime-local" value="${t.dateTime ? new Date(t.dateTime).toISOString().slice(0,16) : ''}">
          </div>
          <div class="form-actions">
            <button class="save-btn" onclick="saveTransaction(${index})">Save</button>
            <button class="cancel-btn" onclick="cancelTransactionForm()">Cancel</button>
          </div>
        </div>
      </div>
      <div></div>
    </div>
  `;
}
function cancelTransactionForm() {
  document.getElementById('transactionForm').innerHTML = '';
}
function saveTransaction(index) {
  const title = document.getElementById('title').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const note = document.getElementById('note').value.trim();
  const dateTimeInput = document.getElementById('dateTime').value;
  const dateTime = dateTimeInput ? new Date(dateTimeInput).toISOString() : new Date().toISOString();
  if (!title || isNaN(amount)) return alert('Please enter valid title and amount.');
  const newTx = {
    title,
    amount,
    note,
    dateTime,
    nestedTransactions: index !== null ? transactions[index].nestedTransactions || [] : []
  };
  if (index === null) {
    transactions.push(newTx);
  } else {
    transactions[index] = newTx;
  }
  localStorage.setItem('mainTransactions', JSON.stringify(transactions));
  document.getElementById('transactionForm').innerHTML = '';
  renderTransactions();
}
function editTransaction(e, index) {
  e.stopPropagation();
  showTransactionForm(index);
}
function deleteTransaction(e, index) {
  e.stopPropagation();
  if (confirm('Delete this transaction?')) {
    transactions.splice(index, 1);
    localStorage.setItem('mainTransactions', JSON.stringify(transactions));
     renderTransactions();
  }
}
function formatDateTime(dt) {
  const date = new Date(dt);
  return `${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString('en-US')}`;
}
document.getElementById('addBtn').addEventListener('click', () => showTransactionForm());
renderTransactions();