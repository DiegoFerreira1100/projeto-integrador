// ============================================
// FIREBASE-CONFIG.JS - Configuração do Firebase
// ============================================

// Configuração do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDT1I4M-p7StR5SghbemE1jNZQpy7oZqek",
  authDomain: "portal-c1e64.firebaseapp.com",
  projectId: "portal-c1e64",
  storageBucket: "portal-c1e64.firebasestorage.app",
  messagingSenderId: "946195631452",
  appId: "1:946195631452:web:2a15587cb1282301164599"
};

// Inicializar Firebase (USANDO A VERSÃO COMPATÍVEL - sem 'import')
firebase.initializeApp(firebaseConfig);

// Disponibilizar globalmente para os outros módulos usarem
window.auth = firebase.auth();
window.db = firebase.firestore();

console.log('🔥 Firebase configurado com sucesso!');
console.log('📁 Projeto:', firebaseConfig.projectId);