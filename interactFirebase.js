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

// Save data to firebase
export function saveToCloud() {
  const addresses = [];
  const addressList = document.getElementById("addressList");
  const boxes = addressList.querySelectorAll(".address-box");

  boxes.forEach((box, index) => {
    const title = box.querySelector(".address-title").innerText;
    const detail = box.querySelector(".address-detail").innerText;

    addresses.push({
      name: title,
      address: detail,
      isTarget: index === 0, // true for the first item, false for all others
    });
  });

  // Save the array straight to your cloud document
  docRef
    .set({ list: addresses })
    .then(() => console.log("Cloud database successfully updated!"))
    .catch((error) => console.error("Error writing document: ", error));
}

// Load data from firebase
export function loadFromCloud(renderCallback) {
  docRef
    .get()
    .then((doc) => {
      if (doc.exists) {
        const addresses = doc.data();
        renderCallback(addresses.list || []);

        console.log("Fresh list synchronized from cloud.");
      } else {
        console.log("No cloud data found yet. Creating clean slate.");
        renderCallback([]);
      }
    })
    .catch((error) => {
      console.error("Error getting cloud document:", error);
    });
}
