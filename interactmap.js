const ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  accessToken: ACCESS_TOKEN,
  container: "map", // Container ID
  style: "mapbox://styles/mapbox/standard", // Map style to use
  center: [-122.25948, 37.87221], // Starting position [lng, lat]
  zoom: 13, // Starting zoom level
});

const marker = new mapboxgl.Marker() // initialize a new marker
  .setLngLat([-122.25948, 37.87221]) // Marker [lng, lat] coordinates
  .addTo(map); // Add the marker to the map

window.addEventListener("load", () => {
  // 2. Give the Autofill wrapper your access token
  const autofillElement = document.querySelector("mapbox-address-autofill");
  autofillElement.accessToken = ACCESS_TOKEN;

  // 3. Listen for when the user clicks an address from the dropdown
  autofillElement.addEventListener("retrieve", (event) => {
    // Mapbox returns the selected feature data
    const feature = event.detail.features[0];

    // Extract the exact coordinates and full address text
    const coordinates = feature.geometry.coordinates;
    const props = feature.properties;

    // Move the map and marker to the new address
    map.flyTo({ center: coordinates, zoom: 14 });
    marker.setLngLat(coordinates);

    // --- FIX 1: Extract variables using Mapbox Autofill's standard properties ---
    let shortStreet = props.address_line1 || props.name || "";
    const city = props.address_level2 || props.place || "";
    let state = props.address_level1 || props.state_code || props.state || "";
    const zipCode = props.postal_code || props.postcode || "";

    // Dictionary maps for matching full words precisely
    const stateReplacements = {
      "\\bCalifornia\\b": "CA",
      "\\bIowa\\b": "IA",
      "\\bLouisiana\\b": "LA",
      "\\bNew York\\b": "NY",
      "\\bTexas\\b": "TX",
    };

    const streetReplacements = {
      "\\bRoad\\b": "Rd",
      "\\bAvenue\\b": "Ave",
      "\\bStreet\\b": "St",
      "\\bBoulevard\\b": "Blvd",
      "\\bDrive\\b": "Dr",
      "\\bCourt\\b": "Ct",
    };

    // --- FIX 2: Run loop for street formatting ---
    for (const [fullName, shortName] of Object.entries(streetReplacements)) {
      const regex = new RegExp(fullName, "gi");
      shortStreet = shortStreet.replace(regex, shortName);
    }

    // --- FIX 3: Run loop for state formatting ---
    for (const [fullState, shortState] of Object.entries(stateReplacements)) {
      const regex = new RegExp(fullState, "gi");
      state = state.replace(regex, shortState);
    }

    // Build the short address layout format string
    const shortAddress = `${shortStreet}, ${city}, ${state} ${zipCode}`.trim();

    // Access your input directly via its ID and assign the clean text value
    const addressInput = document.getElementById("addressBox");
    if (addressInput) {
      addressInput.value = shortAddress;
      console.log("Input text successfully set to:", addressInput.value);
    } else {
      console.error("Could not find element with ID 'addressBox'");
    }
  });
});
