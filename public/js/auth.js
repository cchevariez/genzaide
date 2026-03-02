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
          <div class="form-group">
            <label class="form-label">Âge</label>
            <input type="number" class="form-input" id="auth-age" placeholder="Ton âge" min="14" max="99" required>
          </div>
          <div id="auth-age-warnings" style="display:none"></div>

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

    // Avertissements dynamiques selon l'âge
    const ageInput = overlay.querySelector('#auth-age');
    const ageWarnings = overlay.querySelector('#auth-age-warnings');
    ageInput.addEventListener('input', () => {
      const age = parseInt(ageInput.value);
      if (!age || age >= 18) {
        ageWarnings.style.display = 'none';
        ageWarnings.innerHTML = '';
        return;
      }
      let html = '';
      if (age < 18) {
        html += '<div style="background:#fff3e0;border:1px solid #ffb74d;border-radius:8px;padding:0.75rem;margin-bottom:0.5rem;font-size:0.85rem;color:#e65100"><strong>Autorisation parentale requise</strong><br>Un parent ou tuteur légal doit donner son accord.<div style="margin-top:0.5rem"><label class="form-label" style="font-size:0.8rem">Carte d\'identité du parent (upload simulé)</label><input type="file" accept="image/*,.pdf" style="font-size:0.8rem"></div></div>';
      }
      if (age < 16) {
        html += '<div style="background:#ffebee;border:1px solid #ef9a9a;border-radius:8px;padding:0.75rem;margin-bottom:0.5rem;font-size:0.85rem;color:#c62828"><strong>Autorisation de l\'inspecteur du travail requise</strong><br>15 jours avant l\'embauche, une demande doit être faite auprès de l\'inspecteur du travail.</div>';
      }
      ageWarnings.innerHTML = html;
      ageWarnings.style.display = 'block';
    });

    // Inscription
    overlay.querySelector('#auth-submit').addEventListener('click', async () => {
      const prenom = overlay.querySelector('#auth-prenom').value.trim();
      const nom = overlay.querySelector('#auth-nom').value.trim();
      const email = overlay.querySelector('#auth-email').value.trim();
      const commune = overlay.querySelector('#auth-commune').value.trim();
      const age = parseInt(overlay.querySelector('#auth-age').value);

      if (!prenom || !nom || !email || !age) {
        App.showToast('Remplis tous les champs obligatoires', 'error');
        return;
      }

      try {
        const user = await API.createUser({ role, prenom, nom, email, commune, age });
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
