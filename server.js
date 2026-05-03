const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialiser les fichiers JSON s'ils n'existent pas
const dataFiles = {
  'annonces.json': [],
  'users.json': [],
  'candidatures.json': [],
  'notations.json': [],
  'suivi-legal.json': [],
  'messages.json': []
};

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let needSeed = false;
for (const [file, defaultData] of Object.entries(dataFiles)) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    if (file !== 'messages.json') needSeed = true;
  }
}

// Charger les données de démo si les fichiers sont vides
if (needSeed || readJSONRaw('annonces.json').length === 0) {
  console.log('Chargement des données de démo...');
  try { require('./data/seed.js'); } catch (e) { console.error('Seed error:', e); }
}

function readJSONRaw(filename) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8')); }
  catch { return []; }
}

// Helpers lecture/écriture JSON
function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

// ============ ROUTES API ============

// --- Annonces ---
app.get('/api/annonces', (req, res) => {
  let annonces = readJSON('annonces.json');
  const { type, salaireMin, lat, lng, rayon } = req.query;

  if (type) {
    annonces = annonces.filter(a => a.type === type);
  }
  if (salaireMin) {
    annonces = annonces.filter(a => a.salaireHeure >= parseFloat(salaireMin));
  }
  if (lat && lng && rayon) {
    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);
    const maxDist = parseFloat(rayon);
    annonces = annonces.filter(a => {
      const dist = getDistanceKm(centerLat, centerLng, a.lat, a.lng);
      return dist <= maxDist;
    });
  }

  res.json(annonces);
});

app.get('/api/annonces/:id', (req, res) => {
  const annonces = readJSON('annonces.json');
  const annonce = annonces.find(a => a.id === req.params.id);
  if (!annonce) return res.status(404).json({ error: 'Annonce non trouvée' });
  res.json(annonce);
});

app.post('/api/annonces', (req, res) => {
  // Vérifier que le créateur est un fournisseur (particulier)
  const users = readJSON('users.json');
  const creator = users.find(u => u.id === req.body.fournisseurId);
  if (creator && creator.role === 'chercheur') {
    return res.status(403).json({ error: 'Seuls les particuliers peuvent publier une annonce' });
  }

  const annonces = readJSON('annonces.json');
  const annonce = {
    id: generateId('ann'),
    fournisseurId: req.body.fournisseurId,
    type: req.body.type,
    sousType: req.body.sousType,
    commune: req.body.commune,
    adresse: req.body.adresse || '',
    lat: req.body.lat,
    lng: req.body.lng,
    salaireHeure: req.body.salaireHeure,
    dureeHeures: req.body.dureeHeures,
    description: req.body.description,
    trancheAge: req.body.trancheAge || null,
    dateTravail: req.body.dateTravail || null,
    dateCreation: new Date().toISOString(),
    statut: 'ouverte',
    candidatures: []
  };
  annonces.push(annonce);
  writeJSON('annonces.json', annonces);
  res.status(201).json(annonce);
});

app.put('/api/annonces/:id', (req, res) => {
  const annonces = readJSON('annonces.json');
  const index = annonces.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Annonce non trouvée' });

  const allowed = ['description', 'statut', 'salaireHeure', 'dureeHeures'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      annonces[index][key] = req.body[key];
    }
  }
  writeJSON('annonces.json', annonces);
  res.json(annonces[index]);
});

// Supprimer une annonce
app.delete('/api/annonces/:id', (req, res) => {
  const annonces = readJSON('annonces.json');
  const index = annonces.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Annonce non trouvée' });

  // Supprimer les candidatures liées
  const candidatures = readJSON('candidatures.json');
  const filteredCand = candidatures.filter(c => c.annonceId !== req.params.id);
  writeJSON('candidatures.json', filteredCand);

  annonces.splice(index, 1);
  writeJSON('annonces.json', annonces);
  res.json({ success: true });
});

// --- Utilisateurs ---
app.post('/api/users', (req, res) => {
  const users = readJSON('users.json');
  const existing = users.find(u => u.email === req.body.email);
  if (existing) return res.status(409).json({ error: 'Email déjà utilisé', user: existing });

  const user = {
    id: generateId('usr'),
    role: req.body.role,
    nom: req.body.nom,
    prenom: req.body.prenom,
    email: req.body.email,
    commune: req.body.commune || '',
    age: req.body.age || null,
    adresse: req.body.adresse || '',
    telephone: req.body.telephone || '',
    // Champs spécifiques jeunes (chercheurs)
    nationalite: req.body.nationalite || '',
    dateNaissance: req.body.dateNaissance || '',
    lieuNaissance: req.body.lieuNaissance || '',
    numeroSecu: req.body.numeroSecu || '',
    rib: req.body.rib || '',
    // Champs profil (modifiables)
    username: req.body.username || '',
    bio: req.body.bio || '',
    photoProfil: req.body.photoProfil || '',
    dateInscription: new Date().toISOString(),
    noteMoyenne: 0,
    nombreNotations: 0
  };
  users.push(user);
  writeJSON('users.json', users);
  res.status(201).json(user);
});

// Mise à jour profil utilisateur
app.put('/api/users/:id', (req, res) => {
  const users = readJSON('users.json');
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Utilisateur non trouvé' });

  const editable = [
    'username', 'bio', 'photoProfil',
    'nom', 'prenom', 'commune', 'adresse', 'telephone',
    'nationalite', 'dateNaissance', 'lieuNaissance', 'numeroSecu', 'rib'
  ];
  for (const key of editable) {
    if (req.body[key] !== undefined) {
      users[index][key] = req.body[key];
    }
  }
  writeJSON('users.json', users);
  res.json(users[index]);
});

app.post('/api/auth/login', (req, res) => {
  const users = readJSON('users.json');
  const user = users.find(u => u.email === req.body.email);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json(user);
});

app.get('/api/users/:id', (req, res) => {
  const users = readJSON('users.json');
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json(user);
});

// --- Candidatures ---
app.post('/api/candidatures', (req, res) => {
  const candidatures = readJSON('candidatures.json');
  const annonces = readJSON('annonces.json');
  const users = readJSON('users.json');

  const annonceIndex = annonces.findIndex(a => a.id === req.body.annonceId);
  if (annonceIndex === -1) return res.status(404).json({ error: 'Annonce non trouvée' });

  // Vérifier que l'utilisateur est un chercheur (pas un fournisseur/particulier)
  const chercheur = users.find(u => u.id === req.body.chercheurId);
  if (chercheur && chercheur.role === 'fournisseur') {
    return res.status(403).json({ error: 'Un particulier ne peut pas postuler à une annonce' });
  }

  // Vérifier la compatibilité de salaire par rapport à l'âge
  if (chercheur && chercheur.age) {
    const salaireMinByAge = { '14-15': 9.32, '16-17': 10.49, '18+': 11.65 };
    const tranche = chercheur.age >= 18 ? '18+' : chercheur.age >= 16 ? '16-17' : '14-15';
    const minSalaire = salaireMinByAge[tranche];
    if (annonces[annonceIndex].salaireHeure < minSalaire) {
      return res.status(403).json({
        error: `Le salaire de cette annonce (${annonces[annonceIndex].salaireHeure} €/h) est en dessous du minimum légal pour votre tranche d'âge (${minSalaire} €/h)`
      });
    }
  }

  // Vérifier si candidature déjà existante
  const existing = candidatures.find(c =>
    c.annonceId === req.body.annonceId &&
    c.chercheurId === req.body.chercheurId &&
    c.statut !== 'annulee'
  );
  if (existing) {
    return res.status(409).json({ error: 'Candidature déjà existante' });
  }

  const candidature = {
    id: generateId('cand'),
    annonceId: req.body.annonceId,
    chercheurId: req.body.chercheurId,
    dateCandidature: new Date().toISOString(),
    statut: 'en_attente'
  };
  candidatures.push(candidature);
  writeJSON('candidatures.json', candidatures);

  // Ajouter le chercheur à la liste des candidatures de l'annonce
  if (!annonces[annonceIndex].candidatures.includes(req.body.chercheurId)) {
    annonces[annonceIndex].candidatures.push(req.body.chercheurId);
    writeJSON('annonces.json', annonces);
  }

  res.status(201).json(candidature);
});

app.get('/api/candidatures', (req, res) => {
  let candidatures = readJSON('candidatures.json');

  // Filtrer les candidatures annulées par défaut
  candidatures = candidatures.filter(c => c.statut !== 'annulee');

  if (req.query.annonceId) {
    candidatures = candidatures.filter(c => c.annonceId === req.query.annonceId);
  }
  if (req.query.chercheurId) {
    candidatures = candidatures.filter(c => c.chercheurId === req.query.chercheurId);
  }
  if (req.query.fournisseurId) {
    const annonces = readJSON('annonces.json');
    const mesAnnonces = annonces.filter(a => a.fournisseurId === req.query.fournisseurId).map(a => a.id);
    candidatures = candidatures.filter(c => mesAnnonces.includes(c.annonceId));
  }
  res.json(candidatures);
});

app.put('/api/candidatures/:id', (req, res) => {
  const candidatures = readJSON('candidatures.json');
  const index = candidatures.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Candidature non trouvée' });

  // Vérifier le plafond de 1000 €/mois avant de marquer comme terminée
  if (req.body.statut === 'terminee') {
    const annonces = readJSON('annonces.json');
    const annonce = annonces.find(a => a.id === candidatures[index].annonceId);
    if (annonce) {
      const suiviLegal = readJSON('suivi-legal.json');
      const now = new Date();
      const moisCourant = suiviLegal.filter(s => {
        const d = new Date(s.dateTravail);
        return s.chercheurId === candidatures[index].chercheurId &&
          d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const totalMois = moisCourant.reduce((sum, s) => sum + s.montantGagne, 0);
      const montantAnnonce = annonce.dureeHeures * annonce.salaireHeure;
      if (totalMois + montantAnnonce > 1000) {
        return res.status(400).json({
          error: 'Plafond de 1000 €/mois atteint',
          totalMois,
          montantAnnonce,
          restant: Math.max(0, 1000 - totalMois)
        });
      }
    }
  }

  if (req.body.statut) {
    candidatures[index].statut = req.body.statut;
  }
  writeJSON('candidatures.json', candidatures);

  // Si la candidature est terminée, créer une entrée de suivi légal
  if (req.body.statut === 'terminee') {
    const annonces = readJSON('annonces.json');
    const annonce = annonces.find(a => a.id === candidatures[index].annonceId);
    if (annonce) {
      const suiviLegal = readJSON('suivi-legal.json');
      suiviLegal.push({
        id: generateId('suivi'),
        chercheurId: candidatures[index].chercheurId,
        annonceId: annonce.id,
        heuresTravaillees: annonce.dureeHeures,
        montantGagne: annonce.dureeHeures * annonce.salaireHeure,
        dateTravail: new Date().toISOString().split('T')[0]
      });
      writeJSON('suivi-legal.json', suiviLegal);
    }
  }

  res.json(candidatures[index]);
});

// --- Notations ---
app.post('/api/notations', (req, res) => {
  const notations = readJSON('notations.json');
  const notation = {
    id: generateId('not'),
    annonceId: req.body.annonceId,
    noteurId: req.body.noteurId,
    noteId: req.body.noteId,
    etoiles: Math.min(5, Math.max(1, parseInt(req.body.etoiles))),
    commentaire: req.body.commentaire || '',
    dateNotation: new Date().toISOString()
  };
  notations.push(notation);
  writeJSON('notations.json', notations);

  // Mettre à jour la note moyenne de l'utilisateur noté
  const users = readJSON('users.json');
  const userIndex = users.findIndex(u => u.id === req.body.noteId);
  if (userIndex !== -1) {
    const userNotations = notations.filter(n => n.noteId === req.body.noteId);
    const moyenne = userNotations.reduce((sum, n) => sum + n.etoiles, 0) / userNotations.length;
    users[userIndex].noteMoyenne = Math.round(moyenne * 10) / 10;
    users[userIndex].nombreNotations = userNotations.length;
    writeJSON('users.json', users);
  }

  res.status(201).json(notation);
});

app.get('/api/notations', (req, res) => {
  let notations = readJSON('notations.json');
  if (req.query.noteId) {
    notations = notations.filter(n => n.noteId === req.query.noteId);
  }
  if (req.query.annonceId) {
    notations = notations.filter(n => n.annonceId === req.query.annonceId);
  }
  // Enrichir avec les infos du noteur si demandé
  if (req.query.withNoteur === 'true') {
    const users = readJSON('users.json');
    notations = notations.map(n => {
      const noteur = users.find(u => u.id === n.noteurId);
      return { ...n, noteurNom: noteur ? `${noteur.prenom} ${noteur.nom[0]}.` : 'Anonyme' };
    });
  }
  res.json(notations);
});

// --- Suivi légal ---
app.get('/api/suivi-legal/:chercheurId', (req, res) => {
  const suiviLegal = readJSON('suivi-legal.json');
  const suivi = suiviLegal.filter(s => s.chercheurId === req.params.chercheurId);
  const totalHeures = suivi.reduce((sum, s) => sum + s.heuresTravaillees, 0);
  const totalArgent = suivi.reduce((sum, s) => sum + s.montantGagne, 0);
  res.json({ details: suivi, totalHeures, totalArgent });
});

// --- Messages ---
app.post('/api/messages', (req, res) => {
  const messages = readJSON('messages.json');
  const message = {
    id: generateId('msg'),
    candidatureId: req.body.candidatureId,
    senderId: req.body.senderId,
    contenu: req.body.contenu,
    date: new Date().toISOString()
  };
  messages.push(message);
  writeJSON('messages.json', messages);
  res.status(201).json(message);
});

app.get('/api/messages/:candidatureId', (req, res) => {
  const messages = readJSON('messages.json');
  const convMessages = messages
    .filter(m => m.candidatureId === req.params.candidatureId)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json(convMessages);
});

app.get('/api/conversations/:userId', (req, res) => {
  const userId = req.params.userId;
  const candidatures = readJSON('candidatures.json');
  const annonces = readJSON('annonces.json');
  const users = readJSON('users.json');
  const messages = readJSON('messages.json');

  // Trouver les candidatures acceptées/terminées impliquant l'utilisateur
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

  let relevantCands = [];
  if (user.role === 'chercheur') {
    relevantCands = candidatures.filter(c =>
      c.chercheurId === userId && (c.statut === 'acceptee' || c.statut === 'terminee')
    );
  } else {
    // Fournisseur : trouver les candidatures à ses annonces
    const mesAnnonces = annonces.filter(a => a.fournisseurId === userId).map(a => a.id);
    relevantCands = candidatures.filter(c =>
      mesAnnonces.includes(c.annonceId) && (c.statut === 'acceptee' || c.statut === 'terminee')
    );
  }

  const conversations = relevantCands.map(cand => {
    const convMessages = messages.filter(m => m.candidatureId === cand.id);
    const lastMsg = convMessages.length > 0
      ? convMessages.sort((a, b) => new Date(b.date) - new Date(a.date))[0].contenu
      : null;

    // Trouver l'autre utilisateur
    let otherId;
    if (user.role === 'chercheur') {
      const annonce = annonces.find(a => a.id === cand.annonceId);
      otherId = annonce ? annonce.fournisseurId : null;
    } else {
      otherId = cand.chercheurId;
    }
    const otherUser = users.find(u => u.id === otherId) || { prenom: '?', nom: '?' };

    return {
      candidatureId: cand.id,
      otherUser: { prenom: otherUser.prenom, nom: otherUser.nom },
      lastMessage: lastMsg
    };
  });

  res.json(conversations);
});

// --- Utilitaires ---
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`GenZ'aide est lancé sur http://localhost:${PORT}`);
});
