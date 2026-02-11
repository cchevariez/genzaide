// ============ API WRAPPER CENTRALISÉ ============

const API = {
  baseURL: '/api',

  async request(method, endpoint, data = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    const res = await fetch(this.baseURL + endpoint, options);
    const json = await res.json();
    if (!res.ok) {
      throw { status: res.status, ...json };
    }
    return json;
  },

  // Annonces
  getAnnonces(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', '/annonces' + (query ? '?' + query : ''));
  },
  getAnnonce(id) {
    return this.request('GET', `/annonces/${id}`);
  },
  createAnnonce(data) {
    return this.request('POST', '/annonces', data);
  },
  updateAnnonce(id, data) {
    return this.request('PUT', `/annonces/${id}`, data);
  },

  // Utilisateurs
  createUser(data) {
    return this.request('POST', '/users', data);
  },
  login(email) {
    return this.request('POST', '/auth/login', { email });
  },
  getUser(id) {
    return this.request('GET', `/users/${id}`);
  },

  // Candidatures
  createCandidature(data) {
    return this.request('POST', '/candidatures', data);
  },
  getCandidatures(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', '/candidatures' + (query ? '?' + query : ''));
  },
  updateCandidature(id, data) {
    return this.request('PUT', `/candidatures/${id}`, data);
  },

  // Notations
  createNotation(data) {
    return this.request('POST', '/notations', data);
  },
  getNotations(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', '/notations' + (query ? '?' + query : ''));
  },

  // Suivi légal
  getSuiviLegal(chercheurId) {
    return this.request('GET', `/suivi-legal/${chercheurId}`);
  }
};
