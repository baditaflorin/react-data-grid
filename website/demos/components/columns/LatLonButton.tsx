export function LatLonButton({ country, onUpdate }) {
  const fetchLatLon = async () => {
    try {
      const response = await fetch(
        `https://geo.geocode.okssh.com/?text=${encodeURIComponent(country)}&final=true&output=json`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { latitude, longitude } = data[0];
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
