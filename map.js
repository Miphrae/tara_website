// map.js
document.addEventListener('DOMContentLoaded', () => {
  console.log("map.js loaded — DOM ready");

  const map = L.map('map').setView([37.5, -119.5], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const markers = L.markerClusterGroup();
  const lookup = [];

  const borderPalette = [
    '#1f77b4', // blue
    '#ff7f0e', // orange
    '#2ca02c', // green
    '#d62728', // red
    '#9467bd', // purple
    '#8c564b', // brown
    '#e377c2', // pink
    '#7f7f7f', // gray
    '#bcbd22', // lime
    '#17becf'  // cyan
  ];
  let paletteIndex = 0;
  const nameToColor = {};

  omnivore.kml('/borders.kml', null, L.geoJson(null, {
    style: feature => {
      const key = feature.properties.name
        || feature.properties.Name
        || feature.properties.NAME
        || String(paletteIndex);
      if (!nameToColor[key]) {
        nameToColor[key] = borderPalette[paletteIndex % borderPalette.length];
        paletteIndex++;
      }
      return {
        color: nameToColor[key],
        weight: 2,
        opacity: 0.8
      };
    }
  }))
    .on('ready', function () {
      this.addTo(map);
      map.fitBounds(this.getBounds());
    });

  function makePinIcon(color) {
    return L.divIcon({
      className: '',
      html: `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
            <path
              d="M12 0C7.038 0 3 4.038 3 9
                 c0 7.5 9 27 9 27s9-19.5 9-27
                 C21 4.038 16.962 0 12 0z"
              fill="${color}"
            />
            <circle cx="12" cy="9" r="3" fill="#fff"/>
          </svg>`,
      iconSize: [24, 36],
      iconAnchor: [12, 36],
      popupAnchor: [0, -36],
    });
  }
  const iconSingle = makePinIcon('#0074D9');
  const iconMultiple = makePinIcon('#FF4136');

  const toggle = document.getElementById('search-toggle');
  const input = document.getElementById('org-search');
  const results = document.getElementById('search-results');

  toggle.addEventListener('click', () => {
    const showing = input.style.opacity === '1';
    if (!showing) {
      // expand
      input.style.width = '200px';
      input.style.opacity = '1';
      input.focus();
    } else {
      // collapse
      input.style.width = '0';
      input.style.opacity = '0';
      results.style.display = 'none';
    }
  });

  fetch('/points.csv')
    .then(res => res.text())
    .then(text => Papa.parse(text, { header: true }).data)
    .then(rows => {
      rows.forEach(row => {
        if (!row.LAT || !row.LON) return;
        const name = row['Organization Name_CLEAN'];
        const coord = [+row.LAT, +row.LON];
        const isMulti = (row.isMultiple || '').toLowerCase() === 'multiple spaces';
        const icon = isMulti ? iconMultiple : iconSingle;

        const marker = L.marker(coord, { title: name, icon });
        marker.bindPopup(`<strong>${name}</strong><br>${row.Address}`);
        marker.on('click', () => {
          document.getElementById('sidebar').innerHTML =
            `<h4>${name}</h4><p>${row.Address}</p>`;
        });

        markers.addLayer(marker);
        lookup.push({ name, marker });
      });

      map.addLayer(markers);

      const input = document.getElementById('org-search');
      const results = document.getElementById('search-results');

      input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        results.innerHTML = '';
        if (!q) {
          results.style.display = 'none';
          return;
        }
        const matches = lookup
          .filter(o => o.name.toLowerCase().includes(q))
          .slice(0, 10);

        if (matches.length) {
          matches.forEach(o => {
            const div = document.createElement('div');
            div.textContent = o.name;
            div.style.padding = '0.3rem'; div.style.cursor = 'pointer';
            div.addEventListener('mouseover', () => div.style.background = '#f0f0f0');
            div.addEventListener('mouseout', () => div.style.background = '');
            div.addEventListener('click', () => {
              map.setView(o.marker.getLatLng(), 14);
              o.marker.openPopup();
              results.style.display = 'none';
              input.value = o.name;
            });
            results.appendChild(div);
          });
          results.style.display = 'block';
        } else {
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`)
            .then(res => res.json())
            .then(data => {
              if (!data.length) { results.style.display = 'none'; return; }
              data.slice(0, 5).forEach(item => {
                const div = document.createElement('div');
                div.textContent = item.display_name;
                div.style.padding = '0.3rem'; div.style.cursor = 'pointer';
                div.addEventListener('mouseover', () => div.style.background = '#f0f0f0');
                div.addEventListener('mouseout', () => div.style.background = '');
                div.addEventListener('click', () => {
                  const lat = parseFloat(item.lat), lon = parseFloat(item.lon);
                  map.setView([lat, lon], 14);
                  L.popup()
                    .setLatLng([lat, lon])
                    .setContent(`<strong>Address:</strong><br>${item.display_name}`)
                    .openOn(map);
                  results.style.display = 'none';
                  input.value = item.display_name;
                });
                results.appendChild(div);
              });
              results.style.display = 'block';
            })
            .catch(err => console.error(err));
        }
      });

      document.addEventListener('click', e => {
        if (!input.contains(e.target)) {
          results.style.display = 'none';
        }
      });
    })
    .catch(console.error);
});
