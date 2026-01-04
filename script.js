//  CONFIG 
const API_URL = 'https://projeto-backend-ufwn.onrender.com';

const mapsList = document.getElementById('mapsList');
const searchInput = document.getElementById('searchInput');
const orderSelect = document.getElementById('orderSelect');

const modal = document.getElementById('modal');
const openModalBtn = document.getElementById('openModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const createBtn = document.getElementById('createBtn');
const mapNameInput = document.getElementById('mapNameInput');

const deleteModal = document.getElementById('deleteModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

const toast = document.getElementById('toast');

let mapsCache = [];
let mapToDelete = null;




function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}


//  FORMATAR DATA 
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

//  MODAL 
openModalBtn.onclick = () => {
  modal.classList.remove('hidden');
  mapNameInput.value = '';
  mapNameInput.focus();
};

cancelBtn.onclick = () => {
  modal.classList.add('hidden');
};



//  CRIAR MAPA
const toggleCreateBtn = () => {
  createBtn.disabled = !mapNameInput.value.trim();
};

mapNameInput.addEventListener('input', toggleCreateBtn);
toggleCreateBtn();

createBtn.onclick = async () => {
  const name = mapNameInput.value.trim();
  if (!name) return showToast('Informe o nome do mapa');

  createBtn.disabled = true;
  try {
    const res = await fetch(`${API_URL}/maps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    const map = await res.json();
    modal.classList.add('hidden');
    showToast('Mapa criado');

    setTimeout(() => {
      window.location.href = `map.html?id=${map.id}&city=${encodeURIComponent(map.name)}`;
    }, 600);

  } catch (err) {
    console.error(err);
    showToast('Erro ao criar mapa');
  } finally {
    createBtn.disabled = false;
  }
};

//  RENDER 
function renderMaps(maps) {
  mapsList.innerHTML = '';

  if (maps.length === 0) {
    mapsList.innerHTML = '<li>Nenhum mapa encontrado</li>';
    return;
  }

  maps.forEach(map => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${map.name}</strong><br>
      <small>Criado em: ${formatDate(map.created_at)}</small><br>
      Pontos: ${map.points_count}<br><br>
      <button onclick="openMap(${map.id}, '${map.name}')">Abrir</button>
      <button class="danger" onclick="askDelete(${map.id})">Excluir</button>
    `;
    mapsList.appendChild(li);
  });
}
// = FILTRO =
function applyFilters() {
  let filtered = [...mapsCache];

  const search = searchInput.value.toLowerCase();
  if (search) {
    filtered = filtered.filter(m => m.name.toLowerCase().includes(search));
  }

  if (orderSelect.value === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (orderSelect.value === 'created') {
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  renderMaps(filtered);
}

searchInput.oninput = applyFilters;
orderSelect.onchange = applyFilters;


// = LOAD MAPS =
async function loadMaps() {
  try {
    const res = await fetch(`${API_URL}/maps`);
    mapsCache = await res.json();
    applyFilters();
  } catch (err) {
    console.error(err);
    showToast('Erro ao carregar mapas');
  }
}



//  ABRIR MAPA 
function openMap(id, name) {
  window.location.href = `map.html?id=${id}&city=${encodeURIComponent(name)}`;
}


//  EXCLUIR MAPA 
function askDelete(id) {
  mapToDelete = id;
  deleteModal.classList.remove('hidden');
}

cancelDeleteBtn.onclick = () => {
  deleteModal.classList.add('hidden');
  mapToDelete = null;
};

confirmDeleteBtn.onclick = async () => {
  if (!mapToDelete) return;

  await fetch(`${API_URL}/maps/${mapToDelete}`, { method: 'DELETE' });
  deleteModal.classList.add('hidden');
  mapToDelete = null;
  showToast('Mapa excluído');
  loadMaps();
};


loadMaps();
