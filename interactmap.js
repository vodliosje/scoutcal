const ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

let mapLoaded = false;
window.map = new mapboxgl.Map({
  accessToken: ACCESS_TOKEN,
  container: "map", // Container ID
  style: "mapbox://styles/mapbox/standard", // Map style to use
  center: [-122.25948, 37.87221], // Starting position [lng, lat]
  zoom: 12, // Starting zoom level
});

const map = window.map;
window.map.on("load", () => {
  mapLoaded = true;

  // Create an image element
  const image = new Image();
  image.onload = () => {
    // Add the image to the map
    map.addImage("custom-marker", image, { sdf: false });

    // Now add your source and layer
    map.addSource("firebase-locations", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    map.addLayer({
      id: "locations-layer",
      type: "symbol",
      source: "firebase-locations",
      layout: {
        "icon-image": "custom-marker",
        "icon-size": 0.05,
        "icon-anchor": "bottom",
        "icon-allow-overlap": true,
      },
      paint: {
        "icon-color": "#1e293b",
      },
    });
    console.log("Map source initialized!");
  };
  // Set the source
  image.src = "/public/images/map-point-svgrepo-com.svg";
});

map.on("click", "locations-layer", (e) => {
  // 1. Get the clicked feature's coordinates from the event
  const coordinates = e.features[0].geometry.coordinates.slice();

  // 2. Center the map on those coordinates
  map.flyTo({
    center: coordinates,
    zoom: 14, // Zoom in closer on the specific point
    essential: true,
  });
});

map.on("mouseenter", "locations-layer", () => {
  map.getCanvas().style.cursor = "default";
});
map.on("mouseleave", "locations-layer", () => {
  map.getCanvas().style.cursor = "";
});

// initialize a new marker
//  .setLngLat([-122.25948, 37.87221]) // Marker [lng, lat] coordinates
//  .addTo(map); // Add the marker to the map

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

    // Add marker
    const el = document.createElement("div");
    el.className = "custom-marker"; // For CSS styling
    el.style.width = "40px"; // Adjust size
    el.style.height = "40px";
    el.style.backgroundSize = "100%";
    el.style.backgroundImage = 'url("/public/images/pin-svgrepo-com.svg")';
    // Add this if you want the "foot" to be on the point
    el.style.backgroundPosition = "center bottom";

    if (window.currentMarker) {
      window.currentMarker.remove();
    }

    window.currentMarker = new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
    })
      .setLngLat(coordinates)
      .addTo(map);

    map.flyTo({ center: coordinates, zoom: 13 });

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

    // Run loop for street formatting ---
    for (const [fullName, shortName] of Object.entries(streetReplacements)) {
      const regex = new RegExp(fullName, "gi");
      shortStreet = shortStreet.replace(regex, shortName);
    }

    // Run loop for state formatting ---
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

// Convert address to coordinates
async function getCoordinates(address) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${ACCESS_TOKEN}&limit=1`;

  const response = await fetch(url);
  const data = await response.json();

  //console.log("getCoordinates");

  // Check if we found a match
  if (data.features && data.features.length > 0) {
    return data.features[0].geometry.coordinates; // Returns [lng, lat]
  } else {
    console.warn("Could not geocode address:", address);
    return null;
  }
}

// Process Firebase to GEOJson
async function processFirebaseList(firebaseList) {
  // Map every item to a promise that fetches coordinates
  const promises = firebaseList.map(async (item) => {
    const coords = await getCoordinates(item.address);
    return {
      ...item,
      lng: coords ? coords[0] : null,
      lat: coords ? coords[1] : null,
    };
  });

  // Wait for all requests to finish
  const processedList = await Promise.all(promises);

  //console.log("processFirebaseList");

  // Filter out items that couldn't be geocoded
  return processedList.filter((item) => item.lng !== null);
}

// Update map with process list
export async function refreshMapWithFirebaseData(firebaseList) {
  const cleanData = await processFirebaseList(firebaseList);

  //console.log("refreshMapWithFirebaseData");

  if (cleanData.length > 0) {
    const firstLocation = cleanData[0]; // Get the first item

    // Center the map on that location
    map.setCenter([firstLocation.lng, firstLocation.lat]);
  }
  // 2. Convert to Mapbox FeatureCollection
  const geojsonData = {
    type: "FeatureCollection",
    features: cleanData.map((item) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [item.lng, item.lat],
      },
      properties: {
        title: item.name,
        address: item.address,
      },
    })),
  };

  const attemptUpdate = () => {
    if (mapLoaded && window.map.getSource("firebase-locations")) {
      map.getSource("firebase-locations").setData(geojsonData);
      //console.log("Data successfully pushed to map.");
    } else {
      console.warn("Map not ready yet, retrying in 300ms...");
      setTimeout(attemptUpdate, 300); // Wait and try again
    }
  };
  attemptUpdate();
  //console.log(cleanData);
  return cleanData;
}
