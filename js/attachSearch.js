import { geocodeAddress } from './geocodeAddress.js';

export function attachSearch(input, toggle, results, lookup, map, sidebar, key) {
  toggle.addEventListener('click', () => {
    const open = input.style.opacity==='1';
    if (!open) {
      input.style.width='200px'; input.style.opacity='1'; input.focus();
    } else {
      if (input.value.trim()) input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}));
      else { input.style.width='0'; input.style.opacity='0'; results.style.display='none'; }
    }
  });

  input.addEventListener('keydown', async e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const q = input.value.trim().toLowerCase();
    results.innerHTML='';
    if (!q) return results.style.display='none';

    // org lookup
    const orgs = lookup.filter(o => o.name.toLowerCase().includes(q)).slice(0,10);
    if (orgs.length) {
      orgs.forEach(o => {
        const div = document.createElement('div');
        div.textContent = o.name;
        div.style.padding = '0.3rem';
        div.style.cursor  = 'pointer';
        div.onclick = () => {
          map.setView(o.marker.getLatLng(),14);
          o.marker.openPopup();
          input.value = o.name;
          results.style.display='none';
        };
        results.appendChild(div);
      });
      return results.style.display='block';
    }

    // fallback to address
    await geocodeAddress(q, key, map, results, input);
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target)&&!toggle.contains(e.target)) {
      results.style.display='none';
    }
  });
}
