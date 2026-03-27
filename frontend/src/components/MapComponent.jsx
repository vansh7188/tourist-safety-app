import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  Marker,
  Polyline,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "12px",
  position: "relative",
};

const MapComponent = ({ setStartLocation, setCurrentLocation }) => {
  const [map, setMap] = useState(null);
  const [startCoords, setStartCoords] = useState(null);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [path, setPath] = useState([]);

  const parseLocationDetails = (result, lat, lon) => {
    const components = result?.address_components || [];
    const getComp = (type) =>
      components.find((c) => c.types.includes(type))?.long_name || "N/A";

    return {
      displayName: result?.formatted_address || "Unknown",
      placeId: result?.place_id || "N/A",
      latitude: lat,
      longitude: lon,
      class: "place",
      type: result?.types?.[0] || "N/A",
      state: getComp("administrative_area_level_1"),
      district:
        getComp("administrative_area_level_2") ||
        getComp("administrative_area_level_3") ||
        "N/A",
      city:
        getComp("locality") ||
        getComp("sublocality") ||
        getComp("administrative_area_level_3") ||
        "N/A",
      postcode: getComp("postal_code") || "N/A",
    };
  };

  const fetchLocationDetails = async (lat, lon, isStart = false) => {
    let details = null;

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`
        );
        const data = await res.json();

        if (data.status === "OK" && data.results?.[0]) {
          details = parseLocationDetails(data.results[0], lat, lon);
        } else {
          console.warn("Geocode API response:", data.status, data.error_message);
        }
      }
    } catch (err) {
      console.error("Error fetching location details:", err);
    }

    if (!details && window.google?.maps?.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const geocodeResult = await new Promise((resolve, reject) => {
          geocoder.geocode(
            { location: { lat, lng: lon } },
            (results, status) => {
              if (status === "OK" && results?.[0]) {
                resolve(results[0]);
              } else {
                reject(new Error(`Geocoder failed: ${status}`));
              }
            }
          );
        });
        details = parseLocationDetails(geocodeResult, lat, lon);
      } catch (err) {
        console.error("Geocoder JS API error:", err);
      }
    }

    if (details) {
      if (isStart) setStartLocation(details);
      else setCurrentLocation(details);
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (!startCoords) {
          setStartCoords({ lat: latitude, lng: longitude });
          fetchLocationDetails(latitude, longitude, true);
        }

        setCurrentCoords({ lat: latitude, lng: longitude });
        setPath([
          startCoords || { lat: latitude, lng: longitude },
          { lat: latitude, lng: longitude },
        ]);

        fetchLocationDetails(latitude, longitude, false);

        if (map) {
          map.panTo({ lat: latitude, lng: longitude });
        }
      },
      (error) => console.error("Geolocation error:", error),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [map, startCoords]);

  const handleRecenter = () => {
    if (currentCoords && map) {
      map.panTo(currentCoords);
      map.setZoom(16);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "500px" }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentCoords || { lat: 28.6139, lng: 77.209 }}
        zoom={16}
        onLoad={(mapInstance) => setMap(mapInstance)}
      >
        {startCoords && (
          <Marker
            position={startCoords}
            icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
          />
        )}
        {currentCoords && (
          <Marker
            position={currentCoords}
            icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
          />
        )}
        {path.length >= 2 && (
          <Polyline
            path={path}
            options={{ strokeColor: "blue", strokeWeight: 4, opacity: 0.7 }}
          />
        )}
      </GoogleMap>

      {/* Bottom-left Re-center Button */}
      <button
        onClick={handleRecenter}
        style={{
          position: "absolute",
          bottom: "66px",
          left: "20px",
          zIndex: 9999,
          padding: "10px 16px",
          border: "none",
          borderRadius: "20px",
          background: "#007bff",
          color: "#fff",
          cursor: "pointer",
          fontWeight: "bold",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        }}
      >
        Re-center
      </button>
    </div>
  );
};

export default MapComponent;

