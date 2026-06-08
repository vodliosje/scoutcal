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

//Import out side funtion
import { saveToCloud, loadFromCloud } from "./interactFirebase.js";
import { getCoordinates, refreshMapWithFirebaseData } from "./interactmap.js";

// Evaluates the current DOM order and tags the first item
function updateTargetHighlight() {
  const boxes = addressList.querySelectorAll(".address-box");

  boxes.forEach((box, index) => {
    if (index === 0) {
      // It's the first item: assign target status
      box.classList.add("is-target");
      box.dataset.target = "true";
    } else {
      // Not the first item: strip target status
      box.classList.remove("is-target");
      box.dataset.target = "false";
    }
  });
}

// Renders the initial list from Firebase
function renderList(firebaseData) {
  addressList.innerHTML = "";

  firebaseData.forEach((item) => {
    const li = document.createElement("li");
    li.className = "address-box";
    li.dataset.lat = item.lat;
    li.dataset.lng = item.lng;
    li.innerHTML = `
    <span class="drag-handle"><i class="fa-solid fa-bars"></i></span>
    <div class="address-subbox">
        <h3 class="address-title">${item.name}</h3>
        <p class="address-detail">${item.address}</p>
    </div>
    <div class="btn-container">
        <button class="edit-btn"><i class="fa-solid fa-pen"></i></button>
        <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
    </div>
    `;
    addressList.appendChild(li);
  });

  // Run the highlight logic to catch the first item immediately on load
  updateTargetHighlight();
  refreshMapWithFirebaseData(firebaseData);
}

// Initialize SortableJS on address list
const list = document.getElementById("addressList");
Sortable.create(list, {
  handle: ".drag-handle", // Restricts dragging to the icon
  animation: 150, // Smooth sliding animation speed (in ms)
  ghostClass: "sortable-ghost", // Class applied to the moving item
  onEnd: function (evt) {
    updateTargetHighlight();
    saveToCloud();
    console.log("New order updated on Firebase!"); // Push order updates straight to the cloud when dragging stops
  },
});

//Link map with addressList activities
list.addEventListener("click", (event) => {
  const targetLi = event.target.closest("li");
  if (!targetLi) return;

  // 2. Read the coordinates from the data attributes
  const lat = parseFloat(targetLi.getAttribute("data-lat"));
  const lng = parseFloat(targetLi.getAttribute("data-lng"));

  // 3. Center the map to that coordinate
  if (!isNaN(lat) && !isNaN(lng)) {
    map.flyTo({
      center: [lng, lat],
      zoom: 13, // Zoom in tight on the clicked location
      essential: true, // Ensures smooth animation
    });
  }
});

// Handle Adding New Items
const titleInput = document.getElementById("addressTitle");
const addressInput = document.getElementById("addressBox");
const addBtn = document.getElementById("addressAddBtn");

addBtn.addEventListener("click", async () => {
  const titleValue = titleInput.value.trim();
  const addressValue = addressInput.value.trim();

  if (addressValue === "" || titleValue === "") return;

  const coordinates = await getCoordinates(addressValue);
  if (!coordinates) {
    alert(
      "Could not find coordinates for this address. Please check the spelling.",
    );
    return;
  }

  const li = document.createElement("li");
  li.className = "address-box";
  li.dataset.lat = coordinates.lat;
  li.dataset.lng = coordinates.lng;
  li.innerHTML = `
    <span class="drag-handle"><i class="fa-solid fa-bars"></i></span>
    <div class="address-subbox">
        <h3 class="address-title">${titleValue}</h3>
        <p class="address-detail">${addressValue}</p>
    </div>
    <div class="btn-container">
        <button class="edit-btn"><i class="fa-solid fa-pen"></i></button>
        <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
    </div>
    `;

  list.appendChild(li);
  saveToCloud();
  addressInput.value = "";
  titleInput.value = ""; // Clear input
});

// Handle Deleting Items (Event Delegation)
list.addEventListener("click", (e) => {
  // Check if clicked element or its parent is the delete button
  if (e.target.closest(".delete-btn")) {
    const itemToDelete = e.target.closest(".address-box");
    itemToDelete.remove();
    saveToCloud();
  }

  // --- HANDLE EDIT BUTTON CLICK ---
  const editBtn = e.target.closest(".edit-btn");
  if (editBtn) {
    const addressBox = editBtn.closest(".address-box");
    const titleEl = addressBox.querySelector(".address-title");
    const detailEl = addressBox.querySelector(".address-detail");
    const icon = editBtn.querySelector("i");

    // Check if we are currently editing or saving
    const isEditing = titleEl.getAttribute("contenteditable") === "true";

    if (!isEditing) {
      // SWITCH TO EDIT MODE
      titleEl.setAttribute("contenteditable", "true");
      detailEl.setAttribute("contenteditable", "true");
      detailEl.focus(); // Place the cursor inside the title instantly

      // Change icon to a checkmark/save icon
      icon.className = "fa-solid fa-check";
      editBtn.style.color = "#2ecc71"; // Turn icon green while saving
    } else {
      // SWITCH BACK TO VIEW MODE (SAVE)
      titleEl.removeAttribute("contenteditable");
      detailEl.removeAttribute("contenteditable");

      // Change icon back to a pen
      icon.className = "fa-solid fa-pen";
      editBtn.style.color = "#b89077"; // Reset back to blue

      saveToCloud();

      // Optional: Log or save data to your backend here
      console.log("Saved data:", {
        name: titleEl.innerText,
        address: detailEl.innerText,
      });
    }
  }
});

//----------------------------------------------------------
//----------------------------------------------------------

loadFromCloud(renderList);
