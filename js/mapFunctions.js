const sources = {
    county1: {
        kml: 'https://cdn.jsdelivr.net/gh/miphrae/tara_website@v1.0.0/borders_livermore.kml',
        csv: 'https://cdn.jsdelivr.net/gh/miphrae/tara_website@v1.0.0/points_livermore.csv'
    },
    county2: {
        kml: 'https://cdn.jsdelivr.net/gh/miphrae/tara_website@v1.0.0/borders_pleasanton.kml',
        csv: 'https://cdn.jsdelivr.net/gh/miphrae/tara_website@v1.0.0/points_pleasanton.csv'
    },
    county3: {
        kml: 'https://cdn.jsdelivr.net/gh/miphrae/tara_website@v1.0.0/borders.kml',
        csv: 'https://cdn.jsdelivr.net/gh/miphrae/tara_website@v1.0.0/points.csv'
    }
};

function makePinIcon(color) {
    return L.divIcon({
        html: `
        <svg width="24" height="36" viewBox="0 0 24 36">
          <path
            d="M12 0C7.038 0 3 4.038 3 9
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

async function loadCounty(id, map, markerCluster, lookup, sidebar, iconBlue, iconRed) {
    // clear old
    if (map._borders) { map.removeLayer(map._borders); map._borders = null; }
    markerCluster.clearLayers();
    lookup.length = 0;
    sidebar.innerHTML = `<p><em>Click a marker on the map → its name will go here.</em></p>`;

    // 1) load KML borders
    map._borders = await new Promise(res => {
        omnivore.kml(sources[id].kml, null, L.geoJson(null, {
            style: { color: '#0074D9', weight: 2, opacity: 0.8 }
        }))
            .on('ready', function () {
                this.addTo(map);
                map.fitBounds(this.getBounds());
                res(this);
            });
    });

    // 2) load CSV points
    const txt = await fetch(sources[id].csv).then(r => r.text());
    const rows = Papa.parse(txt, { header: true }).data;
    for (let row of rows) {
        if (!row.LAT || !row.LON) continue;
        const name = row['Organization Name_CLEAN'];
        const coord = [+row.LAT, +row.LON];
        const isMulti = (row.isMultiple || '').toLowerCase() === 'multiple spaces';
        const icon = isMulti ? iconRed : iconBlue;
        const m = L.marker(coord, { title: name, icon })
            .bindPopup(`<strong>${name}</strong><br>${row.Address}`)
            .on('click', () => {
                sidebar.innerHTML = `<h4>${name}</h4><p>${row.Address}</p>`;
            });
        markerCluster.addLayer(m);
        lookup.push({ name, marker: m });
    }
    map.addLayer(markerCluster);
}

function attachSearchLogic(map, lookup, input, toggle, results, sidebar, maptiler_key) {
    // toggle open/close
    toggle.addEventListener('click', () => {
        const open = input.style.opacity === '1';
        if (!open) {
            input.style.width = '200px'; input.style.opacity = '1'; input.focus();
        } else {
            input.style.width = '0'; input.style.opacity = '0'; results.style.display = 'none';
        }
    });

    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        results.innerHTML = '';
        if (!q) { results.style.display = 'none'; return; }

        // 1) local org search
        const orgs = lookup
            .filter(o => o.name.toLowerCase().includes(q))
            .slice(0, 10);
        if (orgs.length) {
            orgs.forEach(o => {
                const d = document.createElement('div');
                d.textContent = o.name;
                d.style.padding = '0.3rem'; d.style.cursor = 'pointer';
                d.addEventListener('click', () => {
                    map.setView(o.marker.getLatLng(), 14);
                    o.marker.openPopup();
                    input.value = o.name;
                    results.style.display = 'none';
                });
                results.appendChild(d);
            });
            return results.style.display = 'block';
        }

        // 2) fallback: MapTiler Geocoding
        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${maptiler_key}&limit=5`;
        fetch(url)
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(json => {
                const feats = json.features || [];
                if (!feats.length) return results.style.display = 'none';
                feats.forEach(f => {
                    const label = f.place_name;
                    const [lon, lat] = f.geometry.coordinates;
                    const d = document.createElement('div');
                    d.textContent = label;
                    d.style.padding = '0.3rem'; d.style.cursor = 'pointer';
                    d.addEventListener('click', () => {
                        map.setView([lat, lon], 14);
                        L.popup()
                            .setLatLng([lat, lon])
                            .setContent(`<strong>Address:</strong><br>${label}`)
                            .openOn(map);
                        input.value = label;
                        results.style.display = 'none';
                    });
                    results.appendChild(d);
                });
                results.style.display = 'block';
            })
            .catch(err => {
                console.error('geocode error', err);
                results.style.display = 'none';
            });
    });

    document.addEventListener('click', e => {
        if (!input.contains(e.target) && !toggle.contains(e.target)) {
            results.style.display = 'none';
        }
    });
}
