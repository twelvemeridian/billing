const username = document.getElementById("name");
const address = document.getElementById("address");

const phone = document.getElementById("phone");
const amount_paid = document.getElementById("amount_paid");
const item = document.getElementById("item");
const loader = document.getElementById("loader-container");
const sendBtn = document.getElementById("sendReceipt");
const previewBtn = document.getElementById("previewReceipt");

const addItemBtn = document.getElementById("addItemBtn");
const doneBtn = document.getElementById("doneBtn");
const itemsContainer = document.getElementById("items-container");
const totalAmount = document.getElementById("totalAmount");
const totalAmountContainer = document.getElementById("totalAmountContainer");

const message = document.getElementById("message");
const pdf = document.getElementById("pdf");

const BASE_URL = "https://api.twelvemeridian.com";
// const BASE_URL = "http://localhost:4000";

let receiptUrl = null;

let itemCounter = 1;

let addedItems = [];

const hideLoader = () => {
  loader.style.visibility = "hidden";
  sendBtn.style.display = "block";
};

const showLoader = () => {
  loader.style.visibility = "visible";
  sendBtn.style.display = "none";
};

let dot = 1;
var interval;

function showMessage(_message, isSuccess) {
  message.style.display = "block";
  message.innerHTML = _message;
  message.className = isSuccess ? "success" : "failure";

  // if (isSuccess == null) {
  //   interval = setInterval(() => {
  //     message.innerHTML =
  //       _message +
  //       Array(dot)
  //         .fill()
  //         .map((x) => ".")
  //         .join("");

  //     dot++;
  //     if (dot > 10) {
  //       dot = 1;
  //     }
  //   }, 50);

  //   return;
  // }

  clearInterval(interval);

  setTimeout(() => {
    message.innerHTML = "";
    message.style.display = "none";
  }, 3000);
}

/**
 * Preview invoice before sending
 */
async function previewReceipt(event) {
  event.preventDefault();

  try {
    showLoader();

    const inv = {
      first_name: username.value.split(" ")[0],
      last_name: username.value.split(" ")[1]
        ? username.value.split(" ")[1] + "\n" + address.value
        : "\n" + address.value,
      phone: phone.value,
      invoice_no: generateString(20),
      amount_paid: amount_paid.value,
      items: addedItems,
    };

    const request = await fetch(`${BASE_URL}/preview-receipt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        Authorization: "01102019@inos",
      },
      body: JSON.stringify(inv),
    });

    const data = await request.json();

    receiptUrl = data.data.results.receipt;

    pdf.src = data.data.results.receipt + "#navpanes=0";

    // await navigator.clipboard.writeText(data.data.results.receipt);
    showMessage(`Receipt Preview : ${data.data.results.receipt}`, true);

    sendBtn.style.display = "block";
  } catch (error) {
    showMessage(error.message, false);
  } finally {
    hideLoader();
  }
}

async function sendReceipt(event) {
  event.preventDefault();

  try {
    console.log(receiptUrl);
    if (receiptUrl == null) {
      throw new Error("Please preview the receipt first.");
    }

    showLoader();

    const request = await fetch(`${BASE_URL}/send-receipt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        Authorization: "01102019@inos",
      },
      body: JSON.stringify({
        receipt_url: receiptUrl,
        phone: phone.value,
      }),
    });

    username.value = "";
    phone.value = "";
    amount_paid.value = "";
    itemsContainer.innerHTML = "";
    address.value = "";
    addedItems = [];
    sendBtn.style.display = "none";
    previewBtn.style.display = "none";
    totalAmountContainer.style.display = "none";
    receiptUrl = null;
    pdf.src = "";

    showMessage("Receipt Sent", true);
  } catch (error) {
    showMessage(error.message, false);
  } finally {
    hideLoader();
  }
}

function addTextInput(event) {
  event.preventDefault();
  totalAmountContainer.style.display = "none";

  // Create a new row element
  const newRow = document.createElement("div");
  newRow.className = "row mt-2 mb-2";
  newRow.id = "item" + itemCounter;

  // Create the item dropdown element
  const itemDropdown = document.createElement("div");
  itemDropdown.className = "col-md-4";
  itemDropdown.innerHTML = `
    <select class="form-select" id="options">
      <option selected>Select Item</option>
      <option value="Natural Therapy Session - 399">Therapy Session</option>
      <option value="Natural Therapy Session Package (x5) - 1699">Package (x5)</option>
      <option value="Natural Therapy Session Package (x10) - 2999">Package (x10)</option>
      <option value="Natural Therapy Session Package (x30) - 6999">Package (x30)</option>
      <option value="Foot Roller - 200">Foot Roller</option>
      <option value="Foot Mat - 300">Foot Mat</option>
    </select>
  `;

  // Create the quantity input element
  const quantityInput = document.createElement("div");
  quantityInput.className = "col-md-3";
  quantityInput.innerHTML = `
    <input
      class="form-control"
      type="number"
      name="quantity"
      id="quantity"
      placeholder="Quantity"
      value="1"
    />
  `;

  // Create the remove icon element
  const removeIcon = document.createElement("span");
  removeIcon.className = "remove-icon";
  removeIcon.textContent = "❎";
  removeIcon.onclick = function () {
    removeItem(newRow);
  };

  // Create the remove icon container element
  const removeIconContainer = document.createElement("div");
  removeIconContainer.className = "col-md-2";
  removeIconContainer.appendChild(removeIcon);

  // Append the elements to the newRow
  newRow.appendChild(itemDropdown);
  newRow.appendChild(quantityInput);
  newRow.appendChild(removeIconContainer);

  const selectElement = itemDropdown.querySelector("select");

  // Add event listener for the select element
  selectElement.addEventListener("change", function () {
    handlePackageSelection(selectElement, newRow, removeIconContainer);
  });

  // Add the newRow to the items container
  itemsContainer.appendChild(newRow);

  // Increment the item counter
  itemCounter++;
}

function handlePackageSelection(selectElement, row, removeIconContainer) {
  const selectedItemValue =
    selectElement.options[selectElement.selectedIndex].value;
  const [selectedItem] = selectedItemValue.split("|");
  const packageInputContainer = row.querySelector(".package-input-container");

  if (selectedItem.includes("Session") && !packageInputContainer) {
    // Create and insert the input field for the package number
    const packageInput = document.createElement("input");
    packageInput.type = "text";
    packageInput.placeholder = "Package Number";
    packageInput.className = "form-control";

    if (selectedItem.includes("Package")) {
      packageInput.value = generateString(6);
      packageInput.readOnly = true;
    }

    const newContainer = document.createElement("div");
    newContainer.className = "col-md-3 package-input-container";
    newContainer.appendChild(packageInput);

    row.insertBefore(newContainer, removeIconContainer);
  } else if (!selectedItem.includes("Session") && packageInputContainer) {
    // Remove the input field for the package number
    row.removeChild(packageInputContainer);
  } else if (selectedItem.includes("Session") && packageInputContainer) {
    const packageInput = packageInputContainer.querySelector("input");

    if (selectedItem.includes("Package")) {
      packageInput.value = generateString(6);
      packageInput.readOnly = true;
    } else {
      packageInput.value = "";
      packageInput.readOnly = false;
    }
  }
}

function removeItem(item) {
  totalAmountContainer.style.display = "none";

  item.parentNode.removeChild(item);
}

function getSelectedItemsAndQuantities() {
  const itemsContainer = document.getElementById("items-container");
  const rows = itemsContainer.getElementsByClassName("row");
  const itemsAndQuantities = [];

  for (const row of rows) {
    const selectElement = row.querySelector("select");
    const selectedItem =
      selectElement.options[selectElement.selectedIndex].value.split("-")[0];
    let selectedItemCost =
      selectElement.options[selectElement.selectedIndex].value.split("-")[1];
    const quantityInput = row.querySelector('input[type="number"]');
    const quantity = parseInt(quantityInput.value, 10);

    const packageInputContainer = row.querySelector(".package-input-container");
    let packageName = packageInputContainer
      ? `${packageInputContainer.querySelector("input").value}`
      : "";

    if (packageName != "" && !selectedItem.includes("Package")) {
      selectedItemCost = 0;
    } else if (packageName != "") {
      packageName = `(${packageName})`;
    }

    if (selectedItem !== "Select Item" && !isNaN(quantity)) {
      itemsAndQuantities.push({
        name: selectedItem + packageName,
        quantity,
        unit_cost: selectedItemCost,
      });
    }
  }

  return itemsAndQuantities;
}

function done(event) {
  event.preventDefault();

  addedItems = getSelectedItemsAndQuantities();

  let sum = 0;
  for (const item of addedItems) {
    sum = sum + item.quantity * item.unit_cost;
  }

  totalAmount.innerHTML = `₹ ${sum}/-`;
  totalAmountContainer.style.display = "block";
  previewBtn.style.display = "block";
}

function generateString(length) {
  // declare all characters
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let result = " ";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

//Initialize
function init() {
  sendBtn.addEventListener("click", sendReceipt);
  previewBtn.addEventListener("click", previewReceipt);
  addItemBtn.addEventListener("click", addTextInput);
  doneBtn.addEventListener("click", done);
  hideLoader();
  sendBtn.style.display = "none";
  previewBtn.style.display = "none";
  totalAmountContainer.style.display = "none";
}

init();
