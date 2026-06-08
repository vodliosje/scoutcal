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
    checkAndInitLayers();
  };
  // Set the source
  image.src = "/images/map-point-svgrepo-com.svg";

  //Add target pin
  const targetImage = new Image();
  targetImage.onload = () => {
    map.addImage("target-marker", targetImage, { sdf: false });
    checkAndInitLayers();
  };
  targetImage.src = "/images/pin-svgrepo-com.svg";

  function checkAndInitLayers() {
    if (map.hasImage("custom-marker") && map.hasImage("target-marker")) {
      if (map.getSource("firebase-locations")) return; // Prevent double initialization

      map.addSource("firebase-locations", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "locations-layer",
        type: "symbol",
        source: "firebase-locations",
        layout: {
          // Mapbox Expression: If 'isTarget' is true, use 'target-marker', else use 'custom-marker'
          "icon-image": [
            "case",
            ["get", "isTarget"],
            "target-marker",
            "custom-marker",
          ],
          "icon-size": 0.05,
          "icon-anchor": "bottom",
          "icon-allow-overlap": true,
        },
        paint: {
          "icon-color": "#1e293b",
        },
      });
      console.log(
        "Map source and layers initialized with conditional markers!",
      );
    }
  }
});

// Initial popup near marker
const hoverPopup = new mapboxgl.Popup({
  closeButton: false, // Hide the close button for clean hover styling
  closeOnClick: false,
  offset: 15, // Offsets the popup slightly above your marker anchor
});

// Map zoom to marker when click
map.on("click", "locations-layer", (e) => {
  const coordinates = e.features[0].geometry.coordinates.slice();
  map.flyTo({
    center: coordinates,
    zoom: 14,
    essential: true,
  });
});

map.on("mouseenter", "locations-layer", (e) => {
  map.getCanvas().style.cursor = "default";

  const coordinates = e.features[0].geometry.coordinates.slice();
  const properties = e.features[0].properties;

  // Shorten Address
  const fullAddress = properties.address || "";
  const addressParts = fullAddress.split(",");
  const shortAddress =
    addressParts.length > 2
      ? `${addressParts[0]}, ${addressParts[1].trim()}`
      : fullAddress;

  const popupHtml = `
    <div style="padding: 3px; font-family: sans-serif;">
      <strong style="display: block; font-size: 14px; margin-bottom: 2px;">${properties.title}</strong>
      <span style="font-size: 12px; color: #64748b;">${shortAddress}</span>
    </div>
  `;

  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  // Populate the popup and attach it to the map at the marker's spot
  hoverPopup.setLngLat(coordinates).setHTML(popupHtml).addTo(map);
});
map.on("mouseleave", "locations-layer", () => {
  map.getCanvas().style.cursor = "";
  hoverPopup.remove();
});

// initialize a new marker
//  .setLngLat([-122.25948, 37.87221]) // Marker [lng, lat] coordinates
//  .addTo(map); // Add the marker to the map

window.addEventListener("load", () => {
  const autofillElement = document.querySelector("mapbox-address-autofill");
  autofillElement.accessToken = ACCESS_TOKEN;

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
    el.style.backgroundImage = 'url("/images/pin-svgrepo-com.svg")';
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

//Get coordinates but for 1 location
export async function getCoordinates(address) {
  // Ensure you have access to your token here (e.g., import.meta.env.VITE_MAPBOX_TOKEN)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${ACCESS_TOKEN}&limit=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Check if Mapbox found a match
    if (data.features && data.features.length > 0) {
      // Mapbox returns coordinates as an array: [longitude, latitude]
      const [lng, lat] = data.features[0].geometry.coordinates;

      // Return them as a labeled object so it is easy to use
      return { lat: lat, lng: lng };
    } else {
      console.warn("Could not geocode address:", address);
      return null;
    }
  } catch (error) {
    console.error("Network error while fetching coordinates:", error);
    return null;
  }
}

/* Process Firebase to GEOJson
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
}*/

// Update map with process list
export async function refreshMapWithFirebaseData(firebaseList) {
  //console.log("refreshMapWithFirebaseData");

  if (firebaseList.length > 0) {
    const firstLocation = firebaseList[0];
    map.setCenter([firstLocation.lng, firstLocation.lat]);
  }
  // 2. Convert to Mapbox FeatureCollection
  const geojsonData = {
    type: "FeatureCollection",
    features: firebaseList.map((item) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [item.lng, item.lat],
      },
      properties: {
        title: item.name,
        address: item.address,
        isTarget: item.isTarget,
      },
    })),
  };

  const attemptUpdate = () => {
    if (mapLoaded && window.map.getSource("firebase-locations")) {
      map.getSource("firebase-locations").setData(geojsonData);
      //console.log("Data successfully pushed to map.");
    } else {
      console.warn("Map not ready yet, retrying in 300ms...");
      setTimeout(attemptUpdate, 450); // Wait and try again
    }
  };
  attemptUpdate();
  //console.log(cleanData);
}

//Calculate ETA feature
export async function getDrivingETA(startLng, startLat, endLng, endLat) {
  // Mapbox Directions API requires coordinates in Longitude,Latitude order
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?access_token=${ACCESS_TOKEN}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const durationInSeconds = data.routes[0].duration;
      return formatDuration(durationInSeconds);
    } else {
      console.warn("No route found between these points.");
      return null;
    }
  } catch (error) {
    console.error("Failed to calculate ETA:", error);
    return null;
  }
}

// Helper function to turn seconds into text (e.g., "45 mins")
function formatDuration(seconds) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? "s" : ""}`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours} hr${hours !== 1 ? "s" : ""} ${remainingMins} min${remainingMins !== 1 ? "s" : ""}`;
  }
}
