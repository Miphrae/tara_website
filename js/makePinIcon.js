// js/makePinIcon.js
// creates a Leaflet DivIcon "pin" in the given color
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
    iconSize:   [24, 36],
    iconAnchor: [12, 36],
    popupAnchor:[0, -36]
  });
}
