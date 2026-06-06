const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const docRef = db.collection("appData").doc("my-addresses");

console.log(
  "Testing config project ID:",
  import.meta.env.VITE_FIREBASE_PROJECT_ID,
);

// Save data to firebase
export function saveToCloud() {
  const addresses = [];
  const boxes = addressList.querySelectorAll(".address-box");

  boxes.forEach((box) => {
    const title = box.querySelector(".address-title").innerText;
    const detail = box.querySelector(".address-detail").innerText;
    addresses.push({ name: title, address: detail });
  });

  // Save the array straight to your cloud document
  docRef
    .set({ list: addresses })
    .then(() => console.log("Cloud database successfully updated!"))
    .catch((error) => console.error("Error writing document: ", error));
}

// Load data from firebase
function loadFromCloud() {
  docRef
    .get()
    .then((doc) => {
      if (doc.exists) {
        const addresses = doc.data().list || [];

        // Clear current list layout
        addressList.innerHTML = "";

        // Build list items out from the cloud array data
        addresses.forEach((item) => {
          const li = document.createElement("li");
          li.className = "address-box";
          li.innerHTML = `
                    <span class="drag-handle"><i class="fa-solid fa-bars"></i></span>
                    <div class="address-subbox">
                        <h3 class="address-title">${item.name}</h3>
                        <p class="address-detail">${item.address}</p>
                    </div>
                    <div class="action-btns">
                        <button class="edit-btn"><i class="fa-solid fa-pen"></i></button>
                        <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
          addressList.appendChild(li);
        });
        console.log("Fresh list synchronized from cloud.");
      } else {
        console.log("No cloud data found yet. Creating clean slate.");
      }
    })
    .catch((error) => {
      console.error("Error getting cloud document:", error);
    });
}

// Fetch cross-device data instantly when the application boots up
loadFromCloud();
