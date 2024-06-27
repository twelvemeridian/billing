document.getElementById("add-item").addEventListener("click", () => {
  const itemContainer = document.createElement("div");
  itemContainer.classList.add("item", "mb-3");
  itemContainer.innerHTML = `
      <div class="row g-3">
        <div class="col-md-3">
          <input type="text" class="form-control" placeholder="Item Name*" required>
        </div>
        <div class="col-md-2">
          <input type="number" class="form-control" placeholder="Quantity*" required>
        </div>
        <div class="col-md-2">
          <input type="number" class="form-control" placeholder="Rate*" required>
        </div>
        <div class="col-md-3">
          <input type="text" class="form-control" placeholder="Description">
        </div>
        <div class="col-md-2">
          <button type="button" class="btn btn-danger remove-item">Remove</button>
        </div>
      </div>
    `;
  document.getElementById("items-container").appendChild(itemContainer);
});

document.getElementById("items-container").addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-item")) {
    e.target.closest(".item").remove();
  }
});

document
  .getElementById("invoice-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const invoiceData = {
      logo: "https://twelvemeridian.com/wp-content/uploads/2023/02/cropped-tm-green-copy-1.png",
      from: "Twelve Meridian\nM10, Ground Floor near Metro Hospital & Heart Institute\nSector 11 Noida, Uttar Pradesh 201301 India\n+91 9871310315\ncontact@twelvemeridian.com",
      to: `${document.getElementById("client-name").value}\n${
        document.getElementById("client-address").value
      }\n${document.getElementById("client-phone").value}\n${
        document.getElementById("client-email").value
      }`,
      currency: "INR",
      date: new Date().toISOString().split("T")[0], // Set invoice date to today
      due_date: new Date().toISOString().split("T")[0], // Set due date to today
      terms:
        "Please refer to our terms and conditions: https://twelvemeridian.com/term-and-conditions/",
      items: [],
      date_title: "Billing Date",
      due_date_title: "Due Date",
      amount_paid: 0,
    };

    let amount_paid = 0;

    document.querySelectorAll("#items-container .item").forEach((item) => {
      const itemData = {
        name: item.querySelector('input[placeholder="Item Name*"]').value,
        quantity: parseInt(
          item.querySelector('input[placeholder="Quantity*"]').value
        ),
        unit_cost: parseFloat(
          item.querySelector('input[placeholder="Rate*"]').value
        ),
        description:
          item.querySelector('input[placeholder="Description"]').value || "",
      };
      invoiceData.items.push(itemData);
      amount_paid += itemData.quantity * itemData.unit_cost;
    });

    invoiceData.amount_paid = amount_paid;

    try {
      showLoader();
      const response = await fetch(
        "https://billing-backend-ieyz.onrender.com/generate-invoice",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(invoiceData),
        }
      );

      const clientName = document.getElementById("client-name").value;
      const clientPhone = document.getElementById("client-phone").value;
      const today = new Date();
      const formattedDate = `${today.getDate().toString().padStart(2, "0")}-${(
        today.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${today.getFullYear()}`;
      const randomNumber = Math.floor(1000 + Math.random() * 90000);

      const invoice = await response.blob();
      const url = window.URL.createObjectURL(invoice);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${clientName}_${clientPhone}_${formattedDate}_${randomNumber}.pdf`; // Custom filename
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showErrorToast();
    } finally {
      hideLoader();
    }
  });

function showLoader() {
  document.getElementById("loader").style.display = "block";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}

function showErrorToast() {
  const toast = new bootstrap.Toast(document.getElementById("error-toast"));
  toast.show();
  setTimeout(() => {
    toast.hide();
  }, 5000);
}
