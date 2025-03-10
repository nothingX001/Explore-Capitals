<?php
// world-map.php
$data = file_get_contents('http://localhost/fetch-country-data.php?type=map');
$locations = json_decode($data, true);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, viewport-fit=cover">
  <meta name="description" content="Explore capitals of countries, territories, and more with our interactive world map!">
  <meta name="keywords" content="world map, country capitals, geography, interactive map, world geography, country information">
  <meta name="author" content="ExploreCapitals">
  <meta property="og:title" content="World Map | ExploreCapitals">
  <meta property="og:description" content="Explore capitals of countries, territories, and more with our interactive world map!">
  <meta property="og:type" content="website">
  <meta property="og:image" content="images/explore-capitals-logo.jpg">
  <title>World Map | ExploreCapitals</title>
  <link rel="icon" type="image/jpeg" href="images/explore-capitals-logo.jpg">
  <link rel="stylesheet" href="styles.css">
  <link href="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css" rel="stylesheet">
  <style>
    #map {
      height: 500px;
      width: 100%;
      border-radius: 15px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <?php include 'navbar.php'; ?>

  <section class="page-content world-map" id="main-world-map">
    <h1>World Map</h1>
    <p>Explore countries and their capitals around the world.</p>
    <div class="search-bar-container">
      <input type="text" id="search-bar" name="country" placeholder="Search for a country..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
    </div>
    <div id="map"></div>
  </section>

  <script src="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js"></script>
  <script src="map-autocomplete.js"></script>
  <script>
    mapboxgl.accessToken = 'pk.eyJ1IjoiZGNobzIwMDEiLCJhIjoiY20yYW04bHdtMGl3YjJyb214YXB5dzBtbSJ9.Zs-Gl2JsEgUrU3qTi4gy4w';
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [0, 20],
      zoom: 1.5,
      projection: 'globe',
      maxBounds: [[-180, -90], [180, 90]]
    });
    map.on('style.load', () => {
      map.setFog({
        range: [0.5, 10],
        color: 'rgba(135, 206, 235, 0.15)',
        "high-color": 'rgba(255, 255, 255, 0.1)',
        "space-color": 'rgba(0, 0, 0, 1)',
        "horizon-blend": 0.1,
        "star-intensity": 0.1
      });
    });
    map.on('error', (e) => {
      console.error('Map error:', e.error);
      alert('Failed to load the map. Please check the console for details.');
    });

    const locations = <?php echo json_encode($locations); ?>;
    
    const searchBar = document.getElementById('search-bar');
    searchBar.addEventListener('input', function() {
      const query = this.value.toLowerCase().trim();
      if (!query) return;
      // Only check for an exact match
      const matchCountry = locations.find(loc =>
        loc.country_name && loc.country_name.toLowerCase() === query
      );
      if (matchCountry && matchCountry.latitude && matchCountry.longitude) {
        const lng = parseFloat(matchCountry.longitude);
        const lat = parseFloat(matchCountry.latitude);
        let zoomLevel = 3;
        if (matchCountry.min_lat && matchCountry.max_lat && 
            matchCountry.min_lng && matchCountry.max_lng) {
          const latDiff = Math.abs(matchCountry.max_lat - matchCountry.min_lat);
          const lngDiff = Math.abs(matchCountry.max_lng - matchCountry.min_lng);
          const maxDiff = Math.max(latDiff, lngDiff);
          if (maxDiff < 0.5) { 
            zoomLevel = 8;
          } else if (maxDiff < 1) {
            zoomLevel = 7;
          } else if (maxDiff < 2) {
            zoomLevel = 6;
          } else if (maxDiff < 5) {
            zoomLevel = 5;
          } else if (maxDiff < 10) {
            zoomLevel = 4;
          } else if (maxDiff < 20) {
            zoomLevel = 3;
          } else {
            zoomLevel = 2;
          }
        }
        map.flyTo({ 
          center: [lng, lat], 
          zoom: zoomLevel,
          duration: 2000,
          essential: true
        });
      }
    });
  </script>
</body>
</html>


