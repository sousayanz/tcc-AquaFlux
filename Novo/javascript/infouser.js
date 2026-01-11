

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, set, update, remove } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-check.js";

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

let currentUserData = null;
let firebaseUserData = null;
let editingStates = {
  basicInfo: false,
  address: false
};

// 🔔 SISTEMA DE TOAST (mesmo do dashboard)
function showToast(message, type = 'info', title = null, duration = 5000) {
    let container = document.getElementById('toast-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    const defaultTitles = {
        success: 'Sucesso!',
        error: 'Erro!',
        warning: 'Atenção!',
        info: 'Informação'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${title || defaultTitles[type]}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">×</button>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toast));

    if (duration > 0) {
        setTimeout(() => removeToast(toast), duration);
    }

    return toast;
}

function removeToast(toast) {
    toast.classList.add('removing');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

// Alias para compatibilidade
window.showMessage = showToast;
window.showNotification = showToast;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 InfoUser: DOM carregado - Aguardando sessão...');
    
    // ⭐ ESCUTAR O EVENTO DE SESSÃO PRONTA
    window.addEventListener('aquaflux:session-ready', (event) => {
        console.log('✅ InfoUser: Evento de sessão recebido!', event.detail);
        
        const userData = localStorage.getItem('aquaflux-userdata');
        if (userData) {
            try {
                currentUserData = JSON.parse(userData);
                console.log('✅ InfoUser: Dados do usuário carregados', currentUserData);
                
                initializeUserInterface();
                loadUserData();
                setupEventListeners();
            } catch (error) {
                console.error('❌ InfoUser: Erro ao carregar dados', error);
            }
        }
    }, { once: true }); // ⭐ Executar apenas uma vez
    
    // ⚠️ FALLBACK: Verificar periodicamente caso o evento não dispare
    let fallbackTimeout = setTimeout(() => {
        console.log('⏳ InfoUser: Fallback - tentando sem evento...');
        const userData = localStorage.getItem('aquaflux-userdata');
        if (userData) {
            try {
                currentUserData = JSON.parse(userData);
                initializeUserInterface();
                loadUserData();
                setupEventListeners();
            } catch (error) {
                console.error('❌ Erro no fallback', error);
            }
        }
    }, 3000); // Aguardar 3 segundos
});




function initializeUserInterface() {
  console.log('Inicializando interface do usuário');
  
  // Atualizar header
  const headerUserName = document.getElementById('headerUserName');
  if (headerUserName) {
    headerUserName.textContent = currentUserData.nome || 'Usuário';
  }
  
  // Atualizar avatar
  const avatarCircle = document.getElementById('avatarCircle');
  if (avatarCircle) {
    avatarCircle.textContent = currentUserData.nome ? currentUserData.nome.charAt(0).toUpperCase() : 'U';
  }
  
  // Atualizar nome do perfil
  const profileName = document.getElementById('profileName');
  if (profileName) {
    profileName.textContent = currentUserData.nome || 'Nome do Usuário';
  }
}

async function loadUserData() {
  console.log('Carregando dados do usuário do Firebase');
  
  try {
    const userRef = ref(database, 'users/' + currentUserData.userId);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      firebaseUserData = snapshot.val();
      console.log('Dados carregados do Firebase:', firebaseUserData);
      
      populateUserForm(firebaseUserData);
      loadUserStats(firebaseUserData);
      calculateMembershipInfo(firebaseUserData);
      loadDevices(firebaseUserData);
    } else {
      console.error('Dados do usuário não encontrados no servidor');
      showNotification('Dados do usuário não encontrados no servidor', 'error');
    }
    
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    showNotification('Erro ao carregar informações do usuário', 'error');
  }
}

function calculateMembershipInfo(userData) {
  console.log('Calculando informações de membership');
  
  if (userData.dataCadastro) {
    const cadastroDate = new Date(userData.dataCadastro);
    const now = new Date();
    
    // Calcular dias desde o cadastro
    const diffTime = Math.abs(now - cadastroDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const accountAgeEl = document.getElementById('accountAge');
    if (accountAgeEl) {
      accountAgeEl.textContent = `${diffDays} dias`;
    }
    
    // Formatar data de membro desde (mês e ano)
    const options = { year: 'numeric', month: 'long' };
    const memberSinceEl = document.getElementById('memberSince');
    if (memberSinceEl) {
      memberSinceEl.textContent = cadastroDate.toLocaleDateString('pt-BR', options);
    }
  } else {
    const accountAgeEl = document.getElementById('accountAge');
    const memberSinceEl = document.getElementById('memberSince');
    
    if (accountAgeEl) accountAgeEl.textContent = 'N/A';
    if (memberSinceEl) memberSinceEl.textContent = 'Data não disponível';
  }
}

function populateUserForm(userData) {
  console.log('Preenchendo formulário com dados do usuário');
  
  // Dados básicos
  const fullName = document.getElementById('fullName');
  const displayName = document.getElementById('displayName');
  const birthDate = document.getElementById('birthDate');
  const gender = document.getElementById('gender');
  
  if (fullName) fullName.value = userData.nome || '';
  if (displayName) displayName.value = userData.nomeExibicao || userData.nome || '';
  if (birthDate) birthDate.value = userData.dataNascimento || '';
  if (gender) gender.value = userData.genero || '';
  
  // Informações protegidas
  const email = document.getElementById('email');
  const phone = document.getElementById('phone');
  const documentEl = document.getElementById('document');
  
  if (email) email.value = userData.email || '';
  if (phone) phone.value = formatPhone(userData.telefone) || '';
  if (documentEl) documentEl.value = formatDocument(userData.documento, userData.tipoCadastro) || '';
  
  // Endereço
  const zipCode = document.getElementById('zipCode');
  const street = document.getElementById('street');
  const number = document.getElementById('number');
  const complement = document.getElementById('complement');
  const neighborhood = document.getElementById('neighborhood');
  const city = document.getElementById('city');
  const state = document.getElementById('state');
  
  if (zipCode) zipCode.value = userData.endereco?.cep || '';
  if (street) street.value = userData.endereco?.rua || '';
  if (number) number.value = userData.endereco?.numero || '';
  if (complement) complement.value = userData.endereco?.complemento || '';
  if (neighborhood) neighborhood.value = userData.endereco?.bairro || '';
  if (city) city.value = userData.endereco?.cidade || '';
  if (state) state.value = userData.endereco?.estado || '';
  
  // Preferências
  const emailNotifications = document.getElementById('emailNotifications');
  const smsNotifications = document.getElementById('smsNotifications');
  const systemAlerts = document.getElementById('systemAlerts');
  
  if (emailNotifications) emailNotifications.checked = userData.preferencias?.emailNotifications !== false;
  if (smsNotifications) smsNotifications.checked = userData.preferencias?.smsNotifications || false;
  if (systemAlerts) systemAlerts.checked = userData.preferencias?.systemAlerts !== false;
}

function loadUserStats(userData) {
  console.log('Carregando estatísticas do usuário');
  
  // Total de logins
  const totalLogins = userData.totalLogins || 0;
  const totalLoginsEl = document.getElementById('totalLogins');
  if (totalLoginsEl) {
    totalLoginsEl.textContent = totalLogins.toString();
  }
  
  // Último login
  const lastLoginEl = document.getElementById('lastLogin');
  if (lastLoginEl) {
    if (userData.ultimoLogin) {
      const lastLogin = new Date(userData.ultimoLogin);
      lastLoginEl.textContent = 
        lastLogin.toLocaleDateString('pt-BR') + ' às ' + 
        lastLogin.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else {
      lastLoginEl.textContent = 'Primeiro acesso';
    }
  }
  
  // Dispositivos ativos
  const totalDevicesEl = document.getElementById('totalDevices');
  if (totalDevicesEl) {
    const dispositivosAtivos = userData.dispositivosArduino ? 
      Object.keys(userData.dispositivosArduino).length : 0;
    totalDevicesEl.textContent = dispositivosAtivos.toString();
  }
}

function loadDevices(userData) {
  const devicesList = document.getElementById('devicesList');
  if (!devicesList) return;

  if (userData.dispositivosArduino && Object.keys(userData.dispositivosArduino).length > 0) {
    devicesList.innerHTML = '';
    
    Object.entries(userData.dispositivosArduino).forEach(([deviceId, device]) => {
      const deviceElement = document.createElement('div');
      deviceElement.className = 'device-item';
      deviceElement.innerHTML = `
        <div class="device-icon">📱</div>
        <div class="device-details">
          <h4>${device.nome || 'Dispositivo Arduino'}</h4>
          <p>ID: ${deviceId}</p>
          <p>Status: ${device.ativo ? 'Ativo' : 'Inativo'}</p>
          <p>Última conexão: ${device.ultimaConexao ? new Date(device.ultimaConexao).toLocaleDateString('pt-BR') : 'Nunca'}</p>
        </div>
      `;
      devicesList.appendChild(deviceElement);
    });
  } else {
    devicesList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <p>📱 Nenhum dispositivo conectado</p>
        <p style="font-size: 0.9rem; margin-top: 10px;">Conecte um dispositivo Arduino para começar o monitoramento</p>
      </div>
    `;
  }
}

function setupEventListeners() {
  console.log('Configurando event listeners...');
  
  // Botão de voltar
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'home.html';
    });
    console.log('Event listener adicionado ao botão voltar');
  }
  
  // Botão de logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
    console.log('Event listener adicionado ao botão logout');
  }
  
  // Botão de edição para informações básicas
  const editBasicInfoBtn = document.getElementById('editBasicInfoBtn');
  if (editBasicInfoBtn) {
    editBasicInfoBtn.addEventListener('click', toggleBasicInfoEdit);
    console.log('Event listener adicionado ao botão de editar');
  }
  
  // Botões de salvar
  const saveBasicInfo = document.getElementById('saveBasicInfo');
  const saveAddressBtn = document.getElementById('saveAddressBtn');
  const savePreferencesBtn = document.getElementById('savePreferencesBtn');
  
  if (saveBasicInfo) {
    saveBasicInfo.addEventListener('click', saveBasicInfoHandler);
    saveBasicInfo.style.display = 'none';
    console.log('Event listener adicionado ao botão salvar info básica');
  }
  
  if (saveAddressBtn) {
    saveAddressBtn.addEventListener('click', saveAddress);
    console.log('Event listener adicionado ao botão salvar endereço');
  }
  
  if (savePreferencesBtn) {
    savePreferencesBtn.addEventListener('click', savePreferences);
    console.log('Event listener adicionado ao botão salvar preferências');
  }
  
  // Busca de CEP
  const cepLookupBtn = document.getElementById('cepLookupBtn');
  const zipCode = document.getElementById('zipCode');
  
  if (cepLookupBtn) {
    cepLookupBtn.addEventListener('click', lookupCEP);
  }
  if (zipCode) {
    zipCode.addEventListener('blur', lookupCEP);
    zipCode.addEventListener('input', maskCEP);
  }
  
  // Botões de modal - CORRIGIDOS
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const contactSupportBtn = document.getElementById('contactSupportBtn');
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', openPasswordModal);
    console.log('Event listener adicionado ao botão alterar senha');
  }
  
  if (contactSupportBtn) {
    contactSupportBtn.addEventListener('click', openSupportModal);
    console.log('Event listener adicionado ao botão contatar suporte');
  }
  
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', confirmDeleteAccount);
    console.log('Event listener adicionado ao botão excluir conta');
  }
  
  // Modal controls
  setupModalControls();
  
  // Validação de senha em tempo real
  const newPassword = document.getElementById('newPassword');
  if (newPassword) {
    newPassword.addEventListener('input', validatePasswordStrength);
  }
}

function setupModalControls() {
  // Modal de senha
  const closePasswordModal = document.getElementById('closePasswordModal');
  const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
  const savePasswordBtn = document.getElementById('savePasswordBtn');
  
  if (closePasswordModal) {
    closePasswordModal.addEventListener('click', closePasswordModalHandler);
  }
  if (cancelPasswordBtn) {
    cancelPasswordBtn.addEventListener('click', closePasswordModalHandler);
  }
  if (savePasswordBtn) {
    savePasswordBtn.addEventListener('click', changePassword);
  }
  
  // Modal de suporte
  const closeSupportModal = document.getElementById('closeSupportModal');
  const cancelSupportBtn = document.getElementById('cancelSupportBtn');
  const sendSupportBtn = document.getElementById('sendSupportBtn');
  
  if (closeSupportModal) {
    closeSupportModal.addEventListener('click', closeSupportModalHandler);
  }
  if (cancelSupportBtn) {
    cancelSupportBtn.addEventListener('click', closeSupportModalHandler);
  }
  if (sendSupportBtn) {
    sendSupportBtn.addEventListener('click', sendSupportMessage);
  }
  
  // Fechar modais ao clicar fora
  const passwordModal = document.getElementById('passwordModal');
  const supportModal = document.getElementById('supportModal');
  
  if (passwordModal) {
    passwordModal.addEventListener('click', (e) => {
      if (e.target === passwordModal) {
        closePasswordModalHandler();
      }
    });
  }
  
  if (supportModal) {
    supportModal.addEventListener('click', (e) => {
      if (e.target === supportModal) {
        closeSupportModalHandler();
      }
    });
  }
}

function toggleBasicInfoEdit() {
  console.log('Função toggleBasicInfoEdit chamada');
  
  const editBtn = document.getElementById('editBasicInfoBtn');
  const saveBtn = document.getElementById('saveBasicInfo');
  const basicInfoInputs = document.querySelectorAll('#basicInfoForm input, #basicInfoForm select');
  
  if (!editingStates.basicInfo) {
    // Entrar em modo de edição
    editingStates.basicInfo = true;
    
    if (editBtn) {
      editBtn.textContent = '❌ Cancelar';
      editBtn.classList.add('cancel-mode');
    }
    
    if (saveBtn) {
      saveBtn.style.display = 'block';
    }
    
    // Habilitar campos para edição
    basicInfoInputs.forEach(input => {
      input.removeAttribute('readonly');
      input.removeAttribute('disabled');
    });
    
    // Focar no primeiro campo editável
    const displayName = document.getElementById('displayName');
    if (displayName) {
      displayName.focus();
    }
    
    console.log('Modo de edição ativado');
  } else {
    // Cancelar edição
    cancelBasicInfoEdit();
  }
}

function cancelBasicInfoEdit() {
  console.log('Cancelando edição de info básica');
  
  const editBtn = document.getElementById('editBasicInfoBtn');
  const saveBtn = document.getElementById('saveBasicInfo');
  const basicInfoInputs = document.querySelectorAll('#basicInfoForm input, #basicInfoForm select');
  
  editingStates.basicInfo = false;
  
  if (editBtn) {
    editBtn.textContent = '✏️ Editar';
    editBtn.classList.remove('cancel-mode');
  }
  
  if (saveBtn) {
    saveBtn.style.display = 'none';
  }
  
  // Restaurar valores originais
  if (firebaseUserData) {
    populateBasicInfoFields(firebaseUserData);
  }
  
  // Tornar campos readonly/disabled novamente
  basicInfoInputs.forEach(input => {
    if (input.tagName === 'SELECT') {
      input.setAttribute('disabled', 'true');
    } else {
      input.setAttribute('readonly', 'true');
    }
  });
}

function populateBasicInfoFields(userData) {
  const fullName = document.getElementById('fullName');
  const displayName = document.getElementById('displayName');
  const birthDate = document.getElementById('birthDate');
  const gender = document.getElementById('gender');
  
  if (fullName) fullName.value = userData.nome || '';
  if (displayName) displayName.value = userData.nomeExibicao || userData.nome || '';
  if (birthDate) birthDate.value = userData.dataNascimento || '';
  if (gender) gender.value = userData.genero || '';
}

async function saveBasicInfoHandler() {
  console.log('Salvando informações básicas...');
  
  try {
    const fullName = document.getElementById('fullName');
    const displayName = document.getElementById('displayName');
    const birthDate = document.getElementById('birthDate');
    const gender = document.getElementById('gender');
    
    const updateData = {
      nome: fullName?.value.trim() || '',
      nomeExibicao: displayName?.value.trim() || '',
      dataNascimento: birthDate?.value || '',
      genero: gender?.value || ''
    };
    
    // Validações
    if (!updateData.nome) {
      showNotification('Nome completo é obrigatório!', 'error');
      return;
    }
    
    if (!updateData.nomeExibicao) {
      updateData.nomeExibicao = updateData.nome;
    }
    
    // Validar data de nascimento
    if (updateData.dataNascimento) {
      const birthDateObj = new Date(updateData.dataNascimento);
      const today = new Date();
      const age = today.getFullYear() - birthDateObj.getFullYear();
      
      if (age < 13 || age > 120) {
        showNotification('Data de nascimento inválida!', 'error');
        return;
      }
    }
    
    const userRef = ref(database, 'users/' + currentUserData.userId);
    await update(userRef, updateData);
    
    // Atualizar dados locais
    firebaseUserData = { ...firebaseUserData, ...updateData };
    currentUserData.nome = updateData.nome;
    localStorage.setItem('aquaflux_user_data', JSON.stringify(currentUserData));
    
    // Atualizar interface
    const headerUserName = document.getElementById('headerUserName');
    const profileName = document.getElementById('profileName');
    const avatarCircle = document.getElementById('avatarCircle');
    
    if (headerUserName) headerUserName.textContent = updateData.nome;
    if (profileName) profileName.textContent = updateData.nomeExibicao;
    if (avatarCircle) avatarCircle.textContent = updateData.nome.charAt(0).toUpperCase();
    
    // Sair do modo de edição
    cancelBasicInfoEdit();
    
    showNotification('Informações básicas atualizadas com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro ao salvar informações básicas:', error);
    showNotification('Erro ao salvar informações: ' + error.message, 'error');
  }
}

async function saveAddress() {
  console.log('Salvando endereço...');
  
  try {
    const zipCode = document.getElementById('zipCode');
    const street = document.getElementById('street');
    const number = document.getElementById('number');
    const complement = document.getElementById('complement');
    const neighborhood = document.getElementById('neighborhood');
    const city = document.getElementById('city');
    const state = document.getElementById('state');
    
    const addressData = {
      endereco: {
        cep: zipCode?.value.trim() || '',
        rua: street?.value.trim() || '',
        numero: number?.value.trim() || '',
        complemento: complement?.value.trim() || '',
        bairro: neighborhood?.value.trim() || '',
        cidade: city?.value.trim() || '',
        estado: state?.value || ''
      }
    };
    
    // Validação básica
    if (addressData.endereco.cep && addressData.endereco.cep.replace(/\D/g, '').length !== 8) {
      showNotification('CEP deve ter 8 dígitos!', 'error');
      return;
    }
    
    const userRef = ref(database, 'users/' + currentUserData.userId);
    await update(userRef, addressData);
    
    // Atualizar dados locais
    if (firebaseUserData) {
      firebaseUserData.endereco = addressData.endereco;
    }
    
    showNotification('Endereço salvo com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro ao salvar endereço:', error);
    showNotification('Erro ao salvar endereço: ' + error.message, 'error');
  }
}

async function savePreferences() {
  console.log('Salvando preferências...');
  
  try {
    const emailNotifications = document.getElementById('emailNotifications');
    const smsNotifications = document.getElementById('smsNotifications');
    const systemAlerts = document.getElementById('systemAlerts');
    
    const preferencesData = {
      preferencias: {
        emailNotifications: emailNotifications?.checked || false,
        smsNotifications: smsNotifications?.checked || false,
        systemAlerts: systemAlerts?.checked || false
      }
    };
    
    const userRef = ref(database, 'users/' + currentUserData.userId);
    await update(userRef, preferencesData);
    
    // Atualizar dados locais
    if (firebaseUserData) {
      firebaseUserData.preferencias = preferencesData.preferencias;
    }
    
    showNotification('Preferências salvas com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro ao salvar preferências:', error);
    showNotification('Erro ao salvar preferências: ' + error.message, 'error');
  }
}

async function lookupCEP() {
  const cepInput = document.getElementById('zipCode');
  if (!cepInput) return;
  
  const cep = cepInput.value.replace(/\D/g, '');
  
  if (cep.length !== 8) return;
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      showNotification('CEP não encontrado!', 'error');
      return;
    }
    
    // Preencher campos automaticamente
    const street = document.getElementById('street');
    const neighborhood = document.getElementById('neighborhood');
    const city = document.getElementById('city');
    const state = document.getElementById('state');
    
    if (street) street.value = data.logradouro || '';
    if (neighborhood) neighborhood.value = data.bairro || '';
    if (city) city.value = data.localidade || '';
    if (state) state.value = data.uf || '';
    
    showNotification('Endereço preenchido automaticamente!', 'success');
    
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    showNotification('Erro ao buscar CEP', 'error');
  }
}

function maskCEP(e) {
  let value = e.target.value.replace(/\D/g, '');
  value = value.replace(/(\d{5})(\d)/, '$1-$2');
  e.target.value = value;
}

function openPasswordModal() {
  console.log('Abrindo modal de senha...');
  const passwordModal = document.getElementById('passwordModal');
  if (passwordModal) {
    passwordModal.style.display = 'flex';
    passwordModal.classList.add('active');
  }
}

function closePasswordModalHandler() {
  console.log('Fechando modal de senha...');
  const passwordModal = document.getElementById('passwordModal');
  if (passwordModal) {
    passwordModal.style.display = 'none';
    passwordModal.classList.remove('active');
  }
  
  // Limpar campos
  const currentPassword = document.getElementById('currentPassword');
  const newPassword = document.getElementById('newPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  const passwordStrength = document.getElementById('passwordStrength');
  
  if (currentPassword) currentPassword.value = '';
  if (newPassword) newPassword.value = '';
  if (confirmPassword) confirmPassword.value = '';
  if (passwordStrength) passwordStrength.innerHTML = '';
}

async function changePassword() {
  console.log('Alterando senha...');
  
  const currentPassword = document.getElementById('currentPassword');
  const newPassword = document.getElementById('newPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  
  const currentPass = currentPassword?.value || '';
  const newPass = newPassword?.value || '';
  const confirmPass = confirmPassword?.value || '';
  
  if (!currentPass || !newPass || !confirmPass) {
    showNotification('Preencha todos os campos de senha!', 'error');
    return;
  }
  
  if (newPass !== confirmPass) {
    showNotification('Nova senha e confirmação não coincidem!', 'error');
    return;
  }
  
  if (!senhaForte(newPass)) {
    showNotification('A nova senha deve conter pelo menos 1 letra maiúscula, 1 número e 1 caractere especial!', 'error');
    return;
  }
  
  try {
    // Verificar senha atual
    const userRef = ref(database, 'users/' + currentUserData.userId);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists() || snapshot.val().senha !== currentPass) {
      showNotification('Senha atual incorreta!', 'error');
      return;
    }
    
    // Atualizar senha
    await update(userRef, { senha: newPass });
    
    closePasswordModalHandler();
    showNotification('Senha alterada com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    showNotification('Erro ao alterar senha: ' + error.message, 'error');
  }
}

function validatePasswordStrength(e) {
  const password = e.target.value;
  const strengthDiv = document.getElementById('passwordStrength');
  
  if (!strengthDiv) return;
  
  let strength = 0;
  let feedback = [];
  
  if (password.length >= 6) strength++;
  else feedback.push('Mínimo 6 caracteres');
  
  if (/[A-Z]/.test(password)) strength++;
  else feedback.push('Uma letra maiúscula');
  
  if (/[0-9]/.test(password)) strength++;
  else feedback.push('Um número');
  
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) strength++;
  else feedback.push('Um caractere especial');
  
  const levels = ['Muito fraca', 'Fraca', 'Regular', 'Boa', 'Forte'];
  const colors = ['#ff4444', '#ff8800', '#ffaa00', '#88aa00', '#44aa44'];
  
  strengthDiv.innerHTML = `
    <div class="strength-bar">
      <div class="strength-fill" style="width: ${(strength / 4) * 100}%; background-color: ${colors[strength]}"></div>
    </div>
    <span style="color: ${colors[strength]}">${levels[strength]}</span>
    ${feedback.length > 0 ? '<br><small>Precisa: ' + feedback.join(', ') + '</small>' : ''}
  `;
}

function openSupportModal() {
  console.log('Abrindo modal de suporte...');
  const supportModal = document.getElementById('supportModal');
  if (supportModal) {
    supportModal.style.display = 'flex';
    supportModal.classList.add('active');
  }
}

function closeSupportModalHandler() {
  console.log('Fechando modal de suporte...');
  const supportModal = document.getElementById('supportModal');
  if (supportModal) {
    supportModal.style.display = 'none';
    supportModal.classList.remove('active');
  }
  
  const supportSubject = document.getElementById('supportSubject');
  const supportMessage = document.getElementById('supportMessage');
  
  if (supportSubject) supportSubject.value = 'data-change';
  if (supportMessage) supportMessage.value = '';
}

async function sendSupportMessage() {
  console.log('Enviando mensagem de suporte...');
  
  const supportSubject = document.getElementById('supportSubject');
  const supportMessage = document.getElementById('supportMessage');
  
  const subject = supportSubject?.value || '';
  const message = supportMessage?.value.trim() || '';
  
  if (!message) {
    showNotification('Digite uma mensagem!', 'error');
    return;
  }
  
  try {
    // Salvar mensagem de suporte no Firebase
    const supportRef = ref(database, 'suporte/' + Date.now());
    await set(supportRef, {
      userId: currentUserData.userId,
      email: currentUserData.email,
      assunto: subject,
      mensagem: message,
      dataEnvio: new Date().toISOString(),
      status: 'pendente'
    });
    
    closeSupportModalHandler();
    showNotification('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
    
  } catch (error) {
    console.error('Erro ao enviar mensagem de suporte:', error);
    showNotification('Erro ao enviar mensagem. Tente novamente.', 'error');
  }
}

function confirmDeleteAccount() {
  console.log('Confirmando exclusão de conta...');
  const confirmMessage = prompt('⚠️ ATENÇÃO! Esta ação é irreversível.\n\nDigite "EXCLUIR" para confirmar a exclusão da conta:');
  
  if (confirmMessage === 'EXCLUIR') {
    deleteAccount();
  } else if (confirmMessage !== null) {
    showNotification('Texto de confirmação incorreto. Exclusão cancelada.', 'error');
  }
}

async function deleteAccount() {
  console.log('Excluindo conta...');
  
  try {
    const userRef = ref(database, 'users/' + currentUserData.userId);
    await remove(userRef);
    
    // Limpar dados locais
    localStorage.removeItem('aquaflux_user_data');
    
    showNotification('Conta excluída com sucesso. Redirecionando...', 'success');
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    
  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    showNotification('Erro ao excluir conta: ' + error.message, 'error');
  }
}

function logout() {
  console.log('Fazendo logout...');
  
  // Limpar dados locais
  localStorage.removeItem('aquaflux_user_data');
  
  showNotification('Logout realizado com sucesso!', 'success');
  
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// Funções utilitárias
function formatPhone(phone) {
  if (!phone) return '';
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

function formatDocument(document, tipo) {
  if (!document) return '';
  const cleanDoc = document.replace(/\D/g, '');
  
  if (tipo === 'pessoal' && cleanDoc.length === 11) {
    return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (tipo === 'profissional' && cleanDoc.length === 14) {
    return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return document;
}

function senhaForte(senha) {
  const regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/;
  return regex.test(senha);
}

function showNotification(text, type = 'info') {
  // Remover mensagem anterior se existir
  const existingMessage = document.querySelector('.message');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Criar nova mensagem
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = text;

  // Adicionar à página
  let messageContainer = document.getElementById('messageContainer');
  if (!messageContainer) {
    messageContainer = document.createElement('div');
    messageContainer.id = 'messageContainer';
    messageContainer.className = 'message-container';
    document.body.appendChild(messageContainer);
  }

  messageContainer.appendChild(messageDiv);

  // Remover mensagem após 5 segundos
  setTimeout(() => {
    if (messageDiv && messageDiv.parentNode) {
      messageDiv.parentNode.removeChild(messageDiv);
    }
  }, 5000);

  console.log(`Mensagem exibida: ${text} (${type})`);
}

