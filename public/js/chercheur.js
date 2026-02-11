// ============ INTERFACE CHERCHEUR - CARTE ============

const MapView = {
  map: null,
  markers: [],
  allAnnonces: [],
  activeFilters: new Set(),
  salaireMin: 0,

  init() {
    this.initMap();
    this.initFilters();
    this.initSearch();
    this.initLocateBtn();
    this.loadAnnonces();
  },

  // Initialiser la carte Leaflet
  initMap() {
    // Centre par défaut : France
    this.map = L.map('map', {
      zoomControl: false
    }).setView([46.603354, 1.888334], 6);

    // Contrôle zoom en haut à droite
    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // Tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.map);

    // Fermer le panneau détail au clic sur la carte
    this.map.on('click', () => this.closeDetail());

    // Demander la géolocalisation
    this.geolocate();
  },

  // Géolocalisation
  geolocate() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          this.map.setView([latitude, longitude], 13);
        },
        () => {
          // Géolocalisation refusée, on reste sur la vue France
          console.log('Géolocalisation refusée');
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  },

  // Charger les annonces
  async loadAnnonces() {
    try {
      this.allAnnonces = await API.getAnnonces();
      this.renderMarkers();
    } catch (err) {
      console.error('Erreur chargement annonces:', err);
    }
  },

  // Créer un marqueur personnalisé
  createIcon(type) {
    const cat = App.categories[type];
    const emoji = cat ? cat.icon : '📌';
    return L.divIcon({
      className: '',
      html: `<div class="custom-marker"><span>${emoji}</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  },

  // Afficher les marqueurs sur la carte
  renderMarkers() {
    // Supprimer les marqueurs existants
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];

    // Filtrer les annonces
    let filtered = this.allAnnonces.filter(a => a.statut === 'ouverte');

    if (this.activeFilters.size > 0) {
      filtered = filtered.filter(a => this.activeFilters.has(a.type));
    }

    if (this.salaireMin > 0) {
      filtered = filtered.filter(a => a.salaireHeure >= this.salaireMin);
    }

    // Créer les marqueurs
    filtered.forEach(annonce => {
      if (!annonce.lat || !annonce.lng) return;

      const cat = App.categories[annonce.type];
      const sousTypeLabel = cat?.sousTypes[annonce.sousType] || annonce.sousType;

      const marker = L.marker([annonce.lat, annonce.lng], {
        icon: this.createIcon(annonce.type)
      });

      const popupHtml = `
        <div class="popup-content">
          <div class="popup-badge ${cat?.badge || ''}">${cat?.icon || ''} ${cat?.label || ''}</div>
          <h4>${sousTypeLabel}</h4>
          <div class="popup-info">
            <span>💰 ${annonce.salaireHeure} €/h — ${annonce.dureeHeures}h</span>
            <span>📍 ${annonce.commune}</span>
          </div>
          <button class="btn btn-bleu btn-sm" onclick="MapView.showDetail('${annonce.id}')">
            Voir l'annonce
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.addTo(this.map);
      this.markers.push(marker);
    });

    // Mettre à jour le compteur
    const countEl = document.getElementById('map-count');
    if (filtered.length > 0) {
      countEl.textContent = `${filtered.length} annonce${filtered.length > 1 ? 's' : ''}`;
      countEl.style.display = '';
    } else {
      countEl.style.display = 'none';
    }
  },

  // Filtres par catégorie
  initFilters() {
    const bar = document.getElementById('filter-bar');
    let html = `<button class="filter-tag active" data-type="all" onclick="MapView.toggleFilter(this)">Tout</button>`;

    for (const [key, cat] of Object.entries(App.categories)) {
      html += `<button class="filter-tag" data-type="${key}" onclick="MapView.toggleFilter(this)">
        ${cat.icon} ${cat.label}
      </button>`;
    }

    // Filtre salaire
    html += `
      <select class="filter-tag" id="filter-salaire" onchange="MapView.setSalaireMin(this.value)"
        style="appearance:none; -webkit-appearance:none; padding-right:0.5rem">
        <option value="0">💰 Salaire min</option>
        <option value="8">8 €/h+</option>
        <option value="10">10 €/h+</option>
        <option value="12">12 €/h+</option>
        <option value="15">15 €/h+</option>
      </select>
    `;

    bar.innerHTML = html;
  },

  toggleFilter(el) {
    const type = el.dataset.type;

    if (type === 'all') {
      this.activeFilters.clear();
      document.querySelectorAll('#filter-bar .filter-tag').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
    } else {
      document.querySelector('#filter-bar .filter-tag[data-type="all"]').classList.remove('active');
      el.classList.toggle('active');

      if (el.classList.contains('active')) {
        this.activeFilters.add(type);
      } else {
        this.activeFilters.delete(type);
      }

      // Si plus aucun filtre, réactiver "Tout"
      if (this.activeFilters.size === 0) {
        document.querySelector('#filter-bar .filter-tag[data-type="all"]').classList.add('active');
      }
    }

    this.renderMarkers();
  },

  setSalaireMin(value) {
    this.salaireMin = parseFloat(value) || 0;
    this.renderMarkers();
  },

  // Recherche de commune
  initSearch() {
    const input = document.getElementById('search-commune');
    const suggestionsDiv = document.getElementById('search-suggestions');
    let debounceTimer;

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const query = input.value.trim();
      if (query.length < 3) {
        suggestionsDiv.classList.remove('open');
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=fr&q=${encodeURIComponent(query)}&limit=5`;
          const res = await fetch(url, {
            headers: { 'User-Agent': 'GenZaide-Demo/1.0' }
          });
          const results = await res.json();

          if (results.length === 0) {
            suggestionsDiv.classList.remove('open');
            return;
          }

          suggestionsDiv.innerHTML = results.map(r => `
            <div class="suggestion-item" data-lat="${r.lat}" data-lng="${r.lon}">
              ${r.display_name}
            </div>
          `).join('');

          suggestionsDiv.classList.add('open');

          suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
              const lat = parseFloat(item.dataset.lat);
              const lng = parseFloat(item.dataset.lng);
              MapView.map.setView([lat, lng], 13);
              input.value = item.textContent.trim().split(',')[0];
              suggestionsDiv.classList.remove('open');
            });
          });
        } catch (err) {
          console.error('Erreur recherche:', err);
        }
      }, 500);
    });

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !suggestionsDiv.contains(e.target)) {
        suggestionsDiv.classList.remove('open');
      }
    });
  },

  // Bouton localisation
  initLocateBtn() {
    document.getElementById('locate-btn').addEventListener('click', () => {
      this.geolocate();
      App.showToast('Localisation en cours...', 'default');
    });
  },

  // Panneau détail d'annonce
  async showDetail(annonceId) {
    const annonce = this.allAnnonces.find(a => a.id === annonceId);
    if (!annonce) return;

    const cat = App.categories[annonce.type];
    const sousTypeLabel = cat?.sousTypes[annonce.sousType] || annonce.sousType;

    // Charger les infos du fournisseur
    let fournisseurHtml = '';
    try {
      const fournisseur = await API.getUser(annonce.fournisseurId);
      fournisseurHtml = `
        <div style="display:flex; align-items:center; gap:0.75rem; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--gris-clair)">
          <div class="profil-avatar" style="width:40px;height:40px;font-size:1rem">
            ${fournisseur.prenom[0]}${fournisseur.nom[0]}
          </div>
          <div>
            <strong>${fournisseur.prenom} ${fournisseur.nom[0]}.</strong>
            <div style="font-size:0.8rem">${App.renderStars(fournisseur.noteMoyenne)} (${fournisseur.nombreNotations})</div>
          </div>
        </div>
      `;
    } catch (err) {
      // Pas grave si on ne peut pas charger le fournisseur
    }

    const content = document.getElementById('detail-content');
    content.innerHTML = `
      ${App.renderBadge(annonce.type)}
      <h3 style="margin: 0.75rem 0 0.5rem">${sousTypeLabel}</h3>

      <div class="card-info">
        <span>📍 ${annonce.commune}</span>
        ${annonce.adresse ? `<span>🏠 ${annonce.adresse}</span>` : ''}
        <span>💰 ${annonce.salaireHeure} €/h</span>
        <span>⏱️ ${annonce.dureeHeures}h</span>
        <span>💵 Total estimé : ${annonce.salaireHeure * annonce.dureeHeures} €</span>
        <span>📅 ${App.formatDate(annonce.dateCreation)}</span>
      </div>

      <p class="card-description">${annonce.description}</p>

      ${fournisseurHtml}

      <button class="btn btn-orange btn-block" style="margin-top:1.25rem" onclick="MapView.postuler('${annonce.id}')">
        Postuler à cette annonce
      </button>
    `;

    document.getElementById('detail-panel').classList.add('open');
  },

  closeDetail() {
    document.getElementById('detail-panel').classList.remove('open');
  },

  // Postuler
  async postuler(annonceId) {
    Auth.requireAuth('chercheur', async (user) => {
      try {
        await API.createCandidature({
          annonceId,
          chercheurId: user.id
        });
        App.showToast('Candidature envoyée !', 'success');
        this.closeDetail();
      } catch (err) {
        if (err.status === 409) {
          App.showToast('Tu as déjà postulé à cette annonce', 'error');
        } else {
          App.showToast('Erreur lors de la candidature', 'error');
        }
      }
    });
  }
};

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
  MapView.init();
});
