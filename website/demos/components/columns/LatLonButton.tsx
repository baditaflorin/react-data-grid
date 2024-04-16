// export function LatLonButton({ country, onUpdate }) {
//   const fetchLatLon = async () => {
//     try {
//       const response = await fetch(
//         `${import.meta.env.VITE_REACT_DB_LATLON_SEARCH_URL}${encodeURIComponent(country)}`
//       );
//       const data = await response.json();

//       // Change this check to ensure data is not null and has latitude property
//       if (data && data.latitude !== undefined) {
//         const { latitude, longitude } = data;
//         onUpdate(`${latitude}, ${longitude}`);
//       } else {
//         console.error('No results found for the specified country.');
//       }
//     } catch (error) {
//       console.error('Failed to fetch latitude and longitude:', error);
//     }
//   };

//   return (
//     <button onClick={fetchLatLon} style={{ marginLeft: '10px' }}>
//       Get Lat/Lon
//     </button>
//   );
// }

export function LatLonButton({ country, onUpdate }) {
  const handleFetch = async () => {
    try {
      const { latitude, longitude } = await fetchCoordinates(country);
      onUpdate(`${latitude}, ${longitude}`);
    } catch (error) {
      console.error('Fetch failed:', error);
    }
  };

  return (
    <button onClick={handleFetch} style={{ marginLeft: '10px' }}>
      Get Lat/Lon
    </button>
  );
}

// Helper function to fetch latitude and longitude
export async function fetchCoordinates(country) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_REACT_DB_LATLON_SEARCH_URL}${encodeURIComponent(country)}`
    );
    const data = await response.json();
    if (data && data.latitude !== undefined) {
      return { latitude: data.latitude, longitude: data.longitude };
    }
    throw new Error('No results found for the specified country.');
  } catch (error) {
    console.error('Failed to fetch latitude and longitude:', error);
    throw error; // Re-throw to handle it in the calling function
  }
}

export function fetchLatLonForAll(rows, updateRow) {
  rows.forEach(row => {
    fetchLatLon(row.country).then(latLon => {
      updateRow(row.id, { latLon });
    }).catch(error => {
      console.error(`Failed to fetch lat/lon for row ${row.id}:`, error);
    });
  });
}