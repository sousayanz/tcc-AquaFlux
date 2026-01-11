

// pump-scheduler.js - COMPLETO E FUNCIONAL
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, set, push, remove, update, onValue, off } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-check.js";


// Configuração Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBycnpeGWw-ecRDXLxdOr_NAMhfQzLWwp4",
    authDomain: "aqua-flux.firebaseapp.com",
    databaseURL: "https://aqua-flux-default-rtdb.firebaseio.com",
    projectId: "aqua-flux",
    storageBucket: "aqua-flux.firebasestorage.app",
    messagingSenderId: "188013221293",
    appId: "1:188013221293:web:c98dc4ef68966f95677d24",
    measurementId: "G-1651EB8ML3"
};


const app = initializeApp(firebaseConfig);


// ✅ INICIALIZAR APP CHECK
const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LdmsvsrAAAAAKsOGim9zoPQxWCs6GxdEupSHelo'),
    isTokenAutoRefreshEnabled: true
});


const database = getDatabase(app);


let currentUser = null;
let userDevices = [];
let userSchedules = [];
let currentEditingScheduleId = null;


// ============================
// INICIALIZAÇÃO
// ============================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔧 Pump Scheduler: DOM carregado');
    
    // ⭐ Aguardar sessão estar pronta
    const sessionReady = await waitForSession();
    
    if (sessionReady) {
        console.log('✅ Sessão encontrada - inicializando...');
        setupMainEvents();
        setupSlider();
        await loadUserDevices();
        renderDevicesList();
        await loadSchedules();
        renderSchedulesList();
    } else {
        console.error('❌ Sessão não encontrada');
        showNotification('Sessão expirada. Redirecionando...', 'error');
        setTimeout(() => window.location.href = 'login.html', 2000);
    }
});

// ⭐ Função auxiliar para esperar sessão
async function waitForSession() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 10;
        
        const checkSession = setInterval(() => {
            attempts++;
            const userData = localStorage.getItem('aquaflux-userdata');
            
            if (userData) {
                clearInterval(checkSession);
                try {
                    currentUser = JSON.parse(userData);
                    console.log('✅ Usuário carregado:', currentUser.nome);
                    
                    // Atualizar nome na interface
                    const userNameElement = document.getElementById('userName');
                    if (userNameElement) {
                        userNameElement.textContent = currentUser.nome;
                    }
                    
                    resolve(true);
                } catch (error) {
                    console.error('❌ Erro ao parsear sessão:', error);
                    resolve(false);
                }
            } else if (attempts >= maxAttempts) {
                clearInterval(checkSession);
                console.error('❌ Timeout aguardando sessão');
                resolve(false);
            }
        }, 500); // Verificar a cada 500ms
    });
}


// ============================
// AUTENTICAÇÃO
// ============================
function initializeUser() {
    console.log('Verificando usuário...');
    const userData = localStorage.getItem('aquaflux-userdata');
    if (!userData) {
        console.log('⚠️ Sessão não encontrada - aguardando home.js validar');
        // ⭐ NÃO REDIRECIONAR - home.js já faz isso
        return false;
    }
    
    try {
        currentUser = JSON.parse(userData);
        console.log('Usuário:', currentUser.nome);
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = currentUser.nome;
        }
        return true;
    } catch (error) {
        console.error('Erro ao carregar usuário', error);
        return false;
    }
}


// ============================
// NOTIFICAÇÕES HTML
// ============================
function showNotification(message, type = 'success') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  const container = document.getElementById('messageContainer');
  if (!container) {
    console.warn('Container de mensagens não encontrado, usando alert');
    alert(`${type.toUpperCase()}: ${message}`);
    return;
  }
  
  const msgEl = document.createElement('div');
  msgEl.className = `message ${type}`;
  msgEl.textContent = message;
  
  container.appendChild(msgEl);
  
  setTimeout(() => {
    if (msgEl.parentNode) {
      msgEl.parentNode.removeChild(msgEl);
    }
  }, 4000);
}


// ============================
// CONFIGURAÇÕES PRINCIPAIS
// ============================
function setupMainEvents() {
  console.log('Configurando eventos...');
  
  // Botão voltar
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.onclick = () => window.location.href = 'home.html';
  }
  
  // Botão logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
     localStorage.removeItem('aquaflux-userdata'); // ✅ CORRETO
      showNotification('Logout realizado com sucesso', 'success');
      setTimeout(() => window.location.href = 'login.html', 1000);
    };
  }
  
  // Botão adicionar dispositivo - CORRIGIDO
  const addDeviceBtn = document.getElementById('addDeviceBtn');
  if (addDeviceBtn) {
    addDeviceBtn.onclick = () => window.openDeviceModal();
    console.log('✅ Evento do botão addDevice configurado');
  } else {
    console.error('❌ Botão #addDeviceBtn não encontrado');
  }
  
  // Botão salvar configurações
  const saveConfigBtn = document.getElementById('saveConfigBtn');
  if (saveConfigBtn) {
    saveConfigBtn.onclick = () => saveConfigurations();
  }
  
  // Botão adicionar agendamento
  const addScheduleBtn = document.getElementById('addScheduleBtn');
  if (addScheduleBtn) {
    addScheduleBtn.onclick = () => openScheduleModal();
  }
  
  // Botões do modal de agendamento
  const saveScheduleBtn = document.getElementById('saveScheduleBtn');
  if (saveScheduleBtn) {
    saveScheduleBtn.onclick = () => saveSchedule();
  }
  
  const cancelScheduleBtn = document.getElementById('cancelScheduleBtn');
  if (cancelScheduleBtn) {
    cancelScheduleBtn.onclick = () => closeScheduleModal();
  }
  
  const closeModal = document.getElementById('closeModal');
  if (closeModal) {
    closeModal.onclick = () => closeScheduleModal();
  }
  
  // Botão confirmar adicionar dispositivo
  const addDeviceConfirm = document.getElementById('addDeviceConfirm');
  if (addDeviceConfirm) {
    addDeviceConfirm.onclick = () => window.addDevice();
    console.log('✅ Botão confirmar dispositivo configurado');
  }
  
  // Botão cancelar modal dispositivo
  const cancelDeviceBtn = document.getElementById('cancelDeviceBtn');
  if (cancelDeviceBtn) {
    cancelDeviceBtn.onclick = () => window.closeDeviceModal();
  }
  
  // Botão X fechar modal dispositivo
  const closeDeviceModalBtn = document.getElementById('closeDeviceModal');
  if (closeDeviceModalBtn) {
    closeDeviceModalBtn.onclick = () => window.closeDeviceModal();
  }
  
  // Fechar modal clicando fora
  const scheduleModal = document.getElementById('scheduleModal');
  if (scheduleModal) {
    scheduleModal.onclick = (e) => {
      if (e.target === scheduleModal) closeScheduleModal();
    };
  }
  
  const deviceModal = document.getElementById('deviceModal');
  if (deviceModal) {
    deviceModal.onclick = (e) => {
      if (e.target === deviceModal) window.closeDeviceModal();
    };
  }
  
  // ESC para fechar modais
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeScheduleModal();
      window.closeDeviceModal();
    }
  });
}


function setupSlider() {
  const slider = document.getElementById('moistureThreshold');
  const valueDisplay = document.getElementById('thresholdValue');
  
  if (slider && valueDisplay) {
    slider.addEventListener('input', function() {
      valueDisplay.textContent = this.value + '%';
    });
  }
}


// ============================
// DISPOSITIVOS
// ============================
async function loadUserDevices() {
  console.log('Carregando dispositivos...');
  
  try {
    const userRef = ref(database, `users/${currentUser.userId}/devices`);
    const snapshot = await get(userRef);
    
    userDevices = [];
    
    if (snapshot.exists()) {
      const devices = snapshot.val();
      Object.keys(devices).forEach(key => {
        userDevices.push({
          id: key,
          ...devices[key]
        });
      });
      console.log(`${userDevices.length} dispositivos encontrados`);
    } else {
      console.log('Nenhum dispositivo encontrado');
    }
    
    updateDeviceSelects();
    
  } catch (error) {
    console.error('Erro ao carregar dispositivos:', error);
    showNotification('Erro ao carregar dispositivos', 'error');
  }
}


function renderDevicesList() {
  console.log('Renderizando lista de dispositivos...');
  const devicesGrid = document.getElementById('devicesGrid');
  if (!devicesGrid) {
      console.error('Grid de dispositivos não encontrado');
      return;
  }

  devicesGrid.innerHTML = '';
  
  if (userDevices.length === 0) {
      devicesGrid.innerHTML = `
          <div class="no-devices" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: white;">
              <p style="font-size: 1.2rem; margin-bottom: 10px;">Nenhum dispositivo configurado</p>
              <p>Clique em "Adicionar Novo Dispositivo" para começar</p>
          </div>
      `;
      return;
  }

  userDevices.forEach(device => {
      const deviceCard = document.createElement('div');
      deviceCard.className = 'device-card';
      
      // Verificação robusta do status online
      const isOnline = device.online === true || 
                      device.online === 'true' || 
                      device.online === 1 || 
                      (device.online && device.online.toLowerCase() === 'online');
      
      deviceCard.innerHTML = `
          <div class="device-header">
              <div class="device-name">${escapeHtml(device.name || 'Dispositivo')}</div>
              <div class="device-status ${isOnline ? 'online' : 'offline'}">
                  ${isOnline ? '🟢 Online' : '🔴 Offline'}
              </div>
          </div>
          <div class="device-info">
              <p><strong>ID:</strong> <span class="code">${escapeHtml(device.arduinoId || 'N/A')}</span></p>
              <p><strong>Local:</strong> ${escapeHtml(device.location || 'Não informado')}</p>
              <p><strong>Fluxo:</strong> ${(parseFloat(device.waterFlow) || 5.0).toFixed(1)} L/min</p>
          </div>
          <div class="device-actions">
              <button class="device-btn primary" onclick="configureDevice('${device.id}')" title="Configurar dispositivo">
                  ⚙️ Configurar
              </button>
              <button class="device-btn secondary" onclick="removeDevice('${device.id}')" title="Remover dispositivo">
                  🗑️ Remover
              </button>
          </div>
      `;
      devicesGrid.appendChild(deviceCard);
  });
}


// Função auxiliar para escapar HTML (segurança)
function escapeHtml(text = '') {
  const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
  };
  return text.toString().replace(/[&<>"']/g, m => map[m]);
}


function updateDeviceSelects() {
  // Atualizar select de configuração
  const selectedDevice = document.getElementById('selectedDevice');
  if (selectedDevice) {
    const currentValue = selectedDevice.value;
    selectedDevice.innerHTML = '<option value="">Selecione um dispositivo</option>';
    
    userDevices.forEach(device => {
      const option = document.createElement('option');
      option.value = device.id;
      option.textContent = `${device.name} (${device.arduinoId})`;
      selectedDevice.appendChild(option);
    });
    
    if (currentValue) selectedDevice.value = currentValue;
    
    // Event listener
    selectedDevice.onchange = loadDeviceConfig;
  }
  
  // Atualizar select de agendamento
  const scheduleDevice = document.getElementById('scheduleDevice');
  if (scheduleDevice) {
    scheduleDevice.innerHTML = '<option value="">Selecione um dispositivo</option>';
    
    userDevices.forEach(device => {
      const option = document.createElement('option');
      option.value = device.id;
      option.textContent = `${device.name} (${device.arduinoId})`;
      scheduleDevice.appendChild(option);
    });
  }
  
  setupRealtimeStatus();
}


function setupRealtimeStatus() {
  // Remove listeners antigos para evitar duplicatas
  if (window.deviceListeners) {
      Object.values(window.deviceListeners).forEach(unsub => unsub());
  }
  
  window.deviceListeners = {};
  
  userDevices.forEach(device => {
      const arduinoRef = ref(database, `arduinos/${device.arduinoId}`);
      const listener = onValue(arduinoRef, (snapshot) => {
          if (snapshot.exists()) {
              const arduinoData = snapshot.val();
              const deviceIndex = userDevices.findIndex(d => d.id === device.id);
              if (deviceIndex !== -1) {
                  userDevices[deviceIndex].online = arduinoData.online ?? false;
                  renderDevicesList();
              }
          }
      });
      window.deviceListeners[device.id] = listener;
  });
}


function loadDeviceConfig() {
  const selectedDevice = document.getElementById('selectedDevice');
  const deviceId = selectedDevice?.value;
  
  if (!deviceId) return;
  
  const device = userDevices.find(d => d.id === deviceId);
  if (!device) return;
  
  console.log('Carregando configurações:', device.name);
  
  const deviceName = document.getElementById('deviceName');
  const waterFlow = document.getElementById('waterFlow');
  const moistureThreshold = document.getElementById('moistureThreshold');
  const thresholdValue = document.getElementById('thresholdValue');
  const autoMode = document.getElementById('autoMode');
  const weatherSync = document.getElementById('weatherSync');
  
  if (deviceName) deviceName.value = device.name || '';
  if (waterFlow) waterFlow.value = device.waterFlow || 5.0;
  if (moistureThreshold) moistureThreshold.value = device.moistureThreshold || 30;
  if (thresholdValue) thresholdValue.textContent = (device.moistureThreshold || 30) + '%';
  if (autoMode) autoMode.checked = device.autoMode || false;
  if (weatherSync) weatherSync.checked = device.weatherSync || false;
}


async function saveConfigurations() {
  console.log('Salvando configurações...');
  
  const selectedDevice = document.getElementById('selectedDevice');
  const deviceName = document.getElementById('deviceName');
  const waterFlow = document.getElementById('waterFlow');
  const moistureThreshold = document.getElementById('moistureThreshold');
  const autoMode = document.getElementById('autoMode');
  const weatherSync = document.getElementById('weatherSync');
  
  const deviceId = selectedDevice?.value;
  const name = deviceName?.value.trim();
  const flow = parseFloat(waterFlow?.value) || 5.0;
  const threshold = parseInt(moistureThreshold?.value) || 30;
  const auto = autoMode?.checked || false;
  const weather = weatherSync?.checked || false;
  
  if (!deviceId) {
    showNotification('Selecione um dispositivo para configurar', 'error');
    return;
  }
  
  if (!name) {
    showNotification('Nome do dispositivo é obrigatório', 'error');
    return;
  }
  
  const saveBtn = document.getElementById('saveConfigBtn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ Salvando...';
  }
  
  try {
    const updates = {
      name: name,
      waterFlow: flow,
      moistureThreshold: threshold,
      autoMode: auto,
      weatherSync: weather,
      lastUpdated: new Date().toISOString()
    };
    
    const deviceRef = ref(database, `users/${currentUser.userId}/devices/${deviceId}`);
    await update(deviceRef, updates);
    
    console.log('✅ Configurações salvas');
    showNotification('✅ Configurações salvas com sucesso!', 'success');
    
    await loadUserDevices();
    renderDevicesList();
    
  } catch (error) {
    console.error('Erro ao salvar:', error);
    showNotification('❌ Erro ao salvar configurações', 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Salvar Configurações';
    }
  }
}


// ============================
// MODAL DISPOSITIVO - CORRIGIDO
// ============================
window.openDeviceModal = function() {
  console.log('📂 Abrindo modal de dispositivo...');
  
  const modal = document.getElementById('deviceModal');
  if (!modal) {
    showNotification('Erro: Modal não encontrado', 'error');
    console.error('❌ Modal #deviceModal não existe no DOM');
    return;
  }
  
  // Limpar campos
  const nameField = document.getElementById('newDeviceName');
  const idField = document.getElementById('deviceId');
  const locationField = document.getElementById('deviceLocation');
  
  console.log('Campos encontrados:', {
    nameField: !!nameField,
    idField: !!idField,
    locationField: !!locationField
  });
  
  if (nameField) nameField.value = '';
  if (idField) idField.value = '';
  if (locationField) locationField.value = '';
  
  modal.classList.add('active');
  
  setTimeout(() => {
    if (nameField) nameField.focus();
  }, 100);
  
  console.log('✅ Modal aberto com sucesso');
};


window.closeDeviceModal = function() {
  console.log('🚪 Fechando modal de dispositivo...');
  const modal = document.getElementById('deviceModal');
  if (modal) {
    modal.classList.remove('active');
  }
};
// Abrir modal para EDITAR EXISTENTE
window.openDeviceModalForEdit = function(deviceId) {
  console.log('📝 Abrindo modal para editar dispositivo:', deviceId);
  
  const device = userDevices.find(d => d.id === deviceId);
  if (!device) {
    showNotification('Dispositivo não encontrado', 'error');
    return;
  }
  
  const modal = document.getElementById('deviceModal');
  if (!modal) return;
  
  // Elementos
  const nameField = document.getElementById('newDeviceName');
  const idInput = document.getElementById('deviceIdInput');
  const idDisplay = document.getElementById('deviceIdDisplay');
  const locationField = document.getElementById('deviceLocation');
  const title = document.getElementById('deviceModalTitle');
  const confirmBtn = document.getElementById('addDeviceConfirm');
  
  // Grupos de campos
  const idInputGroup = document.getElementById('deviceIdInputGroup');
  const idDisplayGroup = document.getElementById('deviceIdDisplayGroup');
  
  // Preencher campos
  if (nameField) {
    nameField.value = device.name || '';
    nameField.dataset.editingId = deviceId;
  }
  
  // ✅ ATUALIZAR TEXTO (não mais value)
  if (idDisplay) {
    idDisplay.textContent = device.arduinoId || '';
  }
  
  if (locationField) locationField.value = device.location || '';
  
  // MODO EDITAR: Esconder input editável, mostrar readonly
  if (idInputGroup) idInputGroup.style.display = 'none';
  if (idDisplayGroup) idDisplayGroup.style.display = 'block';
  
  // Atualizar textos
  if (title) title.textContent = 'Editar Dispositivo';
  if (confirmBtn) confirmBtn.textContent = 'Salvar Alterações';
  
  modal.classList.add('active');
  
  setTimeout(() => {
    if (nameField) nameField.focus();
  }, 100);
  
  console.log('✅ Modal aberto (modo: editar)');
};



window.addDevice = async function() {
  console.log('➕ Adicionando dispositivo...');
  
  // BUSCAR CAMPOS
  const nameField = document.getElementById('newDeviceName');
  const idField = document.getElementById('deviceId');
  const locationField = document.getElementById('deviceLocation');
  
  console.log('Campos capturados:', {
    nameField: !!nameField,
    idField: !!idField,
    locationField: !!locationField
  });
  
  // VALIDAR SE OS CAMPOS EXISTEM
  if (!nameField) {
    showNotification('❌ Campo "Nome" não encontrado no HTML', 'error');
    console.error('Campo #newDeviceName não existe');
    return;
  }
  
  if (!idField) {
    showNotification('❌ Campo "ID do ESP" não encontrado no HTML', 'error');
    console.error('Campo #deviceId não existe');
    
    // Debug: mostrar todos os inputs
    console.log('⚠️ Todos os inputs na página:');
    document.querySelectorAll('input').forEach((inp, i) => {
      console.log(`  ${i}: id="${inp.id}" placeholder="${inp.placeholder}"`);
    });
    return;
  }
  
  // CAPTURAR VALORES
  const name = nameField.value.trim();
  const arduinoId = idField.value.trim().toUpperCase();
  const location = locationField ? locationField.value.trim() : '';
  
  console.log('Valores capturados:', { 
    name, 
    arduinoId, 
    location 
  });
  
  // VALIDAÇÃO
  if (!name) {
    showNotification('⚠️ Digite o nome do dispositivo', 'error');
    nameField.focus();
    return;
  }
  
  if (!arduinoId) {
    showNotification('⚠️ Digite o ID do ESP\n\nExemplo: ESP-001', 'error');
    idField.focus();
    return;
  }
  
  if (!arduinoId.match(/^[A-Z0-9_-]+$/)) {
    showNotification('⚠️ ID deve conter apenas letras maiúsculas, números, underscore (_) e hífen (-)', 'error');
    idField.focus();
    return;
  }
  
  // DESABILITAR BOTÃO DURANTE PROCESSAMENTO
  const confirmBtn = document.getElementById('addDeviceConfirm');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = '⏳ Adicionando...';
  }
  
  try {
    // Verificar se ID já existe
    const arduinoRef = ref(database, `arduinos/${arduinoId}`);
    const arduinoSnapshot = await get(arduinoRef);
    
    if (arduinoSnapshot.exists()) {
      const existingData = arduinoSnapshot.val();
      if (existingData.userId && existingData.userId !== currentUser.userId) {
        throw new Error(`ID "${arduinoId}" já está em uso por outro usuário`);
      }
    }
    
    const deviceData = {
      name: name,
      arduinoId: arduinoId,
      location: location || 'Não informado',
      createdAt: new Date().toISOString(),
      active: true,
      waterFlow: 5.0,
      moistureThreshold: 30,
      autoMode: false,
      weatherSync: false,
      online: false
    };
    
    // Salvar dispositivo
    const userDeviceRef = ref(database, `users/${currentUser.userId}/devices`);
    const newDeviceRef = push(userDeviceRef);
    await set(newDeviceRef, deviceData);
    
    // Vincular Arduino
    await set(arduinoRef, {
      userId: currentUser.userId,
      deviceName: name,
      lastLinked: new Date().toISOString(),
      online: false,
      state: false,
      firmware: "1.0.0"
    });
    
    console.log('✅ Dispositivo adicionado com sucesso');
    showNotification(`✅ Dispositivo "${name}" adicionado com sucesso!`, 'success');
    
    window.closeDeviceModal();
    await loadUserDevices();
    renderDevicesList();
    
  } catch (error) {
    console.error('❌ Erro ao adicionar:', error);
    showNotification(`❌ ${error.message}`, 'error');
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Adicionar Dispositivo';
    }
  }
};


window.configureDevice = function(deviceId) {
  console.log('Configurando dispositivo:', deviceId);
  
  const selectedDevice = document.getElementById('selectedDevice');
  if (selectedDevice) {
    selectedDevice.value = deviceId;
    loadDeviceConfig();
    
    document.querySelector('.config-section')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
    
    showNotification('Dispositivo selecionado para configuração', 'success');
  }
};


window.removeDevice = async function(deviceId) {
  const device = userDevices.find(d => d.id === deviceId);
  if (!device) return;
  
  const confirmDelete = confirm(
    `⚠️ Tem certeza que deseja remover o dispositivo "${device.name}"?\n\n` +
    `ID: ${device.arduinoId}\n` +
    `Local: ${device.location || 'Não informado'}\n\n` +
    `Esta ação não pode ser desfeita.`
  );
  
  if (!confirmDelete) return;
  
  try {
    // Desvincular Arduino
    const arduinoRef = ref(database, `arduinos/${device.arduinoId}`);
    await update(arduinoRef, {
      userId: null,
      deviceName: null,
      lastLinked: null
    });
    
    // Remover dispositivo
    const deviceRef = ref(database, `users/${currentUser.userId}/devices/${deviceId}`);
    await remove(deviceRef);
    
    console.log('✅ Dispositivo removido');
    showNotification(`✅ Dispositivo "${device.name}" removido com sucesso!`, 'success');
    
    await loadUserDevices();
    renderDevicesList();
    
    // Limpar seleção se necessário
    const selectedDevice = document.getElementById('selectedDevice');
    if (selectedDevice?.value === deviceId) {
      selectedDevice.value = '';
      
      const deviceName = document.getElementById('deviceName');
      const waterFlow = document.getElementById('waterFlow');
      const moistureThreshold = document.getElementById('moistureThreshold');
      const thresholdValue = document.getElementById('thresholdValue');
      const autoMode = document.getElementById('autoMode');
      const weatherSync = document.getElementById('weatherSync');
      
      if (deviceName) deviceName.value = '';
      if (waterFlow) waterFlow.value = 5.0;
      if (moistureThreshold) moistureThreshold.value = 30;
      if (thresholdValue) thresholdValue.textContent = '30%';
      if (autoMode) autoMode.checked = false;
      if (weatherSync) weatherSync.checked = false;
    }
    
  } catch (error) {
    console.error('Erro ao remover:', error);
    showNotification('❌ Erro ao remover dispositivo', 'error');
  }
};


// ============================
// AGENDAMENTOS
// ============================
async function loadSchedules() {
  console.log('Carregando agendamentos...');
  
  try {
    const schedulesRef = ref(database, `users/${currentUser.userId}/schedules`);
    const snapshot = await get(schedulesRef);
    
    userSchedules = [];
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.keys(data).forEach(key => {
        userSchedules.push({
          id: key,
          ...data[key]
        });
      });
      console.log(`${userSchedules.length} agendamentos encontrados`);
    } else {
      console.log('Nenhum agendamento encontrado');
    }
    
  } catch (error) {
    console.error('Erro ao carregar agendamentos:', error);
    showNotification('Erro ao carregar agendamentos', 'error');
  }
}


function renderSchedulesList() {
  console.log('Renderizando agendamentos...');
  
  const listDiv = document.getElementById('schedulesList');
  if (!listDiv) return;
  
  listDiv.innerHTML = '';
  
  if (userSchedules.length === 0) {
    listDiv.innerHTML = `
      <div style="text-align: center; padding: 40px; background: rgba(255,255,255,0.95); border-radius: 15px; color: #666;">
        <p style="font-size: 1.1rem; margin-bottom: 10px;">📅 Nenhum agendamento criado</p>
        <p>Clique em "Novo Agendamento" para começar</p>
      </div>
    `;
    return;
  }
  
  userSchedules.forEach(sch => {
    const device = userDevices.find(d => d.id === sch.deviceId);
    const deviceName = device ? device.name : 'Dispositivo desconhecido';
    const dias = (sch.days || []).map(d => ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][+d]).join(', ');
    
    const scheduleItem = document.createElement('div');
    scheduleItem.className = 'schedule-item';
    scheduleItem.innerHTML = `
      <div class="schedule-info">
        <div class="schedule-device">
          <strong>📱 Dispositivo:</strong> ${deviceName}
        </div>
        <div class="schedule-details" style="margin-top: 8px; color: #666;">
          <span><strong>⏰ Início:</strong> ${sch.start || sch.time || 'N/A'}</span> · 
          <span><strong>⏱️ Fim:</strong> ${sch.end || 'N/A'}</span> · 
          <span><strong>📆 Dias:</strong> ${dias || 'N/A'}</span> · 
          <span><strong>Status:</strong> ${sch.active ? '✅ Ativo' : '⏸️ Inativo'}</span>
        </div>
      </div>
      <div class="schedule-actions">
        <button class="btn btn-primary" onclick="editSchedule('${sch.id}')">
          ✏️ Editar
        </button>
        <button class="btn btn-secondary" onclick="toggleScheduleActive('${sch.id}')">
          ${sch.active ? '⏸️ Desativar' : '▶️ Ativar'}
        </button>
        <button class="btn btn-secondary" onclick="deleteSchedule('${sch.id}')" style="background: #dc3545;">
          🗑️ Excluir
        </button>
      </div>
    `;
    listDiv.appendChild(scheduleItem);
  });
}


// ============================
// MODAL AGENDAMENTO
// ============================
function openScheduleModal(editMode = false, schedule = null) {
  console.log('Abrindo modal de agendamento...');
  
  const modal = document.getElementById('scheduleModal');
  const title = document.getElementById('modalTitle');
  
  if (!modal) {
    showNotification('Erro: Modal não encontrado', 'error');
    return;
  }
  
  // Atualizar título
  if (title) {
    title.textContent = editMode ? 'Editar Agendamento' : 'Novo Agendamento';
  }
  
  // Limpar ou preencher campos
  const scheduleDevice = document.getElementById('scheduleDevice');
  const scheduleStart = document.getElementById('scheduleStart');
  const scheduleEnd = document.getElementById('scheduleEnd');
  const scheduleActive = document.getElementById('scheduleActive');
  const dayCheckboxes = document.querySelectorAll('.day-checkbox input[type="checkbox"]');
  
  if (editMode && schedule) {
    currentEditingScheduleId = schedule.id;
    
    if (scheduleDevice) scheduleDevice.value = schedule.deviceId || '';
    if (scheduleStart) scheduleStart.value = schedule.start || schedule.time || '';
    if (scheduleEnd) scheduleEnd.value = schedule.end || '';
    if (scheduleActive) scheduleActive.checked = schedule.active !== false;
    
    // Marcar dias
    dayCheckboxes.forEach(cb => {
      cb.checked = (schedule.days || []).includes(cb.value);
    });
  } else {
    currentEditingScheduleId = null;
    
    if (scheduleDevice) scheduleDevice.value = '';
    if (scheduleStart) scheduleStart.value = '';
    if (scheduleEnd) scheduleEnd.value = '';
    if (scheduleActive) scheduleActive.checked = true;
    
    dayCheckboxes.forEach(cb => cb.checked = false);
  }
  
  modal.classList.add('active');
}


function closeScheduleModal() {
  console.log('Fechando modal de agendamento...');
  const modal = document.getElementById('scheduleModal');
  if (modal) {
    modal.classList.remove('active');
  }
  currentEditingScheduleId = null;
}


async function saveSchedule() {
  console.log('Salvando agendamento...');
  
  const scheduleDevice = document.getElementById('scheduleDevice');
  const scheduleStart = document.getElementById('scheduleStart');
  const scheduleEnd = document.getElementById('scheduleEnd');
  const scheduleActive = document.getElementById('scheduleActive');
  const dayCheckboxes = document.querySelectorAll('.day-checkbox input[type="checkbox"]:checked');
  
  const deviceId = scheduleDevice?.value;
  const start = scheduleStart?.value;
  const end = scheduleEnd?.value;
  const active = scheduleActive?.checked !== false;
  const days = Array.from(dayCheckboxes).map(cb => cb.value);
  
  if (!deviceId) {
    showNotification('⚠️ Selecione um dispositivo', 'error');
    return;
  }
  
  if (!start || !end) {
    showNotification('⚠️ Defina horário de início e fim', 'error');
    return;
  }
  
  if (days.length === 0) {
    showNotification('⚠️ Selecione pelo menos um dia da semana', 'error');
    return;
  }
  
  const saveBtn = document.getElementById('saveScheduleBtn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ Salvando...';
  }
  
  try {
    const scheduleData = {
      deviceId: deviceId,
      start: start,
      end: end,
      days: days,
      active: active,
      updatedAt: new Date().toISOString()
    };
    
    if (currentEditingScheduleId) {
      // Editar existente
      const scheduleRef = ref(database, `users/${currentUser.userId}/schedules/${currentEditingScheduleId}`);
      await update(scheduleRef, scheduleData);
      showNotification('✅ Agendamento atualizado com sucesso!', 'success');
    } else {
      // Criar novo
      scheduleData.createdAt = new Date().toISOString();
      const schedulesRef = ref(database, `users/${currentUser.userId}/schedules`);
      const newScheduleRef = push(schedulesRef);
      await set(newScheduleRef, scheduleData);
      showNotification('✅ Agendamento criado com sucesso!', 'success');
    }
    
    closeScheduleModal();
    await loadSchedules();
    renderSchedulesList();
    
  } catch (error) {
    console.error('Erro ao salvar agendamento:', error);
    showNotification('❌ Erro ao salvar agendamento', 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Salvar';
    }
  }
}


window.editSchedule = function(scheduleId) {
  console.log('Editando agendamento:', scheduleId);
  const schedule = userSchedules.find(s => s.id === scheduleId);
  if (schedule) {
    openScheduleModal(true, schedule);
  }
};


window.toggleScheduleActive = async function(scheduleId) {
  console.log('Alternando status do agendamento:', scheduleId);
  
  const schedule = userSchedules.find(s => s.id === scheduleId);
  if (!schedule) {
    showNotification('❌ Agendamento não encontrado', 'error');
    return;
  }
  
  try {
    const newActiveState = !schedule.active;
    const scheduleRef = ref(database, `users/${currentUser.userId}/schedules/${scheduleId}`);
    await update(scheduleRef, { 
      active: newActiveState,
      updatedAt: new Date().toISOString()
    });
    
    showNotification(
      newActiveState ? '✅ Agendamento ativado!' : '⏸️ Agendamento desativado!', 
      'success'
    );
    
    await loadSchedules();
    renderSchedulesList();
    
  } catch (error) {
    console.error('Erro ao alternar status:', error);
    showNotification('❌ Erro ao alterar status do agendamento', 'error');
  }
};


window.deleteSchedule = async function(scheduleId) {
  console.log('Excluindo agendamento:', scheduleId);
  
  const schedule = userSchedules.find(s => s.id === scheduleId);
  if (!schedule) return;
  
  const device = userDevices.find(d => d.id === schedule.deviceId);
  const deviceName = device ? device.name : 'Dispositivo';
  
  const confirmDelete = confirm(
    `⚠️ Tem certeza que deseja excluir este agendamento?\n\n` +
    `Dispositivo: ${deviceName}\n` +
    `Horário: ${schedule.start || schedule.time} - ${schedule.end || ''}\n\n` +
    `Esta ação não pode ser desfeita.`
  );
  
  if (!confirmDelete) return;
  
  try {
    const scheduleRef = ref(database, `users/${currentUser.userId}/schedules/${scheduleId}`);
    await remove(scheduleRef);
    
    console.log('✅ Agendamento excluído');
    showNotification('✅ Agendamento excluído com sucesso!', 'success');
    
    await loadSchedules();
    renderSchedulesList();
    
  } catch (error) {
    console.error('Erro ao excluir:', error);
    showNotification('❌ Erro ao excluir agendamento', 'error');
  }
};




// ============================
// LOG FINAL
// ============================
console.log('✅ pump-scheduler.js carregado com sucesso');
console.log('✅ Funções expostas:', {
  openDeviceModal: typeof window.openDeviceModal,
  closeDeviceModal: typeof window.closeDeviceModal,
  addDevice: typeof window.addDevice
});
// ====================================================================
// 📊 SISTEMA DE ESTATÍSTICAS DOS CARDS - VERSÃO SEGURA
// Adicionar ao FINAL do pump-scheduler.js
// ====================================================================

/**
 * Conta quantos dispositivos estão online
 */
async function countActiveDevices() {
    let activeCount = 0;
    
    for (const device of userDevices) {
        if (!device.arduinoId) continue;
        
        try {
            const arduinoRef = ref(database, `arduinos/${device.arduinoId}`);
            const snapshot = await get(arduinoRef);
            
            if (snapshot.exists()) {
                const arduinoData = snapshot.val();
                if (arduinoData.online === true) {
                    activeCount++;
                }
            }
        } catch (error) {
            console.error(`Erro ao verificar dispositivo ${device.arduinoId}:`, error);
        }
    }
    
    return activeCount;
}

/**
 * Conta quantos agendamentos estão ativos
 */
function countActiveSchedules() {
    return userSchedules.filter(schedule => schedule.active !== false).length;
}

/**
 * Calcula a vazão total de todos os dispositivos ATIVOS
 */
async function calculateTotalFlow() {
    let totalFlow = 0;
    
    for (const device of userDevices) {
        if (!device.arduinoId) continue;
        
        try {
            const arduinoRef = ref(database, `arduinos/${device.arduinoId}`);
            const snapshot = await get(arduinoRef);
            
            if (snapshot.exists()) {
                const arduinoData = snapshot.val();
                
                if (arduinoData.online === true) {
                    const deviceFlow = parseFloat(device.waterFlow) || 5.0;
                    totalFlow += deviceFlow;
                }
            }
        } catch (error) {
            console.error(`Erro ao calcular vazão:`, error);
        }
    }
    
    return totalFlow;
}

/**
 * Atualiza o valor de um card específico
 */
function updateCardValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

/**
 * Atualiza os 4 cards principais do dashboard
 */
async function updateDashboardCards() {
    console.log('📊 Atualizando cards do dashboard...');
    
    try {
        // 1. Dispositivos Ativos
        const activeDevices = await countActiveDevices();
        updateCardValue('activeDevices', activeDevices);
        
        // 2. Total de Dispositivos
        updateCardValue('totalDevices', userDevices.length);
        
        // 3. Agendamentos Ativos
        const activeSchedules = countActiveSchedules();
        updateCardValue('activeSchedules', activeSchedules);
        
        // 4. Vazão Total
        const totalFlow = await calculateTotalFlow();
        updateCardValue('totalFlow', totalFlow.toFixed(1));
        
        console.log('✅ Cards atualizados:', {
            activeDevices,
            totalDevices: userDevices.length,
            activeSchedules,
            totalFlow: totalFlow.toFixed(1)
        });
        
    } catch (error) {
        console.error('❌ Erro ao atualizar cards:', error);
    }
}

/**
 * Configura atualização automática dos cards
 */
function setupDashboardCardsAutoUpdate() {
    console.log('🔄 Configurando atualização automática dos cards...');
    
    // Atualizar a cada 10 segundos
    setInterval(async () => {
        await updateDashboardCards();
    }, 10000);
}

// ====================================================================
// 🚀 INICIALIZAR SISTEMA DE CARDS (executar automaticamente)
// ====================================================================
(async function initializeDashboardCards() {
    console.log('🚀 Inicializando sistema de cards...');
    
    // Aguardar um pouco para garantir que tudo carregou
    setTimeout(async () => {
        if (currentUser && userDevices.length >= 0) {
            await updateDashboardCards();
            setupDashboardCardsAutoUpdate();
            console.log('✅ Sistema de cards inicializado!');
        } else {
            console.log('⏳ Aguardando carregamento dos dados...');
            // Tentar novamente após 2 segundos
            setTimeout(initializeDashboardCards, 2000);
        }
    }, 1500);
})();

console.log('✅ Módulo de estatísticas dos cards carregado!');
