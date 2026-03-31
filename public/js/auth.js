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

        <!-- Étape 1 : Écran réglementaire -->
        <div id="auth-reglementation">
          <div style="background:#e3f2fd;border:1px solid #90caf9;border-radius:12px;padding:1.25rem;margin-bottom:1rem">
            <h3 style="margin:0 0 0.75rem;font-size:1rem;color:#1565c0">Réglementation par tranche d'âge</h3>

            <div style="background:#fff;border-radius:8px;padding:0.75rem;margin-bottom:0.75rem">
              <strong style="color:#e65100">14-15 ans</strong>
              <ul style="margin:0.3rem 0 0;padding-left:1.2rem;font-size:0.82rem;line-height:1.6;color:var(--texte)">
                <li>Connexion France Identité obligatoire</li>
                <li>Autorisation parentale + inspecteur du travail</li>
                <li>Uniquement pendant les vacances scolaires</li>
                <li>Max 7h/jour et 35h/semaine</li>
                <li>Travail de nuit interdit (20h - 6h)</li>
                <li>Rémunération minimum : 9,32 €/h brut (80% SMIC)</li>
                <li>Paiement uniquement via l'application</li>
              </ul>
            </div>

            <div style="background:#fff;border-radius:8px;padding:0.75rem;margin-bottom:0.75rem">
              <strong style="color:#1565c0">16-17 ans</strong>
              <ul style="margin:0.3rem 0 0;padding-left:1.2rem;font-size:0.82rem;line-height:1.6;color:var(--texte)">
                <li>Connexion France Identité obligatoire</li>
                <li>Accord écrit des parents (sauf mineurs émancipés)</li>
                <li>Max 8h/jour et 35h/semaine, repos quotidien 12h</li>
                <li>Travail interdit entre 22h et 6h</li>
                <li>Rémunération minimum : 10,49 €/h brut (90% SMIC)</li>
                <li>Plafond de 1 000 €/mois</li>
              </ul>
            </div>

            <div style="background:#fff;border-radius:8px;padding:0.75rem">
              <strong style="color:#2e7d32">18 ans et plus</strong>
              <ul style="margin:0.3rem 0 0;padding-left:1.2rem;font-size:0.82rem;line-height:1.6;color:var(--texte)">
                <li>Connexion France Identité obligatoire</li>
                <li>Aucune restriction spécifique</li>
                <li>Rémunération minimum : 11,65 €/h brut (SMIC)</li>
                <li>Paiement uniquement via l'application</li>
                <li>Plafond de 1 000 €/mois</li>
              </ul>
            </div>
          </div>

          <label style="display:flex;align-items:flex-start;gap:0.5rem;margin-bottom:1.25rem;cursor:pointer;font-size:0.85rem">
            <input type="checkbox" id="auth-accept-reglement" style="margin-top:0.2rem;width:18px;height:18px;flex-shrink:0">
            <span>J'ai pris connaissance de ce formulaire et j'accepte les conditions liées à ma tranche d'âge.</span>
          </label>

          <button class="btn btn-bleu btn-block" id="auth-continue-btn" disabled>Continuer</button>

          <p style="text-align:center; margin-top:1rem; font-size:0.85rem; color: var(--texte-secondaire)">
            Déjà un compte ? <a href="#" id="auth-switch-to-login">Se connecter</a>
          </p>
        </div>

        <!-- Étape 2 : Formulaire d'inscription -->
        <div id="auth-form" style="display:none">
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
            <a href="#" id="auth-back-reglement">Retour</a> |
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

    // Checkbox réglementation
    const acceptCheckbox = overlay.querySelector('#auth-accept-reglement');
    const continueBtn = overlay.querySelector('#auth-continue-btn');
    acceptCheckbox.addEventListener('change', () => {
      continueBtn.disabled = !acceptCheckbox.checked;
    });

    // Continuer vers le formulaire
    continueBtn.addEventListener('click', () => {
      overlay.querySelector('#auth-reglementation').style.display = 'none';
      overlay.querySelector('#auth-form').style.display = 'block';
      overlay.querySelector('.modal-title').textContent = 'Créer un compte';
      overlay.querySelector('.modal-subtitle').textContent = role === 'fournisseur'
        ? 'Inscris-toi pour publier ton annonce'
        : 'Inscris-toi pour postuler';
    });

    // Retour vers réglementation
    overlay.querySelector('#auth-back-reglement').addEventListener('click', (e) => {
      e.preventDefault();
      overlay.querySelector('#auth-form').style.display = 'none';
      overlay.querySelector('#auth-reglementation').style.display = 'block';
      overlay.querySelector('.modal-title').textContent = 'Créer un compte';
    });

    // Passer directement au login depuis la réglementation
    overlay.querySelector('#auth-switch-to-login').addEventListener('click', (e) => {
      e.preventDefault();
      overlay.querySelector('#auth-reglementation').style.display = 'none';
      overlay.querySelector('#login-form').style.display = 'block';
      overlay.querySelector('.modal-title').textContent = 'Se connecter';
      overlay.querySelector('.modal-subtitle').textContent = 'Connecte-toi avec ton email';
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
      overlay.querySelector('#login-form').style.display = 'none';
      overlay.querySelector('#auth-reglementation').style.display = 'block';
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
