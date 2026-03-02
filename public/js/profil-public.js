// ============ PAGE PROFIL PUBLIC ============

const ProfilPublic = {
  async init() {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');
    if (!userId) {
      this.renderError('Aucun utilisateur spécifié');
      return;
    }

    try {
      const user = await API.getUser(userId);
      const notations = await API.getNotations({ noteId: userId, withNoteur: 'true' });

      document.title = `${user.prenom} ${user.nom[0]}. - GenZ'aide`;
      this.render(user, notations);
    } catch (err) {
      this.renderError('Utilisateur introuvable');
    }
  },

  render(user, notations) {
    const container = document.getElementById('profil-public-content');
    const roleLabel = user.role === 'fournisseur' ? 'Fournisseur d\'emploi' : 'Chercheur d\'emploi';

    // Trier les notations par date décroissante
    notations.sort((a, b) => new Date(b.dateNotation) - new Date(a.dateNotation));

    let notationsHtml = '';
    if (notations.length === 0) {
      notationsHtml = `
        <div class="empty-state" style="padding:2rem">
          <div class="empty-icon">⭐</div>
          <p>Aucun avis pour le moment</p>
        </div>`;
    } else {
      notationsHtml = notations.map(n => `
        <div class="card" style="margin-bottom:0.75rem">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.4rem">
            <strong style="font-size:0.9rem">${n.noteurNom || 'Anonyme'}</strong>
            <span style="font-size:0.8rem;color:var(--texte-secondaire)">${App.formatDate(n.dateNotation)}</span>
          </div>
          <div style="margin-bottom:0.4rem">${App.renderStars(n.etoiles)}</div>
          ${n.commentaire ? `<p style="font-size:0.9rem;color:var(--texte);line-height:1.5;margin:0">${this.escapeHtml(n.commentaire)}</p>` : ''}
        </div>
      `).join('');
    }

    container.innerHTML = `
      <!-- En-tête profil -->
      <div class="profil-header">
        <div class="profil-avatar">${user.prenom[0]}${user.nom[0]}</div>
        <div class="profil-info">
          <h2>${user.prenom} ${user.nom}</h2>
          <p>${roleLabel}</p>
          <div>${App.renderStars(user.noteMoyenne)} <span style="font-size:0.8rem;color:var(--texte-secondaire)">(${user.nombreNotations} avis)</span></div>
        </div>
      </div>

      <!-- Avis -->
      <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:1rem">Avis (${notations.length})</h3>
      ${notationsHtml}
    `;
  },

  renderError(msg) {
    document.getElementById('profil-public-content').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">😕</div>
        <h2>${msg}</h2>
        <a href="chercheur.html" class="btn btn-bleu" style="margin-top:1rem">Retour à la carte</a>
      </div>`;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ProfilPublic.init();
});
