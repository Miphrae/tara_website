document.addEventListener('DOMContentLoaded', ()=>{
  // 1) basemap & UI refs…
  const map = L.map('map',{ layers:[L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM'})]})
                .setView([37.5,-119.5],6);

  const tabs    = document.querySelectorAll('#county-tabs button');
  const toggle  = document.getElementById('search-toggle');
  const input   = document.getElementById('org-search');
  const results = document.getElementById('search-results');
  const sidebar = document.getElementById('sidebar');

  const maptiler_key = 'fX3Uesvx5ZBwgI8zNqhf';
  const markerCluster = L.markerClusterGroup();
  const lookup = [];

  // 2) icons & sources
  const iconBlue = makePinIcon('#0074D9');
  const iconRed  = makePinIcon('#FF4136');

  const sources = {
    county1:{kml:'https://cdn.jsdelivr.net/gh/miphrae/tara_website@v1.0.0/borders_livermore.kml',
             csv:'https://cdn.jsdelivr.net/gh/miphrae/tara_website@v1.0.0/points_livermore.csv'},
    county2:{kml:'https://cdn.jsdelivr.net/gh/miphrae/tara_website@v1.0.0/borders_pleasanton.kml',
             csv:'https://cdn.jsdelivr.net/gh/miphrae/tara_website@v1.0.0/points_pleasanton.csv'},
    county3:{kml:'https://cdn.jsdelivr.net/gh/miphrae/tara_website@v1.0.0/borders.kml',
             csv:'https://cdn.jsdelivr.net/gh/miphrae/tara_website@v1.0.0/points.csv'}
  };

  // 3) wire up county tabs
  tabs.forEach(btn=>{
    btn.addEventListener('click',()=>{
      tabs.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      loadCounty(btn.dataset.county,
                 map, markerCluster, lookup, sidebar,
                 sources, iconBlue, iconRed);
    });
  });
  loadCounty('county1', map, markerCluster, lookup, sidebar, sources, iconBlue, iconRed);

  // 4) attach the search logic
  attachSearchLogic(map, lookup, input, toggle, results, sidebar, maptiler_key);
});
