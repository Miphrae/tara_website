document.addEventListener('DOMContentLoaded', () => {
  //Basemap layers
  const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  });
  // ESRI satellite layer (example)
  const esriSat = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/' +
    'World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Tiles &copy; Esri' }
  );

  // initialize map
  const map = L.map('map', { layers: [osmStandard] }).setView([37.5, -119.5], 6);

  // UI refs
  const tabs = document.querySelectorAll('#county-tabs button');
  const toggle = document.getElementById('search-toggle');
  const input = document.getElementById('org-search');
  const results = document.getElementById('search-results');
  const sidebar = document.getElementById('sidebar');

  // Data sources per county
  // const sources = {
  //   county1: { kml: '/borders_livermore.kml', csv: '/points_livermore.csv' },
  //   county2: { kml: '/borders_pleasanton.kml', csv: '/points_pleasanton.csv' },
  //   county3: { kml: '/borders.kml', csv: '/points.csv' }
  // };
  const sources = {
    county1: { kml: 'https://miphrae.github.io/tara_website/borders_livermore.kml', csv: 'https://miphrae.github.io/tara_website/points_livermore.csv' },
    county2: { kml: 'https://miphrae.github.io/tara_website/borders_pleasanton.kml', csv: 'https://miphrae.github.io/tara_website/points_pleasanton.csv' },
    county3: { kml: 'https://miphrae.github.io/tara_website/borders.kml', csv: 'https://miphrae.github.io/tara_website/points.csv' }
  };

  let borderLayer = null;
  let markerCluster = L.markerClusterGroup();
  let lookup = [];


  // SVG pin factory with color param
  function makePinIcon(color) {
    return L.divIcon({
      html: `
        <svg width="24" height="36" viewBox="0 0 24 36">
          <path d="M12 0C7.038 0 3 4.038 3 9
                   c0 7.5 9 27 9 27s9-19.5 9-27
                   C21 4.038 16.962 0 12 0z"
                fill="${color}"/>
          <circle cx="12" cy="9" r="3" fill="#fff"/>
        </svg>`,
      className: '',
      iconSize: [24, 36],
      iconAnchor: [12, 36],
      popupAnchor: [0, -36]
    });
  }
  const iconBlue = makePinIcon('#0074D9');
  const iconRed = makePinIcon('#FF4136');

  // Load a county KML + CSV
  async function loadCounty(id) {
    // clear previous
    if (borderLayer) map.removeLayer(borderLayer);
    markerCluster.clearLayers();
    lookup = [];
    sidebar.innerHTML = `<p><em>Click a marker on the map → its name will go here.</em></p>`;

    // Load borders
    borderLayer = await new Promise(resolve => {
      omnivore.kml(sources[id].kml, null, L.geoJson(null, {
        style: { color: '#0074D9', weight: 2, opacity: 0.8 }
      }))
        .on('ready', function () {
          map.fitBounds(this.getBounds());
          this.addTo(map);
          resolve(this);
        });
    });

    // Load points
    const text = await fetch(sources[id].csv).then(r => r.text());
    const rows = Papa.parse(text, { header: true }).data;
    for (let row of rows) {
      if (!row.LAT || !row.LON) continue;
      const name = row['Organization Name_CLEAN'];
      const coord = [+row.LAT, +row.LON];
      // check isMultiple
      const isMulti = (row.isMultiple || '').toLowerCase() === 'multiple spaces';
      const icon = isMulti ? iconRed : iconBlue;

      const marker = L.marker(coord, { title: name, icon });
      marker.bindPopup(`<strong>${name}</strong><br>${row.Address}`);
      marker.on('click', () => {
        sidebar.innerHTML = `<h4>${name}</h4><p>${row.Address}</p>`;
      });

      markerCluster.addLayer(marker);
      lookup.push({ name, marker });
    }
    map.addLayer(markerCluster);
  }

  // Tab click handlers
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadCounty(btn.dataset.county);
    });
  });

  loadCounty('county1');

  // Search toggle
  toggle.addEventListener('click', () => {
    const open = input.style.opacity === '1';
    if (!open) {
      input.style.width = '200px';
      input.style.opacity = '1';
      input.focus();
    } else {
      input.style.width = '0';
      input.style.opacity = '0';
      results.style.display = 'none';
    }
  });

  // Search logic 
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    results.innerHTML = '';
    if (!q) { results.style.display = 'none'; return; }

    // 1) Local marker search
    let matches = lookup
      .filter(o =>
        o.name.toLowerCase().includes(q) ||
        o.marker.getPopup().getContent().toLowerCase().includes(q)
      )
      .slice(0, 10);

    if (matches.length) {
      matches.forEach(o => {
        const div = document.createElement('div');
        div.textContent = o.name;
        div.onclick = () => {
          map.setView(o.marker.getLatLng(), 14);
          o.marker.openPopup();
          results.style.display = 'none';
          input.value = o.name;
        };
        results.appendChild(div);
      });
      results.style.display = 'block';
    } else {
      // 2) Fallback to global address lookup via Nominatim
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`)
        .then(res => res.json())
        .then(data => {
          if (!data.length) { results.style.display = 'none'; return; }
          data.slice(0, 5).forEach(item => {
            const div = document.createElement('div');
            div.textContent = item.display_name;
            div.onclick = () => {
              const lat = parseFloat(item.lat), lon = parseFloat(item.lon);
              map.setView([lat, lon], 14);
              L.popup()
                .setLatLng([lat, lon])
                .setContent(`<strong>Address:</strong><br>${item.display_name}`)
                .openOn(map);
              results.style.display = 'none';
              input.value = item.display_name;
            };
            results.appendChild(div);
          });
          results.style.display = 'block';
        })
        .catch(err => {
          console.error(err);
          results.style.display = 'none';
        });
    }
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !toggle.contains(e.target)) {
      results.style.display = 'none';
    }
  });

  // --- To switch to satellite basemap on demand: ---
  map.addLayer(esriSat);        // add satellite
  map.removeLayer(osmStandard); // remove street
});
