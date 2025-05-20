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
    // console.log("MarkerCluster ok");
    const lookup = [];
  
    // 2) icons & sources
    const iconBlue = makePinIcon('#0074D9');
    const iconRed  = makePinIcon('#FF4136');
  
    // 3) wire up county tabs
    tabs.forEach(btn=>{
      btn.addEventListener('click',()=>{
        tabs.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        loadCounty(btn.dataset.county,
                   map, markerCluster, lookup, sidebar,
                   iconBlue, iconRed);
      });
    });
    loadCounty('county1', map, markerCluster, lookup, sidebar, iconBlue, iconRed);
  
    // 4) attach the search logic
    attachSearchLogic(map, lookup, input, toggle, results, sidebar, maptiler_key);
  });