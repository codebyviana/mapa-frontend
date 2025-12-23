const params = new URLSearchParams(window.location.search);
const mapId = params.get('id');
const city = params.get('city');

if (!mapId) {
  alert('Mapa não encontrado');
  throw new Error('ID não informado');
}

const API_URL = 'https://projeto-backend-ufwn.onrender.com';

const mapTitle = document.getElementById('mapTitle');
const pointsCount = document.getElementById('pointsCount');
const pointsList = document.getElementById('pointsList');

const pointName = document.getElementById('pointName');
const latInput = document.getElementById('latInput');
const lngInput = document.getElementById('lngInput');
const savePointBtn = document.getElementById('savePointBtn');
const deletePointsBtn = document.getElementById('deletePointsBtn');

let selectedLatLng = null;
let markers = [];

/* MAPA */
const map = L.map('map').setView([-23.5505, -46.6333], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

if (city) {
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${city}`)
    .then(res => res.json())
    .then(data => {
      if (data[0]) {
        map.setView([data[0].lat, data[0].lon], 12);
      }
    });
}

map.on('click', e => {
  selectedLatLng = e.latlng;
  latInput.value = e.latlng.lat;
  lngInput.value = e.latlng.lng;
});

/* INFO MAPA */
async function loadMapInfo() {
  const res = await fetch(`${API_URL}/maps`);
  const maps = await res.json();
  const mapData = maps.find(m => m.id == mapId);
  if (mapData) mapTitle.innerText = mapData.name;
}

/* PONTOS */
async function loadPoints() {
  const res = await fetch(`${API_URL}/maps/${mapId}/points`);
  const points = await res.json();

  markers.forEach(m => map.removeLayer(m));
  markers = [];

  pointsList.innerHTML = '';
  pointsCount.innerText = `${points.length} pontos cadastrados`;

  points.forEach(p => {
    const marker = L.marker([p.latitude, p.longitude]).addTo(map);
    markers.push(marker);

    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${p.name}</strong><br>
      ${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}<br>
      <button class="small edit">Editar</button>
      <button class="danger small delete">Excluir</button>
    `;

    li.querySelector('.edit').onclick = async () => {
      const novoNome = prompt('Editar nome do ponto:', p.name);
      if (!novoNome) return;

      await fetch(`${API_URL}/maps/${mapId}/points/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: novoNome })
      });

      loadPoints();
    };

    li.querySelector('.delete').onclick = async () => {
      if (!confirm('Excluir este ponto?')) return;

      await fetch(`${API_URL}/maps/${mapId}/points/${p.id}`, {
        method: 'DELETE'
      });

      loadPoints();
    };

    pointsList.appendChild(li);
  });
}

/* SALVAR PONTO */
savePointBtn.onclick = async () => {
  if (!selectedLatLng) {
    alert('Clique no mapa');
    return;
  }

  await fetch(`${API_URL}/maps/${mapId}/points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: pointName.value || 'Ponto',
      lat: selectedLatLng.lat,
      lng: selectedLatLng.lng
    })
  });

  pointName.value = '';
  latInput.value = '';
  lngInput.value = '';
  selectedLatLng = null;

  loadPoints();
};

/* EXCLUIR TODOS */
deletePointsBtn.onclick = async () => {
  if (!confirm('Excluir todos os pontos?')) return;

  await fetch(`${API_URL}/maps/${mapId}/points`, {
    method: 'DELETE'
  });

  loadPoints();
};

loadMapInfo();
loadPoints();
