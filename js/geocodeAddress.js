export async function geocodeAddress(q, key, map, results, input) {
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${key}&limit=5`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`MapTiler ${resp.status}`);
    const json = await resp.json();
    const feats = json.features || [];
    if (!feats.length) { results.style.display='none'; return; }
  
    results.innerHTML = '';
    feats.forEach(f => {
      const label = f.place_name;
      const [lon,lat] = f.geometry.coordinates;
      const div = document.createElement('div');
      div.textContent = label;
      div.style.padding = '0.3rem';
      div.style.cursor  = 'pointer';
      div.onclick = () => {
        map.setView([lat,lon],14);
        L.popup().setLatLng([lat,lon])
          .setContent(`<strong>Address:</strong><br>${label}`)
          .openOn(map);
        input.value = label;
        results.style.display = 'none';
      };
      results.appendChild(div);
    });
    results.style.display = 'block';
  }
  