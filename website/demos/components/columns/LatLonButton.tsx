export function LatLonButton({ country, onUpdate }) {
  const fetchLatLon = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_REACT_DB_LATLON_SEARCH_URL}${encodeURIComponent(country)}`
      );
      const data = await response.json();

      // Change this check to ensure data is not null and has latitude property
      if (data && data.latitude !== undefined) {
        const { latitude, longitude } = data;
        onUpdate(`${latitude}, ${longitude}`);
      } else {
        console.error('No results found for the specified country.');
      }
    } catch (error) {
      console.error('Failed to fetch latitude and longitude:', error);
    }
  };

  return (
    <button onClick={fetchLatLon} style={{ marginLeft: '10px' }}>
      Get Lat/Lon
    </button>
  );
}
