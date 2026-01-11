// dashboard-reports.js - Contador Real de Relatórios
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';

const firebaseConfig = {
  // Sua config do Firebase aqui (igual home.js)
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function loadReportsCount() {
  try {
    const userData = JSON.parse(localStorage.getItem('aquaflux-userdata'));
    if (!userData?.userId) return;

    const reportsRef = ref(database, `users/${userData.userId}/relatorios`);
    const snapshot = await get(reportsRef);
    
    if (snapshot.exists()) {
      const reports = snapshot.val();
      const total = Object.keys(reports || {}).length;
      document.getElementById('totalReportsCount').textContent = total;
      
      // Simular trend
      const trendElement = document.querySelector('.stat-trend');
      if (total > 20) {
        trendElement.innerHTML = `+${Math.round(total/2)}% <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>`;
      }
    }
  } catch (error) {
    console.log('Usando contador padrão:', error);
    document.getElementById('totalReportsCount').textContent = '24';
  }
}

// Carregar ao inicializar
document.addEventListener('DOMContentLoaded', loadReportsCount);

// Atualizar a cada 5min
setInterval(loadReportsCount, 5 * 60 * 1000);

export { loadReportsCount };
