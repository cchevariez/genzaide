// ============ AUTHENTIFICATION GENZ'AIDE ============

const Auth = {
  // Afficher la modale d'inscription/connexion
  showModal(role, callback) {
    // Supprimer une modale existante
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal">
        <h2 class="modal-title">Créer un compte</h2>
        <p class="modal-subtitle">
          ${role === 'fournisseur'
            ? 'Inscris-toi pour publier ton annonce'
            : 'Inscris-toi pour postuler'}
        </p>

        <div id="auth-form">
          <div class="form-group">
            <label class="form-label">Prénom</label>
            <input type="text" class="form-input" id="auth-prenom" placeholder="Ton prénom" required>
          </div>
          <div class="form-group">
            <label class="form-label">Nom</label>
            <input type="text" class="form-input" id="auth-nom" placeholder="Ton nom" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="auth-email" placeholder="ton@email.fr" required>
          </div>
          <div class="form-group">
            <label class="form-label">Commune</label>
            <input type="text" class="form-input" id="auth-commune" placeholder="Ta commune">
          </div>

          <button class="btn btn-bleu btn-block" id="auth-submit">S'inscrire</button>

          <p style="text-align:center; margin-top:1rem; font-size:0.85rem; color: var(--texte-secondaire)">
            Déjà un compte ? <a href="#" id="auth-switch">Se connecter</a>
          </p>
        </div>

        <div id="login-form" style="display:none">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="login-email" placeholder="ton@email.fr" required>
          </div>

          <button class="btn btn-bleu btn-block" id="login-submit">Se connecter</button>

          <p style="text-align:center; margin-top:1rem; font-size:0.85rem; color: var(--texte-secondaire)">
            Pas de compte ? <a href="#" id="login-switch">S'inscrire</a>
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Fermer en cliquant sur l'overlay
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    // Basculer inscription / connexion
    overlay.querySelector('#auth-switch').addEventListener('click', (e) => {
      e.preventDefault();
      overlay.querySelector('#auth-form').style.display = 'none';
      overlay.querySelector('#login-form').style.display = 'block';
      overlay.querySelector('.modal-title').textContent = 'Se connecter';
      overlay.querySelector('.modal-subtitle').textContent = 'Connecte-toi avec ton email';
    });

    overlay.querySelector('#login-switch').addEventListener('click', (e) => {
      e.preventDefault();
      overlay.querySelector('#auth-form').style.display = 'block';
      overlay.querySelector('#login-form').style.display = 'none';
      overlay.querySelector('.modal-title').textContent = 'Créer un compte';
      overlay.querySelector('.modal-subtitle').textContent = role === 'fournisseur'
        ? 'Inscris-toi pour publier ton annonce'
        : 'Inscris-toi pour postuler';
    });

    // Inscription
    overlay.querySelector('#auth-submit').addEventListener('click', async () => {
      const prenom = overlay.querySelector('#auth-prenom').value.trim();
      const nom = overlay.querySelector('#auth-nom').value.trim();
      const email = overlay.querySelector('#auth-email').value.trim();
      const commune = overlay.querySelector('#auth-commune').value.trim();

      if (!prenom || !nom || !email) {
        App.showToast('Remplis tous les champs obligatoires', 'error');
        return;
      }

      try {
        const user = await API.createUser({ role, prenom, nom, email, commune });
        App.setSession(user);
        App.showToast(`Bienvenue ${user.prenom} !`, 'success');
        overlay.remove();
        if (callback) callback(user);
      } catch (err) {
        if (err.status === 409) {
          // L'email existe déjà, on connecte directement
          App.setSession(err.user);
          App.showToast(`Content de te revoir ${err.user.prenom} !`, 'success');
          overlay.remove();
          if (callback) callback(err.user);
        } else {
          App.showToast('Erreur lors de l\'inscription', 'error');
        }
      }
    });

    // Connexion
    overlay.querySelector('#login-submit').addEventListener('click', async () => {
      const email = overlay.querySelector('#login-email').value.trim();
      if (!email) {
        App.showToast('Entre ton email', 'error');
        return;
      }

      try {
        const user = await API.login(email);
        App.setSession(user);
        App.showToast(`Content de te revoir ${user.prenom} !`, 'success');
        overlay.remove();
        if (callback) callback(user);
      } catch (err) {
        App.showToast('Aucun compte trouvé avec cet email', 'error');
      }
    });
  },

  // Vérifier si connecté, sinon afficher modale
  requireAuth(role, callback) {
    const session = App.getSession();
    if (session) {
      callback(session);
    } else {
      Auth.showModal(role, callback);
    }
  }
};
