// ============ WIZARD CRÉATION D'ANNONCE ============

const Wizard = {
  currentStep: 1,
  totalSteps: 5,
  data: {
    type: null,
    sousType: null,
    commune: '',
    adresse: '',
    lat: null,
    lng: null,
    salaireHeure: null,
    dureeHeures: null,
    dateTravail: null,
    description: ''
  },

  init() {
    this.renderProgress();
    this.renderCategories();
    this.initCommuneSearch();
  },

  // Barre de progression
  renderProgress() {
    const container = document.getElementById('wizard-progress');
    let html = '';
    for (let i = 1; i <= this.totalSteps; i++) {
      const state = i < this.currentStep ? 'completed' : (i === this.currentStep ? 'active' : '');
      html += `<div class="wizard-step-dot ${state}"></div>`;
      if (i < this.totalSteps) {
        html += `<div class="wizard-step-line ${i < this.currentStep ? 'completed' : ''}"></div>`;
      }
    }
    container.innerHTML = html;
  },

  // Afficher une étape
  showStep(step) {
    document.querySelectorAll('.wizard-panel').forEach(p => p.classList.remove('active'));
    const panel = document.querySelector(`.wizard-panel[data-step="${step}"]`);
    if (panel) panel.classList.add('active');
    this.currentStep = step;
    this.renderProgress();

    if (step === 5) this.renderPreview();
  },

  next() {
    if (this.validateStep()) {
      this.showStep(this.currentStep + 1);
    }
  },

  prev() {
    if (this.currentStep > 1) {
      this.showStep(this.currentStep - 1);
    }
  },

  validateStep() {
    switch (this.currentStep) {
      case 1:
        if (!this.data.type) {
          App.showToast('Choisis une catégorie', 'error');
          return false;
        }
        return true;
      case 2:
        if (!this.data.sousType) {
          App.showToast('Choisis un type de tâche', 'error');
          return false;
        }
        return true;
      case 3:
        if (!this.data.commune || !this.data.lat) {
          App.showToast('Sélectionne une commune dans les suggestions', 'error');
          return false;
        }
        this.data.adresse = document.getElementById('wizard-adresse').value.trim();
        return true;
      case 4:
        const customSalaire = document.getElementById('wizard-salaire-custom').value;
        if (customSalaire) {
          this.data.salaireHeure = parseFloat(customSalaire);
        }
        if (!this.data.salaireHeure) {
          App.showToast('Indique un salaire horaire', 'error');
          return false;
        }
        if (this.data.salaireHeure < 12) {
          App.showToast('Le salaire minimum est de 12 €/h', 'error');
          return false;
        }
        if (!this.data.dureeHeures) {
          App.showToast('Indique une durée estimée', 'error');
          return false;
        }
        return true;
      default:
        return true;
    }
  },

  // Étape 1 : Catégories
  renderCategories() {
    const grid = document.getElementById('category-grid');
    let html = '';
    for (const [key, cat] of Object.entries(App.categories)) {
      html += `
        <div class="choice-option" data-value="${key}" onclick="Wizard.selectCategory(this)">
          <span class="choice-icon">${cat.icon}</span>
          <span class="choice-label">${cat.label}</span>
        </div>`;
    }
    grid.innerHTML = html;
  },

  selectCategory(el) {
    document.querySelectorAll('#category-grid .choice-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    this.data.type = el.dataset.value;
    this.renderSubcategories();
    // Auto-avancer après un court délai
    setTimeout(() => this.showStep(2), 300);
  },

  // Étape 2 : Sous-catégories
  renderSubcategories() {
    const grid = document.getElementById('subcategory-grid');
    const cat = App.categories[this.data.type];
    if (!cat) return;

    let html = '';
    for (const [key, label] of Object.entries(cat.sousTypes)) {
      html += `
        <div class="choice-option" data-value="${key}" onclick="Wizard.selectSubcategory(this)">
          <span class="choice-label">${label}</span>
        </div>`;
    }
    grid.innerHTML = html;
  },

  selectSubcategory(el) {
    document.querySelectorAll('#subcategory-grid .choice-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    this.data.sousType = el.dataset.value;
    setTimeout(() => this.showStep(3), 300);
  },

  // Étape 3 : Recherche de commune (Nominatim)
  initCommuneSearch() {
    const input = document.getElementById('wizard-commune');
    const suggestionsDiv = document.getElementById('commune-suggestions');
    let debounceTimer;

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const query = input.value.trim();
      if (query.length < 3) {
        suggestionsDiv.style.display = 'none';
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=fr&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
          const res = await fetch(url, {
            headers: { 'User-Agent': 'GenZaide-Demo/1.0' }
          });
          const results = await res.json();

          if (results.length === 0) {
            suggestionsDiv.style.display = 'none';
            return;
          }

          suggestionsDiv.innerHTML = results.map(r => `
            <div class="suggestion-item" style="
              padding: 0.6rem 1rem;
              cursor: pointer;
              border-bottom: 1px solid var(--gris-clair);
              font-size: 0.9rem;
              transition: background 0.2s;
            " onmouseover="this.style.background='var(--bleu-tres-clair)'"
               onmouseout="this.style.background=''"
               data-lat="${r.lat}" data-lng="${r.lon}" data-name="${r.display_name.split(',')[0]}">
              ${r.display_name}
            </div>
          `).join('');

          suggestionsDiv.style.display = 'block';
          suggestionsDiv.style.background = 'var(--blanc)';
          suggestionsDiv.style.border = '2px solid var(--gris-clair)';
          suggestionsDiv.style.borderTop = 'none';
          suggestionsDiv.style.borderRadius = '0 0 8px 8px';
          suggestionsDiv.style.maxHeight = '200px';
          suggestionsDiv.style.overflowY = 'auto';

          suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
              Wizard.data.commune = item.dataset.name;
              Wizard.data.lat = parseFloat(item.dataset.lat);
              Wizard.data.lng = parseFloat(item.dataset.lng);
              input.value = item.dataset.name;
              suggestionsDiv.style.display = 'none';
            });
          });
        } catch (err) {
          console.error('Erreur géocodage:', err);
        }
      }, 500);
    });

    // Fermer les suggestions en cliquant ailleurs
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !suggestionsDiv.contains(e.target)) {
        suggestionsDiv.style.display = 'none';
      }
    });
  },

  selectDuree(el) {
    document.querySelectorAll('#duree-grid .choice-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    this.data.dureeHeures = parseFloat(el.dataset.value);
  },

  // Étape 5 : Aperçu
  renderPreview() {
    const preview = document.getElementById('annonce-preview');
    const cat = App.categories[this.data.type];
    const sousTypeLabel = cat?.sousTypes[this.data.sousType] || this.data.sousType;

    preview.innerHTML = `
      <div class="card-header">
        ${App.renderBadge(this.data.type)}
      </div>
      <h3 class="card-title">${sousTypeLabel}</h3>
      <div class="card-info">
        <span>📍 ${this.data.commune}</span>
        <span>💰 ${this.data.salaireHeure} €/h</span>
        <span>⏱️ ${this.data.dureeHeures}h</span>
        <span>💵 Total : ${this.data.salaireHeure * this.data.dureeHeures} €</span>
      </div>
    `;

    // Générer la description
    const desc = App.generateDescription(this.data);
    document.getElementById('wizard-description').value = desc;
    this.data.description = desc;
  },

  // Publication
  async publish() {
    this.data.description = document.getElementById('wizard-description').value.trim();
    if (!this.data.description) {
      App.showToast('La description ne peut pas être vide', 'error');
      return;
    }

    Auth.requireAuth('fournisseur', async (user) => {
      // Vérifier que l'utilisateur est bien un particulier
      if (user.role === 'chercheur') {
        App.showToast('Seuls les particuliers peuvent publier une annonce', 'error');
        return;
      }

      try {
        const annonce = await API.createAnnonce({
          ...this.data,
          fournisseurId: user.id
        });
        App.showToast('Annonce publiée avec succès !', 'success');
        setTimeout(() => {
          window.location.href = 'chercheur.html';
        }, 1500);
      } catch (err) {
        App.showToast(err.error || 'Erreur lors de la publication', 'error');
        console.error(err);
      }
    });
  }
};

// Mettre à jour l'info salaire sur changement du champ custom
document.addEventListener('DOMContentLoaded', () => {
  // Bloquer l'accès aux jeunes (chercheurs)
  const session = App.getSession();
  if (session && session.role === 'chercheur') {
    const container = document.querySelector('.wizard-panel.active');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🚫</div>
          <h2>Accès réservé aux particuliers</h2>
          <p style="margin-bottom:1.5rem">En tant que jeune, tu ne peux pas publier d'annonce. Tu peux chercher des missions sur la carte.</p>
          <a href="chercheur.html" class="btn btn-bleu">Voir les annonces</a>
        </div>
      `;
      return;
    }
  }

  // Afficher le bandeau d'inscription/connexion si pas connecté en tant que particulier
  const banner = document.getElementById('auth-banner');
  if (banner && !session) {
    banner.style.display = 'block';
    document.getElementById('auth-banner-signup').addEventListener('click', () => {
      Auth.showModal('fournisseur', (user) => {
        banner.style.display = 'none';
        App.initNavbar();
        App.showToast(`Bienvenue ${user.prenom} !`, 'success');
      });
    });
    document.getElementById('auth-banner-login').addEventListener('click', () => {
      Auth.showModal('fournisseur', (user) => {
        banner.style.display = 'none';
        App.initNavbar();
        if (user.role === 'chercheur') {
          window.location.href = 'profil.html';
        }
      });
      // Ouvrir directement l'écran de connexion
      setTimeout(() => {
        const switchLink = document.querySelector('#auth-switch-to-login');
        if (switchLink) switchLink.click();
      }, 50);
    });
  }

  Wizard.init();

  const customInput = document.getElementById('wizard-salaire-custom');
  if (customInput) {
    customInput.addEventListener('input', () => {
      const val = parseFloat(customInput.value);
      if (val) Wizard.data.salaireHeure = val;
    });
  }
});
