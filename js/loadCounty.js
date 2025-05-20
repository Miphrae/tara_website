/**
 * loadCounty(id, map, markerCluster, lookup, sidebar, sources, iconBlue, iconRed)
 *  - id: “county1”|”county2”|”county3”
 *  - map: your L.map instance
 *  - markerCluster: your L.markerClusterGroup instance
 *  - lookup: the array to push {name, marker}
 *  - sidebar: the sidebar DOM node
 *  - sources: your sources object
 *  - iconBlue, iconRed: two DivIcons
 */
async function loadCounty(id, map, markerCluster, lookup, sidebar, sources, iconBlue, iconRed) {
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
      .on('ready', function() {
        this.addTo(map);
        map.fitBounds(this.getBounds());
        res(this);
      });
  });

  // 2) load CSV points
  const txt  = await fetch(sources[id].csv).then(r => r.text());
  const rows = Papa.parse(txt, { header: true }).data;
  for (let row of rows) {
    if (!row.LAT || !row.LON) continue;
    const name    = row['Organization Name_CLEAN'];
    const coord   = [+row.LAT, +row.LON];
    const isMulti = (row.isMultiple||'').toLowerCase() === 'multiple spaces';
    const icon    = isMulti ? iconRed : iconBlue;
    const m = L.marker(coord, { title:name, icon })
      .bindPopup(`<strong>${name}</strong><br>${row.Address}`)
      .on('click', ()=> {
        sidebar.innerHTML = `<h4>${name}</h4><p>${row.Address}</p>`;
      });
    markerCluster.addLayer(m);
    lookup.push({ name, marker:m });
  }
  map.addLayer(markerCluster);
}
