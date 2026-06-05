// Wait for the DOM to fully load
document.addEventListener("DOMContentLoaded", () => {
  // Elements for Greeting Feature
  const greetBtn = document.getElementById("greet-btn");
  const userNameInput = document.getElementById("user-name");
  const greetingText = document.getElementById("greeting-text");

  // Elements for Dark Mode Feature
  const themeToggleBtn = document.getElementById("theme-toggle");
  const htmlElement = document.documentElement;

  // 1. Greeting Logic
  greetBtn.addEventListener("click", () => {
    const name = userNameInput.value.trim();

    if (name === "") {
      greetingText.textContent = "Please enter a valid name!";
      greetingText.style.color = "red";
    } else {
      greetingText.textContent = `Hello, ${name}! Welcome to your new site.`;
      greetingText.style.color = "var(--primary-color)";
      userNameInput.value = ""; // Clear input field
    }
  });

  // 2. Dark Mode Logic
  themeToggleBtn.addEventListener("click", () => {
    // Check current theme attribute
    const currentTheme = htmlElement.getAttribute("data-theme");

    if (currentTheme === "dark") {
      htmlElement.removeAttribute("data-theme");
    } else {
      htmlElement.setAttribute("data-theme", "dark");
    }
  });
});

// Initialize SortableJS on address list
const list = document.getElementById("addressList");
Sortable.create(list, {
  handle: ".drag-handle", // Restricts dragging to the icon
  animation: 150, // Smooth sliding animation speed (in ms)
  ghostClass: "sortable-ghost", // Class applied to the moving item
  onEnd: function (evt) {
    console.log("New order saved!");
    // Optional: Loop through items here to save the new sequence to a database
  },
});

// Handle Adding New Items
const addressInput = document.getElementById("addressBox");
const addBtn = document.getElementById("addressAddBtn");

addBtn.addEventListener("click", () => {
  const addressValue = addressInput.value.trim();
  if (addressValue === "") return;
  // Double check title and address here

  const li = document.createElement("li");
  li.className = "address-box";
  li.innerHTML = `
            <span class="drag-handle"><i class="fa-solid fa-bars"></i></span>
            <div class="address-subbox">
                <h3 class="address-title">DefautTitle</h3>
                <p class="address-detail">${addressValue}</p>
            </div>
            <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
    `;

  list.appendChild(li);
  addressInput.value = ""; // Clear input
});

// Handle Deleting Items (Event Delegation)
list.addEventListener("click", (e) => {
  // Check if clicked element or its parent is the delete button
  if (e.target.closest(".delete-btn")) {
    const itemToDelete = e.target.closest(".address-box");
    itemToDelete.remove();
  }
});
