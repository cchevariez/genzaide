// ============ APPLICATION GENZ'AIDE ============

const App = {
  // Catégories de tâches
  categories: {
    jardinage: {
      label: 'Jardinage',
      icon: '🌿',
      badge: 'badge-jardinage',
      sousTypes: {
        tondre_pelouse: 'Tondre la pelouse',
        tailler_haies: 'Tailler les haies',
        desherber: 'Désherber',
        arroser: 'Arroser les plantes',
        ramasser_feuilles: 'Ramasser les feuilles'
      }
    },
    menage: {
      label: 'Ménage',
      icon: '🧹',
      badge: 'badge-menage',
      sousTypes: {
        aspirateur: 'Passer l\'aspirateur',
        nettoyage_vitres: 'Nettoyer les vitres',
        repassage: 'Faire le repassage',
        rangement: 'Ranger / Organiser'
      }
    },
    courses: {
      label: 'Courses',
      icon: '🛒',
      badge: 'badge-courses',
      sousTypes: {
        faire_courses: 'Faire les courses',
        livrer_colis: 'Livrer des colis',
        porter_sacs: 'Porter des sacs'
      }
    },
    garde_animaux: {
      label: 'Garde d\'animaux',
      icon: '🐾',
      badge: 'badge-garde-animaux',
      sousTypes: {
        promener_chien: 'Promener un chien',
        nourrir_chat: 'Nourrir un chat',
        garder_vacances: 'Garder pendant les vacances'
      }
    },
    aide_numerique: {
      label: 'Aide numérique',
      icon: '💻',
      badge: 'badge-aide-numerique',
      sousTypes: {
        installer_app: 'Installer une application',
        expliquer_appareil: 'Expliquer un appareil',
        trier_photos: 'Trier des photos'
      }
    },
    bricolage: {
      label: 'Bricolage',
      icon: '🔧',
      badge: 'badge-bricolage',
      sousTypes: {
        monter_meuble: 'Monter un meuble',
        accrocher_cadre: 'Accrocher un cadre',
        petites_reparations: 'Petites réparations'
      }
    },
    soutien_scolaire: {
      label: 'Soutien scolaire',
      icon: '📚',
      badge: 'badge-soutien-scolaire',
      sousTypes: {
        aide_devoirs: 'Aide aux devoirs',
        lecture: 'Aide à la lecture',
        revision: 'Aide aux révisions'
      }
    }
  },

  // Session utilisateur
  getSession() {
    const session = localStorage.getItem('genzaide_session');
    return session ? JSON.parse(session) : null;
  },

  setSession(user) {
    localStorage.setItem('genzaide_session', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('genzaide_session');
  },

  isLoggedIn() {
    return this.getSession() !== null;
  },

  getCurrentUser() {
    return this.getSession();
  },

  // Toast notifications
  showToast(message, type = 'default') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // Étoiles
  renderStars(note, interactive = false) {
    let html = '<div class="stars">';
    for (let i = 1; i <= 5; i++) {
      const filled = i <= Math.round(note) ? 'filled' : '';
      const inter = interactive ? 'interactive' : '';
      html += `<span class="star ${filled} ${inter}" data-value="${i}">★</span>`;
    }
    html += '</div>';
    return html;
  },

  // Badge catégorie
  renderBadge(type) {
    const cat = this.categories[type];
    if (!cat) return '';
    return `<span class="card-badge ${cat.badge}">${cat.icon} ${cat.label}</span>`;
  },

  // Formatage
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  },

  formatMoney(amount) {
    return amount.toFixed(2).replace('.', ',') + ' €';
  },

  // Générer la description d'annonce
  generateDescription(data) {
    const cat = this.categories[data.type];
    const sousTypeLabel = cat?.sousTypes[data.sousType] || data.sousType;
    const dureeLabel = data.dureeHeures >= 8 ? 'une journée' :
      data.dureeHeures >= 4 ? 'une demi-journée' :
      `${data.dureeHeures} heure${data.dureeHeures > 1 ? 's' : ''}`;

    return `Recherche une personne pour : ${sousTypeLabel.toLowerCase()} à ${data.commune}. ` +
      `Durée estimée : ${dureeLabel}. ` +
      `Rémunération : ${data.salaireHeure} €/heure. ` +
      `Contact après candidature.`;
  },

  // Initialiser la navbar
  initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const session = this.getSession();
    const profilLink = navbar.querySelector('.nav-profil');
    const authLink = navbar.querySelector('.nav-auth');

    if (session && profilLink) {
      profilLink.style.display = '';
      profilLink.textContent = session.prenom || 'Profil';
    }
    if (session && authLink) {
      authLink.textContent = 'Déconnexion';
      authLink.href = '#';
      authLink.onclick = (e) => {
        e.preventDefault();
        this.clearSession();
        window.location.href = '/';
      };
    }
  }
};

// Initialiser la navbar au chargement
document.addEventListener('DOMContentLoaded', () => {
  App.initNavbar();
});
