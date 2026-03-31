// ============ PAGE PROFIL ============

const Profil = {
  user: null,

  async init() {
    const session = App.getSession();
    if (!session) {
      document.getElementById('not-logged-in').style.display = '';
      return;
    }

    // Charger le profil frais depuis l'API
    try {
      this.user = await API.getUser(session.id);
      App.setSession(this.user);
    } catch (err) {
      this.user = session;
    }

    document.getElementById('profil-content').style.display = '';
    this.renderHeader();
    this.renderTabs();
    await this.loadData();
  },

  renderHeader() {
    const u = this.user;
    document.getElementById('profil-avatar').textContent = `${u.prenom[0]}${u.nom[0]}`;
    document.getElementById('profil-name').textContent = `${u.prenom} ${u.nom}`;
    document.getElementById('profil-role').textContent =
      u.role === 'fournisseur' ? 'Particulier' : 'Jeune chercheur d\'emploi';
    document.getElementById('profil-stars').innerHTML =
      `${App.renderStars(u.noteMoyenne)} <span style="font-size:0.8rem;color:var(--texte-secondaire)">(${u.nombreNotations} avis)</span>`;
  },

  renderTabs() {
    const tabs = document.getElementById('profil-tabs');
    if (this.user.role === 'fournisseur') {
      tabs.innerHTML = `
        <button class="tab active" onclick="Profil.switchTab('annonces', this)">Mes annonces</button>
        <button class="tab" onclick="Profil.switchTab('candidatures', this)">Candidatures</button>
        <button class="tab" onclick="Profil.switchTab('messages', this)">Messages</button>
      `;
    } else {
      tabs.innerHTML = `
        <button class="tab active" onclick="Profil.switchTab('candidatures', this)">Mes candidatures</button>
        <button class="tab" onclick="Profil.switchTab('messages', this)">Messages</button>
        <button class="tab" onclick="Profil.switchTab('suivi', this)">Suivi légal</button>
      `;
    }
  },

  switchTab(tab, el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    if (tab === 'messages') {
      this.loadMessages();
    }
  },

  async loadData() {
    if (this.user.role === 'fournisseur') {
      await this.loadFournisseurData();
      document.getElementById('tab-annonces').classList.add('active');
    } else {
      await this.loadChercheurData();
      document.getElementById('tab-candidatures').classList.add('active');
    }
  },

  // ============ FOURNISSEUR ============
  async loadFournisseurData() {
    try {
      const annonces = await API.getAnnonces();
      const mesAnnonces = annonces.filter(a => a.fournisseurId === this.user.id);
      const candidatures = await API.getCandidatures({ fournisseurId: this.user.id });

      // Stats
      document.getElementById('profil-stats').innerHTML = `
        <div class="stat-card">
          <div class="stat-value">${mesAnnonces.length}</div>
          <div class="stat-label">Annonces</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${mesAnnonces.filter(a => a.statut === 'ouverte').length}</div>
          <div class="stat-label">Ouvertes</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${candidatures.length}</div>
          <div class="stat-label">Candidatures</div>
        </div>
      `;

      // Annonces
      const tabAnnonces = document.getElementById('tab-annonces');
      if (mesAnnonces.length === 0) {
        tabAnnonces.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <p>Tu n'as pas encore publié d'annonce</p>
            <a href="fournisseur.html" class="btn btn-orange" style="margin-top:1rem">Publier une annonce</a>
          </div>`;
      } else {
        tabAnnonces.innerHTML = mesAnnonces.map(a => this.renderAnnonceCard(a)).join('');
      }

      // Candidatures reçues
      const tabCand = document.getElementById('tab-candidatures');
      if (candidatures.length === 0) {
        tabCand.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <p>Aucune candidature reçue pour le moment</p>
          </div>`;
      } else {
        const candHtml = await Promise.all(candidatures.map(c => this.renderCandidatureReceived(c)));
        tabCand.innerHTML = candHtml.join('');
      }
    } catch (err) {
      console.error('Erreur chargement données fournisseur:', err);
    }
  },

  renderAnnonceCard(annonce) {
    const cat = App.categories[annonce.type];
    const sousType = cat?.sousTypes[annonce.sousType] || annonce.sousType;
    const statutBadge = annonce.statut === 'ouverte'
      ? '<span style="color:var(--succes);font-weight:600">Ouverte</span>'
      : annonce.statut === 'terminee'
        ? '<span style="color:var(--texte-secondaire)">Terminée</span>'
        : '<span style="color:var(--orange);font-weight:600">Pourvue</span>';

    // Bouton supprimer pour les annonces ouvertes
    const deleteBtn = annonce.statut === 'ouverte'
      ? `<button class="btn btn-outline btn-sm" style="color:var(--erreur);border-color:var(--erreur);margin-top:0.5rem" onclick="Profil.deleteAnnonce('${annonce.id}')">Supprimer l'annonce</button>`
      : '';

    return `
      <div class="card" style="margin-bottom:0.75rem">
        <div class="card-header">
          ${App.renderBadge(annonce.type)}
          ${statutBadge}
        </div>
        <h4 class="card-title">${sousType}</h4>
        <div class="card-info">
          <span>📍 ${annonce.commune}</span>
          <span>💰 ${annonce.salaireHeure} €/h</span>
          <span>⏱️ ${annonce.dureeHeures}h</span>
          <span>👥 ${annonce.candidatures.length} candidature(s)</span>
        </div>
        <p class="card-description">${annonce.description}</p>
        ${deleteBtn}
      </div>
    `;
  },

  async renderCandidatureReceived(cand) {
    let chercheurInfo = '';
    try {
      const chercheur = await API.getUser(cand.chercheurId);
      chercheurInfo = `
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
          <div class="profil-avatar" style="width:32px;height:32px;font-size:0.8rem">${chercheur.prenom[0]}${chercheur.nom[0]}</div>
          <div>
            <a href="profil-public.html?id=${chercheur.id}" style="font-weight:700;color:var(--bleu);text-decoration:none">${chercheur.prenom} ${chercheur.nom[0]}.</a>
            <span style="font-size:0.8rem;margin-left:0.3rem">${App.renderStars(chercheur.noteMoyenne)}</span>
          </div>
        </div>
      `;
    } catch (err) {}

    const statutColor = cand.statut === 'en_attente' ? 'var(--orange)' :
      cand.statut === 'acceptee' ? 'var(--succes)' :
      cand.statut === 'terminee' ? 'var(--bleu)' : 'var(--erreur)';
    const statutLabel = cand.statut === 'en_attente' ? 'En attente' :
      cand.statut === 'acceptee' ? 'Acceptée' :
      cand.statut === 'terminee' ? 'Terminée' : 'Refusée';

    let actions = '';
    if (cand.statut === 'en_attente') {
      actions = `
        <div class="card-actions">
          <button class="btn btn-bleu btn-sm" onclick="Profil.updateCandidature('${cand.id}', 'acceptee')">Accepter</button>
          <button class="btn btn-outline btn-sm" onclick="Profil.updateCandidature('${cand.id}', 'refusee')">Refuser</button>
        </div>
      `;
    } else if (cand.statut === 'acceptee') {
      actions = `
        <div class="card-actions">
          <button class="btn btn-orange btn-sm" onclick="Profil.updateCandidature('${cand.id}', 'terminee')">Marquer terminée</button>
          <button class="btn btn-bleu btn-sm" onclick="Profil.showRatingModal('${cand.chercheurId}', '${cand.annonceId}')">Noter</button>
          <button class="btn btn-outline btn-sm" onclick="Profil.openMessaging('${cand.id}')">Envoyer un message</button>
        </div>
      `;
    }

    return `
      <div class="card" style="margin-bottom:0.75rem">
        ${chercheurInfo}
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:0.85rem;color:var(--texte-secondaire)">
            ${App.formatDate(cand.dateCandidature)}
          </span>
          <span style="font-weight:600;color:${statutColor};font-size:0.85rem">${statutLabel}</span>
        </div>
        ${actions}
      </div>
    `;
  },

  // ============ CHERCHEUR ============
  async loadChercheurData() {
    try {
      const candidatures = await API.getCandidatures({ chercheurId: this.user.id });
      const suivi = await API.getSuiviLegal(this.user.id);

      // Calcul du total gagné ce mois-ci
      const now = new Date();
      const gainsMoisCourant = suivi.details
        .filter(s => {
          const d = new Date(s.dateTravail);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, s) => sum + s.montantGagne, 0);

      // Stats
      document.getElementById('profil-stats').innerHTML = `
        <div class="stat-card">
          <div class="stat-value">${candidatures.length}</div>
          <div class="stat-label">Candidatures</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${suivi.totalHeures}h</div>
          <div class="stat-label">Travaillées</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${App.formatMoney(suivi.totalArgent)}</div>
          <div class="stat-label">Gagné</div>
        </div>
      `;

      // Avertissement plafond 1000 €/mois
      if (gainsMoisCourant >= 800) {
        const restant = Math.max(0, 1000 - gainsMoisCourant);
        const color = gainsMoisCourant >= 1000 ? '#c62828' : '#e65100';
        const bg = gainsMoisCourant >= 1000 ? '#ffebee' : '#fff3e0';
        const border = gainsMoisCourant >= 1000 ? '#ef9a9a' : '#ffb74d';
        const msg = gainsMoisCourant >= 1000
          ? 'Tu as atteint le plafond de 1 000 €/mois. Tu ne peux plus accepter de missions ce mois-ci.'
          : `Attention : tu as gagné ${App.formatMoney(gainsMoisCourant)} ce mois-ci. Il te reste ${App.formatMoney(restant)} avant d'atteindre le plafond de 1 000 €/mois.`;
        document.getElementById('profil-stats').insertAdjacentHTML('afterend',
          `<div style="background:${bg};border:1px solid ${border};border-radius:8px;padding:0.75rem;margin-bottom:1rem;font-size:0.85rem;color:${color}"><strong>Plafond mensuel</strong><br>${msg}</div>`
        );
      }

      // Candidatures
      const tabCand = document.getElementById('tab-candidatures');
      if (candidatures.length === 0) {
        tabCand.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>Tu n'as pas encore postulé</p>
            <a href="chercheur.html" class="btn btn-bleu" style="margin-top:1rem">Explorer les annonces</a>
          </div>`;
      } else {
        const candHtml = await Promise.all(candidatures.map(c => this.renderCandidatureSent(c)));
        tabCand.innerHTML = candHtml.join('');
      }

      // Suivi légal
      const tabSuivi = document.getElementById('tab-suivi');
      if (suivi.details.length === 0) {
        tabSuivi.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📊</div>
            <p>Aucune mission terminée pour le moment</p>
          </div>`;
      } else {
        tabSuivi.innerHTML = `
          <div style="margin-bottom:1rem">
            <div class="profil-stats">
              <div class="stat-card">
                <div class="stat-value">${suivi.totalHeures}h</div>
                <div class="stat-label">Total heures</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${App.formatMoney(suivi.totalArgent)}</div>
                <div class="stat-label">Total gagné</div>
              </div>
            </div>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Heures</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                ${suivi.details.map(s => `
                  <tr>
                    <td>${App.formatDate(s.dateTravail)}</td>
                    <td>${s.heuresTravaillees}h</td>
                    <td>${App.formatMoney(s.montantGagne)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (err) {
      console.error('Erreur chargement données chercheur:', err);
    }
  },

  async renderCandidatureSent(cand) {
    let annonceInfo = '';
    try {
      const annonce = await API.getAnnonce(cand.annonceId);
      const cat = App.categories[annonce.type];
      const sousType = cat?.sousTypes[annonce.sousType] || annonce.sousType;
      annonceInfo = `
        <h4 class="card-title">${sousType}</h4>
        <div class="card-info">
          <span>📍 ${annonce.commune}</span>
          <span>💰 ${annonce.salaireHeure} €/h</span>
        </div>
      `;
    } catch (err) {}

    const statutColor = cand.statut === 'en_attente' ? 'var(--orange)' :
      cand.statut === 'acceptee' ? 'var(--succes)' :
      cand.statut === 'terminee' ? 'var(--bleu)' : 'var(--erreur)';
    const statutLabel = cand.statut === 'en_attente' ? 'En attente' :
      cand.statut === 'acceptee' ? 'Acceptée' :
      cand.statut === 'terminee' ? 'Terminée' : 'Refusée';

    let actions = '';
    // Bouton annuler pour les candidatures en attente ou acceptées
    if (cand.statut === 'en_attente' || cand.statut === 'acceptee') {
      actions += `<button class="btn btn-outline btn-sm" style="color:var(--erreur);border-color:var(--erreur)" onclick="Profil.cancelCandidature('${cand.id}')">Annuler ma candidature</button>`;
    }
    if (cand.statut === 'acceptee') {
      actions += `<button class="btn btn-outline btn-sm" onclick="Profil.openMessaging('${cand.id}')">Envoyer un message</button>`;
    }
    if (cand.statut === 'terminee') {
      actions += `<button class="btn btn-bleu btn-sm" onclick="Profil.showRatingModal('${cand.annonceId}', '${cand.annonceId}')">Noter le fournisseur</button>`;
    }

    return `
      <div class="card" style="margin-bottom:0.75rem">
        ${annonceInfo}
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:0.5rem">
          <span style="font-size:0.85rem;color:var(--texte-secondaire)">${App.formatDate(cand.dateCandidature)}</span>
          <span style="font-weight:600;color:${statutColor};font-size:0.85rem">${statutLabel}</span>
        </div>
        ${actions ? `<div class="card-actions" style="margin-top:0.5rem">${actions}</div>` : ''}
      </div>
    `;
  },

  // ============ MESSAGES ============
  async loadMessages() {
    const tabMessages = document.getElementById('tab-messages');
    try {
      const conversations = await API.getConversations(this.user.id);
      if (conversations.length === 0) {
        tabMessages.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">💬</div>
            <p>Aucun message pour le moment</p>
            <p style="font-size:0.85rem;color:var(--texte-secondaire);margin-top:0.5rem">Les messages sont disponibles une fois qu'une candidature est acceptée</p>
          </div>`;
        return;
      }

      let html = `
        <div style="background:#fff3e0;border:1px solid #ffb74d;border-radius:8px;padding:0.75rem;margin-bottom:1rem;font-size:0.82rem;color:#e65100">
          <strong>Les messages sont enregistrés sur nos serveurs</strong> pour la sécurité de tous les utilisateurs.
        </div>
      `;

      for (const conv of conversations) {
        const otherUser = conv.otherUser;
        const lastMsg = conv.lastMessage;
        html += `
          <div class="card" style="margin-bottom:0.75rem;cursor:pointer" onclick="Profil.openMessaging('${conv.candidatureId}')">
            <div style="display:flex;align-items:center;gap:0.5rem">
              <div class="profil-avatar" style="width:36px;height:36px;font-size:0.8rem">${otherUser.prenom[0]}${otherUser.nom[0]}</div>
              <div style="flex:1">
                <strong>${otherUser.prenom} ${otherUser.nom[0]}.</strong>
                <p style="font-size:0.82rem;color:var(--texte-secondaire);margin:0.2rem 0 0">${lastMsg || 'Aucun message'}</p>
              </div>
            </div>
          </div>
        `;
      }

      tabMessages.innerHTML = html;
    } catch (err) {
      tabMessages.innerHTML = `<div class="empty-state"><p>Erreur de chargement des messages</p></div>`;
    }
  },

  // Ouvrir la modale de messagerie
  async openMessaging(candidatureId) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    // Charger les messages existants
    let messages = [];
    try {
      messages = await API.getMessages(candidatureId);
    } catch (err) {}

    const session = this.user;
    const isMineur = session.age < 18;

    // Messages pré-enregistrés adaptés
    const presetMessages = isMineur ? [
      'Bonjour, je suis disponible pour cette mission !',
      'Quand est-ce que la mission commence ?',
      'Pouvez-vous me donner plus de détails ?',
      'Je confirme ma disponibilité.',
      'Merci, à bientôt !',
      'Je ne suis plus disponible, désolé.',
      'Est-ce que je peux venir accompagné(e) ?',
      'Quelle est l\'adresse exacte ?'
    ] : [
      'Bonjour, votre candidature est retenue !',
      'La mission est prévue pour la date indiquée.',
      'Pouvez-vous confirmer votre disponibilité ?',
      'Voici l\'adresse exacte de la mission.',
      'Merci pour votre travail !',
      'La mission est annulée, désolé.',
      'Avez-vous besoin de matériel particulier ?',
      'Pouvez-vous arriver 10 minutes avant ?'
    ];

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal" style="max-width:500px;display:flex;flex-direction:column;max-height:85vh">
        <div style="border-bottom:1px solid var(--gris-clair);padding-bottom:0.75rem;margin-bottom:0.75rem">
          <h2 class="modal-title" style="margin-bottom:0.25rem">Messages</h2>
          <div style="background:#fff3e0;border:1px solid #ffb74d;border-radius:8px;padding:0.5rem;font-size:0.75rem;color:#e65100;text-align:center">
            Les messages sont enregistrés sur nos serveurs pour la sécurité de tous.
          </div>
        </div>

        <div id="messaging-messages" style="flex:1;overflow-y:auto;padding:0.5rem 0;min-height:200px">
          ${messages.length === 0
            ? '<p style="text-align:center;color:var(--texte-secondaire);font-size:0.85rem;padding:2rem 0">Aucun message. Sélectionnez un message ci-dessous.</p>'
            : messages.map(m => `
              <div style="margin-bottom:0.5rem;display:flex;${m.senderId === session.id ? 'justify-content:flex-end' : 'justify-content:flex-start'}">
                <div style="max-width:80%;padding:0.5rem 0.75rem;border-radius:12px;font-size:0.85rem;
                  ${m.senderId === session.id
                    ? 'background:var(--bleu);color:white;border-bottom-right-radius:4px'
                    : 'background:var(--gris-clair);color:var(--texte);border-bottom-left-radius:4px'}">
                  ${m.contenu}
                  <div style="font-size:0.7rem;opacity:0.7;margin-top:0.2rem">${new Date(m.date).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'})}</div>
                </div>
              </div>
            `).join('')
          }
        </div>

        <div style="border-top:1px solid var(--gris-clair);padding-top:0.75rem">
          <p style="font-size:0.8rem;color:var(--texte-secondaire);margin-bottom:0.5rem">Choisissez un message :</p>
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;max-height:150px;overflow-y:auto">
            ${presetMessages.map((msg, i) => `
              <button class="btn btn-outline btn-sm preset-msg" data-msg="${msg.replace(/"/g, '&quot;')}"
                style="font-size:0.78rem;text-align:left;white-space:normal">${msg}</button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Scroll en bas
    const msgContainer = overlay.querySelector('#messaging-messages');
    msgContainer.scrollTop = msgContainer.scrollHeight;

    // Clic sur message pré-enregistré
    overlay.querySelectorAll('.preset-msg').forEach(btn => {
      btn.addEventListener('click', async () => {
        const contenu = btn.dataset.msg;
        try {
          await API.sendMessage({
            candidatureId,
            senderId: session.id,
            contenu
          });

          // Ajouter le message visuellement
          const msgDiv = document.createElement('div');
          msgDiv.style.cssText = 'margin-bottom:0.5rem;display:flex;justify-content:flex-end';
          msgDiv.innerHTML = `
            <div style="max-width:80%;padding:0.5rem 0.75rem;border-radius:12px;font-size:0.85rem;background:var(--bleu);color:white;border-bottom-right-radius:4px">
              ${contenu}
              <div style="font-size:0.7rem;opacity:0.7;margin-top:0.2rem">${new Date().toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          `;

          const emptyMsg = msgContainer.querySelector('p');
          if (emptyMsg) emptyMsg.remove();
          msgContainer.appendChild(msgDiv);
          msgContainer.scrollTop = msgContainer.scrollHeight;

          App.showToast('Message envoyé', 'success');
        } catch (err) {
          App.showToast('Erreur d\'envoi', 'error');
        }
      });
    });

    // Fermer
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  },

  // ============ ACTIONS ============
  async updateCandidature(id, statut) {
    try {
      await API.updateCandidature(id, { statut });
      App.showToast(
        statut === 'acceptee' ? 'Candidature acceptée !' :
        statut === 'refusee' ? 'Candidature refusée' :
        'Mission marquée comme terminée', 'success'
      );
      // Recharger
      await this.loadData();
    } catch (err) {
      App.showToast(err.error || 'Erreur', 'error');
    }
  },

  // Annuler une candidature (chercheur)
  async cancelCandidature(id) {
    if (!confirm('Veux-tu vraiment annuler cette candidature ?')) return;
    try {
      await API.updateCandidature(id, { statut: 'annulee' });
      App.showToast('Candidature annulée', 'success');
      await this.loadData();
    } catch (err) {
      App.showToast(err.error || 'Erreur lors de l\'annulation', 'error');
    }
  },

  // Supprimer une annonce (fournisseur)
  async deleteAnnonce(id) {
    if (!confirm('Veux-tu vraiment supprimer cette annonce ?')) return;
    try {
      await API.deleteAnnonce(id);
      App.showToast('Annonce supprimée', 'success');
      await this.loadData();
    } catch (err) {
      App.showToast(err.error || 'Erreur lors de la suppression', 'error');
    }
  },

  showRatingModal(noteId, annonceId) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal">
        <h2 class="modal-title">Laisser un avis</h2>
        <p class="modal-subtitle">Comment s'est passée la mission ?</p>
        <div style="text-align:center; margin: 1.5rem 0">
          <div class="stars" id="rating-stars" style="font-size: 2.5rem; gap: 0.3rem">
            ${[1,2,3,4,5].map(i => `<span class="star interactive" data-value="${i}" style="font-size:2.5rem">★</span>`).join('')}
          </div>
          <p id="rating-label" style="margin-top:0.5rem;color:var(--texte-secondaire);font-size:0.9rem">Sélectionne une note</p>
        </div>
        <div class="form-group">
          <label class="form-label">Commentaire (optionnel)</label>
          <textarea class="form-textarea" id="rating-comment" rows="3" placeholder="Décris ton expérience..."></textarea>
        </div>
        <button class="btn btn-orange btn-block" id="submit-rating" disabled>Envoyer</button>
      </div>
    `;

    document.body.appendChild(overlay);

    let selectedRating = 0;
    const labels = ['', 'Décevant', 'Peut mieux faire', 'Correct', 'Bien', 'Excellent !'];

    overlay.querySelectorAll('#rating-stars .star').forEach(star => {
      star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.value);
        overlay.querySelectorAll('#rating-stars .star').forEach((s, i) => {
          s.classList.toggle('filled', i < selectedRating);
        });
        document.getElementById('rating-label').textContent = labels[selectedRating];
        document.getElementById('submit-rating').disabled = false;
      });
    });

    overlay.querySelector('#submit-rating').addEventListener('click', async () => {
      try {
        const commentaire = overlay.querySelector('#rating-comment').value.trim();
        await API.createNotation({
          annonceId,
          noteurId: this.user.id,
          noteId,
          etoiles: selectedRating,
          commentaire
        });
        App.showToast('Merci pour ton avis !', 'success');
        overlay.remove();
        await this.init();
      } catch (err) {
        App.showToast('Erreur lors de la notation', 'error');
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Profil.init();
});
