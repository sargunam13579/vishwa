// scriptNested.js
const mainIndex = localStorage.getItem("selectedTransactionIndex");
const transactions = JSON.parse(localStorage.getItem("mainTransactions")) || [];
const mainTransaction = transactions[mainIndex];
if (!mainTransaction) {
  alert("Main transaction not found. Please go back and select one.");
  window.location.href = "main.html";
}    
const nestedList = document.getElementById("nestedList");
const formContainer = document.getElementById("addFormContainer");
const detailsDiv = document.getElementById("mainTransactionDetails");
function getCreditSum() {
  return (mainTransaction.nestedTransactions || [])
    .filter(t => t.type === "credit")
    .reduce((sum, curr) => sum + parseFloat(curr.amount), 0);
}
function getDebitSum() {
  return (mainTransaction.nestedTransactions || [])
    .filter(t => t.type === "debit")
    .reduce((sum, curr) => sum + parseFloat(curr.amount), 0);
}
function getBalance() {
  const credit = getCreditSum();
  const debit = getDebitSum();
  return mainTransaction.amount + credit - debit;
}
function formatDateTime(isoString) {
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return {
    date: `${day}/${month}/${year}`,
    time: `${hours}:${minutes} ${ampm}`
  };
}
function updateMainHeader() {
  const creditSum = getCreditSum();
  const debitSum = getDebitSum();
  const balance = getBalance();
  const balanceClass = balance >= 0 ? 'green' : 'red';
  detailsDiv.innerHTML = `
    <span style="color:black">${mainTransaction.title}</span>
    <span>Amount: ₹${mainTransaction.amount.toFixed(2)}</span>
    <span class="green">Credit: ₹${creditSum.toFixed(2)}</span>
    <span class="red">Debit: ₹${debitSum.toFixed(2)}</span>
    <span class="${balanceClass}">Balance: ₹${balance.toFixed(2)}</span>
  `;
}
function renderNestedTransactions() {
  nestedList.innerHTML = "";
  (mainTransaction.nestedTransactions || []).forEach((t, i) => {
    const { date, time } = formatDateTime(t.dateTime);
    const cssClass = t.type === 'credit' ? 'credit' : 'debit';
    const div = document.createElement("div");
    div.className = `nested ${cssClass}`;
    div.innerHTML = `
    <table>
      <tr>
        <td class="three-dots" onclick="toggleDropdown(event, ${i})">&#8942;</td>
        <td class="dropdown" id="dropdown-${i}">
          <button onclick="editTransaction(event, ${i})">Edit</button>
          <button onclick="deleteTransaction(event, ${i})">Delete</button>
        </td>
      </tr>
      <tr>
        <td colspan="2" class="title nowrap">${t.title}</td>
        <td rowspan="3">${t.image ? `<img src="${t.image}" alt="img">` : ""}</td>
      </tr>
      <tr>
        <td class="note">Note: ${t.note}</td>
        <td style="font-weight:bold;">${t.type.charAt(0).toUpperCase() + t.type.slice(1)}: ₹${t.amount}</td>
      </tr>
      <tr>
        <td colspan="2" class="date-time">Date: ${date} - ${time}</td>
      </tr>
    </table>
    `;
    nestedList.appendChild(div);
  });
  localStorage.setItem("mainTransactions", JSON.stringify(transactions));
  updateMainHeader();
}
function toggleDropdown(e, index) {
  e.stopPropagation();
  document.querySelectorAll('.dropdown').forEach(d => d.style.display = 'none');
  const dropdown = document.getElementById(`dropdown-${index}`);
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}
function showForm(index = null) {
  const t = index !== null ? mainTransaction.nestedTransactions[index] : {};
  formContainer.innerHTML = `
  <div class="form-layer">
    <div></div>
    <div class="form-outline">
      <div class="form-section"> 
        <input type="text" id="title" placeholder="Title" value="${t.title || ""}" />
        <input type="number" id="amount" placeholder="Amount" value="${t.amount || ""}" />
        <input type="text" id="note" placeholder="Note" value="${t.note || ""}" />
        <input type="datetime-local" id="dateTime" value="${t.dateTime ? new Date(t.dateTime).toISOString().slice(0, 16) : ""}" />
        <select id="type" style="width: 100%;">
          <option value="debit" ${!t.type || t.type === "debit" ? "selected" : ""}>Debit</option>
          <option value="credit" ${t.type === "credit" ? "selected" : ""}>Credit</option>
        </select>
        <input type="file" id="image" accept="image/*" />
        <div class="form-actions">
          <button class="save-btn" onclick="saveNested(${index})">Save</button>
          <button class="cancel-btn" onclick="formContainer.innerHTML=''">Cancel</button>
        </div>
      </div>
    </div>
    <div></div>
  </div>
  `;
}
function saveNested(index) {
  const title = document.getElementById("title").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const note = document.getElementById("note").value;
  let dateTime = document.getElementById("dateTime").value;
  const type = document.getElementById("type").value;
  const imageInput = document.getElementById("image");
  let image = "";
  if (!title || isNaN(amount)) return alert("Fill all required fields.");
  if (!dateTime) {
    dateTime = new Date().toISOString();
  }
  if (imageInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = function(e) {
      image = e.target.result;
      finalizeSave();
    };
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    image = index !== null && mainTransaction.nestedTransactions[index] ? mainTransaction.nestedTransactions[index].image : "";
    finalizeSave();
  }
  function finalizeSave() {
    const nestedTx = { title, amount, note, dateTime, type, image };
    if (!mainTransaction.nestedTransactions) mainTransaction.nestedTransactions = [];
    if (index !== null) {
      mainTransaction.nestedTransactions[index] = nestedTx;
    } else {
      mainTransaction.nestedTransactions.push(nestedTx);
    }
    localStorage.setItem("mainTransactions", JSON.stringify(transactions));
    formContainer.innerHTML = "";
    renderNestedTransactions();
  }
}
function editTransaction(e, index) {
  e.stopPropagation();
  showForm(index);
}
function deleteTransaction(e, index) {
  e.stopPropagation();
  if (confirm('Delete this transaction?')) {
    mainTransaction.nestedTransactions.splice(index, 1);
    localStorage.setItem('mainTransactions', JSON.stringify(transactions));
    renderNestedTransactions();
  }
}
document.getElementById("addBtn").addEventListener("click", () => showForm());
renderNestedTransactions();