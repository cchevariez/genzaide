const fs = require('fs');
const path = require('path');

const DATA_DIR = __dirname;

function writeJSON(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

// ============ UTILISATEURS ============
const users = [
  { id: 'usr_f01', role: 'fournisseur', nom: 'Martin', prenom: 'Catherine', email: 'catherine.martin@email.fr', commune: 'Lyon 3e', dateInscription: '2026-01-15T10:00:00Z', noteMoyenne: 4.5, nombreNotations: 3 },
  { id: 'usr_f02', role: 'fournisseur', nom: 'Dubois', prenom: 'Pierre', email: 'pierre.dubois@email.fr', commune: 'Lyon 6e', dateInscription: '2026-01-20T10:00:00Z', noteMoyenne: 4.0, nombreNotations: 2 },
  { id: 'usr_f03', role: 'fournisseur', nom: 'Bernard', prenom: 'Sylvie', email: 'sylvie.bernard@email.fr', commune: 'Villeurbanne', dateInscription: '2026-01-22T10:00:00Z', noteMoyenne: 5.0, nombreNotations: 1 },
  { id: 'usr_f04', role: 'fournisseur', nom: 'Leroy', prenom: 'Jacques', email: 'jacques.leroy@email.fr', commune: 'Caluire', dateInscription: '2026-02-01T10:00:00Z', noteMoyenne: 3.5, nombreNotations: 2 },
  { id: 'usr_f05', role: 'fournisseur', nom: 'Moreau', prenom: 'Anne', email: 'anne.moreau@email.fr', commune: 'Bron', dateInscription: '2026-02-05T10:00:00Z', noteMoyenne: 4.8, nombreNotations: 4 },

  { id: 'usr_c01', role: 'chercheur', nom: 'Petit', prenom: 'Lucas', email: 'lucas.petit@email.fr', commune: 'Lyon 7e', dateInscription: '2026-01-18T10:00:00Z', noteMoyenne: 4.7, nombreNotations: 3 },
  { id: 'usr_c02', role: 'chercheur', nom: 'Garcia', prenom: 'Emma', email: 'emma.garcia@email.fr', commune: 'Lyon 3e', dateInscription: '2026-01-25T10:00:00Z', noteMoyenne: 4.2, nombreNotations: 2 },
  { id: 'usr_c03', role: 'chercheur', nom: 'Roux', prenom: 'Nathan', email: 'nathan.roux@email.fr', commune: 'Villeurbanne', dateInscription: '2026-02-02T10:00:00Z', noteMoyenne: 5.0, nombreNotations: 1 },
  { id: 'usr_c04', role: 'chercheur', nom: 'Thomas', prenom: 'Chloé', email: 'chloe.thomas@email.fr', commune: 'Caluire', dateInscription: '2026-02-08T10:00:00Z', noteMoyenne: 0, nombreNotations: 0 },
];

// ============ ANNONCES ============
const annonces = [
  {
    id: 'ann_001', fournisseurId: 'usr_f01', type: 'jardinage', sousType: 'tondre_pelouse',
    commune: 'Lyon 3e', adresse: '45 rue Paul Bert', lat: 45.7580, lng: 4.8520,
    salaireHeure: 10, dureeHeures: 2,
    description: 'Recherche une personne pour tondre la pelouse dans un petit jardin à Lyon 3e. Durée estimée : 2 heures. Rémunération : 10 €/heure. Tondeuse fournie.',
    dateCreation: '2026-02-01T10:00:00Z', statut: 'ouverte', candidatures: ['usr_c01']
  },
  {
    id: 'ann_002', fournisseurId: 'usr_f01', type: 'menage', sousType: 'nettoyage_vitres',
    commune: 'Lyon 3e', adresse: '12 avenue Lacassagne', lat: 45.7545, lng: 4.8690,
    salaireHeure: 12, dureeHeures: 3,
    description: 'Nettoyage des vitres d\'un appartement (5 fenêtres). Produits et matériel fournis. Durée estimée : 3 heures. Rémunération : 12 €/heure.',
    dateCreation: '2026-02-03T14:00:00Z', statut: 'ouverte', candidatures: []
  },
  {
    id: 'ann_003', fournisseurId: 'usr_f02', type: 'courses', sousType: 'faire_courses',
    commune: 'Lyon 6e', adresse: '8 rue Vendôme', lat: 45.7690, lng: 4.8490,
    salaireHeure: 10, dureeHeures: 1,
    description: 'Faire les courses au marché de la Tête d\'Or. Liste fournie. Durée estimée : 1 heure. Rémunération : 10 €/heure.',
    dateCreation: '2026-02-04T09:00:00Z', statut: 'ouverte', candidatures: ['usr_c02']
  },
  {
    id: 'ann_004', fournisseurId: 'usr_f02', type: 'aide_numerique', sousType: 'installer_app',
    commune: 'Lyon 6e', adresse: '22 cours Vitton', lat: 45.7710, lng: 4.8530,
    salaireHeure: 15, dureeHeures: 1,
    description: 'Besoin d\'aide pour installer et configurer WhatsApp et une appli de visio sur une tablette. Durée estimée : 1 heure. Rémunération : 15 €/heure.',
    dateCreation: '2026-02-05T11:00:00Z', statut: 'ouverte', candidatures: []
  },
  {
    id: 'ann_005', fournisseurId: 'usr_f03', type: 'garde_animaux', sousType: 'promener_chien',
    commune: 'Villeurbanne', adresse: '5 rue du 4 Août', lat: 45.7670, lng: 4.8800,
    salaireHeure: 8, dureeHeures: 1,
    description: 'Promener un golden retriever de 3 ans au parc de la Feyssine. Chien très gentil et obéissant. Durée : 1 heure. Rémunération : 8 €/heure.',
    dateCreation: '2026-02-06T08:00:00Z', statut: 'ouverte', candidatures: ['usr_c03']
  },
  {
    id: 'ann_006', fournisseurId: 'usr_f03', type: 'bricolage', sousType: 'monter_meuble',
    commune: 'Villeurbanne', adresse: '15 avenue Henri Barbusse', lat: 45.7715, lng: 4.8850,
    salaireHeure: 12, dureeHeures: 2,
    description: 'Monter une étagère IKEA et fixer deux cadres au mur. Outils fournis. Durée estimée : 2 heures. Rémunération : 12 €/heure.',
    dateCreation: '2026-02-07T13:00:00Z', statut: 'ouverte', candidatures: []
  },
  {
    id: 'ann_007', fournisseurId: 'usr_f04', type: 'jardinage', sousType: 'ramasser_feuilles',
    commune: 'Caluire-et-Cuire', adresse: '3 chemin de Crépieux', lat: 45.7950, lng: 4.8580,
    salaireHeure: 10, dureeHeures: 3,
    description: 'Ramasser les feuilles mortes dans un grand jardin. Sacs poubelle fournis. Durée estimée : 3 heures. Rémunération : 10 €/heure.',
    dateCreation: '2026-02-07T15:00:00Z', statut: 'ouverte', candidatures: []
  },
  {
    id: 'ann_008', fournisseurId: 'usr_f04', type: 'soutien_scolaire', sousType: 'aide_devoirs',
    commune: 'Caluire-et-Cuire', adresse: '10 montée des Soldats', lat: 45.7900, lng: 4.8460,
    salaireHeure: 15, dureeHeures: 2,
    description: 'Aide aux devoirs pour un élève de 4ème en maths et français. 2 fois par semaine si possible. Durée : 2 heures. Rémunération : 15 €/heure.',
    dateCreation: '2026-02-08T10:00:00Z', statut: 'ouverte', candidatures: []
  },
  {
    id: 'ann_009', fournisseurId: 'usr_f05', type: 'menage', sousType: 'rangement',
    commune: 'Bron', adresse: '20 rue Maryse Bastié', lat: 45.7370, lng: 4.9100,
    salaireHeure: 10, dureeHeures: 4,
    description: 'Aider au tri et rangement d\'un garage. Pas de port de charges lourdes. Durée estimée : demi-journée. Rémunération : 10 €/heure.',
    dateCreation: '2026-02-09T09:00:00Z', statut: 'ouverte', candidatures: []
  },
  {
    id: 'ann_010', fournisseurId: 'usr_f05', type: 'garde_animaux', sousType: 'nourrir_chat',
    commune: 'Bron', adresse: '7 avenue Franklin Roosevelt', lat: 45.7310, lng: 4.9050,
    salaireHeure: 8, dureeHeures: 1,
    description: 'Nourrir deux chats et changer leur litière pendant notre absence (3 jours). Passage une fois par jour. Rémunération : 8 €/passage.',
    dateCreation: '2026-02-09T14:00:00Z', statut: 'ouverte', candidatures: []
  },
  {
    id: 'ann_011', fournisseurId: 'usr_f01', type: 'courses', sousType: 'porter_sacs',
    commune: 'Lyon 3e', adresse: '30 cours Gambetta', lat: 45.7530, lng: 4.8480,
    salaireHeure: 10, dureeHeures: 1,
    description: 'Aider à porter les courses du supermarché jusqu\'au 4ème étage (sans ascenseur). Durée : 1 heure. Rémunération : 10 €/heure.',
    dateCreation: '2026-02-10T11:00:00Z', statut: 'ouverte', candidatures: []
  },
  {
    id: 'ann_012', fournisseurId: 'usr_f03', type: 'aide_numerique', sousType: 'trier_photos',
    commune: 'Villeurbanne', adresse: '25 rue Francis de Pressensé', lat: 45.7680, lng: 4.8770,
    salaireHeure: 12, dureeHeures: 2,
    description: 'Trier et organiser des photos sur un ordinateur. Créer des albums par année. Durée estimée : 2 heures. Rémunération : 12 €/heure.',
    dateCreation: '2026-02-10T16:00:00Z', statut: 'ouverte', candidatures: []
  },
  // Une annonce terminée pour le suivi légal
  {
    id: 'ann_013', fournisseurId: 'usr_f01', type: 'jardinage', sousType: 'desherber',
    commune: 'Lyon 3e', adresse: '45 rue Paul Bert', lat: 45.7580, lng: 4.8520,
    salaireHeure: 10, dureeHeures: 2,
    description: 'Désherber les parterres du jardin. Gants fournis. Durée estimée : 2 heures. Rémunération : 10 €/heure.',
    dateCreation: '2026-01-20T10:00:00Z', statut: 'terminee', candidatures: ['usr_c01']
  },
];

// ============ CANDIDATURES ============
const candidatures = [
  { id: 'cand_001', annonceId: 'ann_001', chercheurId: 'usr_c01', dateCandidature: '2026-02-02T08:00:00Z', statut: 'acceptee' },
  { id: 'cand_002', annonceId: 'ann_003', chercheurId: 'usr_c02', dateCandidature: '2026-02-05T10:00:00Z', statut: 'en_attente' },
  { id: 'cand_003', annonceId: 'ann_005', chercheurId: 'usr_c03', dateCandidature: '2026-02-07T09:00:00Z', statut: 'en_attente' },
  { id: 'cand_004', annonceId: 'ann_013', chercheurId: 'usr_c01', dateCandidature: '2026-01-21T10:00:00Z', statut: 'terminee' },
];

// ============ NOTATIONS ============
const notations = [
  { id: 'not_001', annonceId: 'ann_013', noteurId: 'usr_f01', noteId: 'usr_c01', etoiles: 5, dateNotation: '2026-01-25T14:00:00Z' },
  { id: 'not_002', annonceId: 'ann_013', noteurId: 'usr_c01', noteId: 'usr_f01', etoiles: 4, dateNotation: '2026-01-25T15:00:00Z' },
  { id: 'not_003', annonceId: 'ann_001', noteurId: 'usr_f02', noteId: 'usr_c01', etoiles: 5, dateNotation: '2026-02-03T10:00:00Z' },
  { id: 'not_004', annonceId: 'ann_003', noteurId: 'usr_f01', noteId: 'usr_c02', etoiles: 4, dateNotation: '2026-02-04T10:00:00Z' },
  { id: 'not_005', annonceId: 'ann_005', noteurId: 'usr_c02', noteId: 'usr_f03', etoiles: 5, dateNotation: '2026-02-06T10:00:00Z' },
  { id: 'not_006', annonceId: 'ann_001', noteurId: 'usr_c03', noteId: 'usr_f04', etoiles: 3, dateNotation: '2026-02-07T10:00:00Z' },
  { id: 'not_007', annonceId: 'ann_003', noteurId: 'usr_f04', noteId: 'usr_c01', etoiles: 4, dateNotation: '2026-02-08T10:00:00Z' },
  { id: 'not_008', annonceId: 'ann_001', noteurId: 'usr_c01', noteId: 'usr_f01', etoiles: 5, dateNotation: '2026-02-03T11:00:00Z' },
  { id: 'not_009', annonceId: 'ann_005', noteurId: 'usr_f05', noteId: 'usr_c02', etoiles: 4, dateNotation: '2026-02-09T10:00:00Z' },
  { id: 'not_010', annonceId: 'ann_007', noteurId: 'usr_f05', noteId: 'usr_f05', etoiles: 5, dateNotation: '2026-02-10T10:00:00Z' },
  { id: 'not_011', annonceId: 'ann_009', noteurId: 'usr_f05', noteId: 'usr_f05', etoiles: 5, dateNotation: '2026-02-10T11:00:00Z' },
  { id: 'not_012', annonceId: 'ann_010', noteurId: 'usr_f05', noteId: 'usr_f05', etoiles: 4, dateNotation: '2026-02-10T12:00:00Z' },
  { id: 'not_013', annonceId: 'ann_011', noteurId: 'usr_f05', noteId: 'usr_f05', etoiles: 5, dateNotation: '2026-02-10T13:00:00Z' },
  { id: 'not_014', annonceId: 'ann_001', noteurId: 'usr_f04', noteId: 'usr_f04', etoiles: 4, dateNotation: '2026-02-08T10:00:00Z' },
  { id: 'not_015', annonceId: 'ann_003', noteurId: 'usr_f02', noteId: 'usr_f02', etoiles: 4, dateNotation: '2026-02-04T10:00:00Z' },
  { id: 'not_016', annonceId: 'ann_005', noteurId: 'usr_f02', noteId: 'usr_f02', etoiles: 4, dateNotation: '2026-02-06T10:00:00Z' },
];

// ============ SUIVI LÉGAL ============
const suiviLegal = [
  { id: 'suivi_001', chercheurId: 'usr_c01', annonceId: 'ann_013', heuresTravaillees: 2, montantGagne: 20, dateTravail: '2026-01-24' },
];

// ============ ÉCRITURE ============
writeJSON('users.json', users);
writeJSON('annonces.json', annonces);
writeJSON('candidatures.json', candidatures);
writeJSON('notations.json', notations);
writeJSON('suivi-legal.json', suiviLegal);

console.log('Données de démo générées avec succès !');
console.log(`  - ${users.length} utilisateurs`);
console.log(`  - ${annonces.length} annonces`);
console.log(`  - ${candidatures.length} candidatures`);
console.log(`  - ${notations.length} notations`);
console.log(`  - ${suiviLegal.length} entrées de suivi légal`);
