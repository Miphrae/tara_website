function attachSearchLogic(map, lookup, input, toggle, results, sidebar, maptiler_key) {
    // toggle open/close
    toggle.addEventListener('click', ()=>{
      const open = input.style.opacity === '1';
      if (!open) {
        input.style.width='200px'; input.style.opacity='1'; input.focus();
      } else {
        input.style.width='0'; input.style.opacity='0'; results.style.display='none';
      }
    });
  
    input.addEventListener('input', ()=>{
      const q = input.value.trim().toLowerCase();
      results.innerHTML = '';
      if (!q) { results.style.display='none'; return; }
  
      // 1) local org search
      const orgs = lookup
        .filter(o=>o.name.toLowerCase().includes(q))
        .slice(0,10);
      if (orgs.length) {
        orgs.forEach(o=>{
          const d=document.createElement('div');
          d.textContent = o.name;
          d.style.padding='0.3rem'; d.style.cursor='pointer';
          d.addEventListener('click', ()=>{
            map.setView(o.marker.getLatLng(),14);
            o.marker.openPopup();
            input.value = o.name;
            results.style.display='none';
          });
          results.appendChild(d);
        });
        return results.style.display='block';
      }
  
      // 2) fallback: MapTiler Geocoding
      const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${maptiler_key}&limit=5`;
      fetch(url)
        .then(r=> r.ok? r.json(): Promise.reject(r.status))
        .then(json=>{
          const feats = json.features||[];
          if (!feats.length) return results.style.display='none';
          feats.forEach(f=>{
            const label = f.place_name;
            const [lon,lat] = f.geometry.coordinates;
            const d = document.createElement('div');
            d.textContent = label;
            d.style.padding='0.3rem'; d.style.cursor='pointer';
            d.addEventListener('click', ()=>{
              map.setView([lat,lon],14);
              L.popup()
                .setLatLng([lat,lon])
                .setContent(`<strong>Address:</strong><br>${label}`)
                .openOn(map);
              input.value = label;
              results.style.display='none';
            });
            results.appendChild(d);
          });
          results.style.display='block';
        })
        .catch(err=>{
          console.error('geocode error',err);
          results.style.display='none';
        });
    });
  
    document.addEventListener('click', e=>{
      if (!input.contains(e.target) && !toggle.contains(e.target)) {
        results.style.display='none';
      }
    });
  }
  