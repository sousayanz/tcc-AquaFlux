

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, set, onValue, off, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-check.js";

// Configuração do Firebase
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

// ✅ APP CHECK CONFIGURADO
const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LdmsvsrAAAAAKsOGim9zoPQxWCs6GxdEupSHelo'),
    isTokenAutoRefreshEnabled: true
});

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


const database = getDatabase(app);

// CONFIGURAÇÃO DA API METEOROLÓGICA
const WEATHER_API_KEY = "96a17bd792e1581c45bea4fd2ed75ce0";

// Estado global da aplicação
let currentUser = null;
let userDevices = [];
let currentActiveDevice = null;
let weatherData = null;
let userLocation = null;
let userAddress = null;

// Cache para melhor performance - ✅ CORRIGIDO
let deviceListeners = {};
let weatherCache = {
    data: null,
    timestamp: 0,
    duration: 10 * 60 * 1000 // 10 minutos
};

// Timers para controle de performance
let offlineCheckInterval = null;
let weatherUpdateInterval = null;

// Variáveis para detecção inteligente de offline
let lastKnownUptime = null;
let lastKnownLastSeen = null;
let stagnantCount = 0;

// Variável para controle do monitor visual
let visualMonitorInitialized = false;

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard carregando - Modo Alta Performance...');
    
    // ⭐ TENTAR VÁRIAS VEZES ANTES DE DESISTIR
    let attempts = 0;
    const maxAttempts = 20;
    
    const waitForSession = setInterval(async () => {
        attempts++;
        console.log(`⏳ Tentativa ${attempts}/${maxAttempts} - Verificando sessão...`);
        
        const success = await initializeUser();
        
        if (success) {
            clearInterval(waitForSession);
            console.log('✅ Sessão encontrada! Inicializando sistema...');
            
            try {
                await Promise.all([
                    loadUserDevices(),
                    loadUserAddress()
                ]);
                
                await getWeatherData();
                initializeEventListeners();
                updateWelcomeMessage();
                startOfflineDetection();
                
                console.log('✅ Dashboard carregado com sucesso!');
            } catch (error) {
                console.error('❌ Erro na inicialização:', error);
                showNotification('Erro na inicialização do sistema', 'error');
            }
        } else if (attempts >= maxAttempts) {
            clearInterval(waitForSession);
            console.error('❌ Sessão não encontrada após 20 tentativas');
            showNotification('Sessão expirada. Redirecionando...', 'error');
            setTimeout(() => redirectToLogin(), 2000);
        }
    }, 500); // Tentar a cada 500ms
});

// Inicialização do usuário
async function initializeUser() {
    const userData = localStorage.getItem('aquaflux-userdata');
    if (!userData) {
        console.log('⏳ Sessão não encontrada - aguardando...');
        return false;  // ✅ RETORNA FALSE EM VEZ DE REDIRECIONAR
    }
    
    try {
        currentUser = JSON.parse(userData);
        if (!validateUser(currentUser)) {
            throw new Error('Dados de usuário inválidos');
        }
        
 // 🔍 VERIFICAR SE O USUÁRIO EXISTE NO FIREBASE
try {
    const userRef = ref(database, `users/${currentUser.userId}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
        console.warn('⚠️ Usuário não encontrado no Firebase - continuando com localStorage');
        // NÃO BLOQUEIA - deixa entrar mesmo assim
    } else {
        const userData = userSnapshot.val();
        if (!userData.ativo) {
            console.warn('⚠️ Usuário inativo - mas permitindo acesso');
        }
        console.log('✅ Usuário verificado no Firebase:', userData);
    }
} catch (firebaseError) {
    console.error('⚠️ Erro ao verificar Firebase - continuando offline:', firebaseError);
    // NÃO BLOQUEIA - continua mesmo com erro
}

        
        // ⭐ SALVAR SESSÃO
        console.log('✅ Salvando sessão no localStorage...');
        localStorage.setItem('aquaflux-userdata', JSON.stringify(currentUser));
        console.log('✅ Sessão salva!');
        
        updateUserInterface();
        console.log('✅ Usuário autenticado:', currentUser.email);
        
        // ⭐ DISPARAR EVENTO
        window.dispatchEvent(new CustomEvent('aquaflux:session-ready', {
            detail: { user: currentUser }
        }));
        console.log('🔔 Evento de sessão pronta disparado!');
        
        return true;  // ✅ RETORNA TRUE QUANDO ENCONTRAR
        
    } catch (error) {
    console.error('❌ Erro na verificação do usuário:', error);
    
    // ⭐ NÃO APAGAR SESSÃO - só avisar
    if (error.message === 'Network error' || error.code === 'unavailable') {
        console.log('⚠️ Erro de rede - mantendo sessão e tentando novamente...');
        return false;
    }
    
    // ⭐ SÓ REDIRECIONAR se for erro crítico
    if (error.message.includes('inválido') || error.message.includes('não encontrado')) {
        console.error('❌ Sessão inválida - limpando e redirecionando');
        localStorage.removeItem('aquaflux-userdata');
        redirectToLogin();
    } else {
        console.log('⚠️ Erro temporário - continuando com sessão local');
        updateUserInterface();
        return true;
    }
}}



// Validação dos dados do usuário
function validateUser(user) {
  return user && 
         user.nome && 
         user.email && 
         user.isLoggedIn && 
         user.userId;
}

// Atualizar interface com dados do usuário
function updateUserInterface() {
  const userNameElement = document.getElementById('userName');
  const userEmailElement = document.getElementById('userEmail');
  
  if (userNameElement) {
    userNameElement.textContent = currentUser.nomeExibicao || currentUser.nome;
  }
  if (userEmailElement) {
    userEmailElement.textContent = currentUser.email;
  }
}

// Carregar endereço do usuário
async function loadUserAddress() {
  console.log('📍 Carregando endereço do usuário...');
  
  try {
    const userRef = ref(database, 'users/' + currentUser.userId);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      userAddress = userData.endereco;
      
      if (userAddress && userAddress.cidade && userAddress.estado) {
        console.log('✅ Endereço encontrado:', `${userAddress.cidade}, ${userAddress.estado}`);
        return true;
      } else {
        console.log('⚠️ Endereço incompleto ou não encontrado');
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar endereço do usuário:', error);
    return false;
  }
}

// Obter coordenadas baseadas no endereço do usuário
async function getCoordinatesFromAddress() {
  if (!userAddress || !userAddress.cidade || !userAddress.estado) {
    return null;
  }
  
  try {
    let addressQuery = '';
    
    if (userAddress.rua && userAddress.numero) {
      addressQuery += `${userAddress.rua}, ${userAddress.numero}, `;
    }
    if (userAddress.bairro) {
      addressQuery += `${userAddress.bairro}, `;
    }
    addressQuery += `${userAddress.cidade}, ${userAddress.estado}, Brasil`;
    
    console.log('🌐 Buscando coordenadas para:', addressQuery);
    
    const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(addressQuery)}&limit=1&appid=${WEATHER_API_KEY}`;
    
    const response = await fetch(geocodingUrl);
    
    if (response.ok) {
      const locations = await response.json();
      
      if (locations && locations.length > 0) {
        const location = locations[0];
        return {
          lat: location.lat,
          lon: location.lon,
          name: `${location.name}, ${location.state || userAddress.estado}, ${location.country}`
        };
      }
    }
    
    // Fallback: tentar apenas com cidade e estado
    const fallbackQuery = `${userAddress.cidade}, ${userAddress.estado}, Brasil`;
    const fallbackUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(fallbackQuery)}&limit=1&appid=${WEATHER_API_KEY}`;
    
    const fallbackResponse = await fetch(fallbackUrl);
    
    if (fallbackResponse.ok) {
      const fallbackLocations = await fallbackResponse.json();
      
      if (fallbackLocations && fallbackLocations.length > 0) {
        const location = fallbackLocations[0];
        return {
          lat: location.lat,
          lon: location.lon,
          name: `${location.name}, ${location.state || userAddress.estado}, ${location.country}`
        };
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Erro ao obter coordenadas:', error);
    return null;
  }
}

// ✅ FUNÇÃO CORRIGIDA - Obter dados meteorológicos
async function getWeatherData() {
  const now = Date.now();
  
  // ✅ CORREÇÃO: Verificar cache corretamente
  if (weatherCache.data && (now - weatherCache.timestamp) < weatherCache.duration) {
    console.log('🔄 Usando dados meteorológicos em cache');
    weatherData = weatherCache.data; // ✅ CORRIGIDO
    updateWeatherDisplay();
    updateForecastDisplay();
    return;
  }
  
  if (!WEATHER_API_KEY || WEATHER_API_KEY === 'SUA_CHAVE_API_AQUI') {
    console.warn('⚠️ Chave da API não configurada, usando dados simulados');
    useSimulatedWeatherData();
    return;
  }
  
  if (!userAddress || !userAddress.cidade || !userAddress.estado) {
    console.log('⚠️ Endereço não disponível, usando dados simulados');
    useSimulatedWeatherData();
    updateLocationDisplay('Localização não definida');
    return;
  }
  
  try {
    console.log('🌤️ Obtendo dados meteorológicos reais...');
    
    const coordinates = await getCoordinatesFromAddress();
    
    if (!coordinates) {
      throw new Error('Não foi possível obter coordenadas do endereço');
    }
    
    userLocation = coordinates;
    console.log('✅ Coordenadas obtidas:', userLocation);
    
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${userLocation.lat}&lon=${userLocation.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=pt_br`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${userLocation.lat}&lon=${userLocation.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=pt_br`;
    
    const [weatherResponse, forecastResponse] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl)
    ]);
    
    if (weatherResponse.ok && forecastResponse.ok) {
      const currentWeather = await weatherResponse.json();
      const forecastData = await forecastResponse.json();
      
      // ✅ CORREÇÃO: Atribuir corretamente aos objetos separados
      weatherData = {
        main: {
          temp: Math.round(currentWeather.main.temp),
          humidity: currentWeather.main.humidity,
          pressure: currentWeather.main.pressure,
          temp_max: Math.round(currentWeather.main.temp_max),
          temp_min: Math.round(currentWeather.main.temp_min)
        },
        wind: {
          speed: currentWeather.wind.speed || 0
        },
        weather: [{
          icon: getWeatherEmoji(currentWeather.weather[0].icon),
          description: currentWeather.weather[0].description
        }],
        forecast: {
          rainChance: calculateRainChance(forecastData)
        }
      };
      
      // ✅ CORREÇÃO: Salvar no cache corretamente
      weatherCache.data = weatherData;
      weatherCache.timestamp = now;
      
      console.log('✅ Dados meteorológicos reais obtidos e cachados');
      updateWeatherDisplay();
      updateForecastDisplay();
      updateLocationDisplay(userLocation.name);
      
    } else {
      throw new Error(`Erro na API: ${weatherResponse.status} / ${forecastResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao obter dados meteorológicos:', error);
    showNotification('Erro ao carregar dados meteorológicos. Usando dados de exemplo.', 'warning');
    useSimulatedWeatherData();
    updateLocationDisplay(`${userAddress.cidade}, ${userAddress.estado}`);
  }
}

// Converter ícones da API para emojis
function getWeatherEmoji(iconCode) {
  const iconMap = {
    '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️'
  };
  
  return iconMap[iconCode] || '🌤️';
}

// Calcular chance de chuva baseada na previsão
function calculateRainChance(forecastData) {
  if (!forecastData || !forecastData.list) return 0;
  
  const next24Hours = forecastData.list.slice(0, 8);
  let totalRainProb = 0;
  
  next24Hours.forEach(item => {
    if (item.pop) {
      totalRainProb += item.pop * 100;
    }
  });
  
  return Math.round(totalRainProb / next24Hours.length);
}

// Usar dados meteorológicos simulados (fallback)
function useSimulatedWeatherData() {
  console.log('🎲 Usando dados meteorológicos simulados');
  
  const conditions = [
    { icon: '☀️', desc: 'Ensolarado', rain: 5 },
    { icon: '⛅', desc: 'Parcialmente nublado', rain: 15 },
    { icon: '☁️', desc: 'Nublado', rain: 35 },
    { icon: '🌧️', desc: 'Chuva leve', rain: 70 },
    { icon: '⛈️', desc: 'Tempestade', rain: 85 }
  ];
  
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
  const baseTemp = 18 + Math.random() * 15;
  
  weatherData = {
    main: {
      temp: Math.round(baseTemp),
      humidity: Math.round(40 + Math.random() * 40),
      pressure: Math.round(1005 + Math.random() * 20),
      temp_max: Math.round(baseTemp + 2 + Math.random() * 5),
      temp_min: Math.round(baseTemp - 3 - Math.random() * 5)
    },
    wind: {
      speed: Math.round(Math.random() * 20)
    },
    weather: [{
      icon: randomCondition.icon,
      description: randomCondition.desc
    }],
    forecast: {
      rainChance: randomCondition.rain
    }
  };
  
  updateWeatherDisplay();
  updateForecastDisplay();
}

// Atualizar displays meteorológicos
function updateWeatherDisplay() {
  if (!weatherData) return;
  
  const elements = {
    temperature: `${weatherData.main.temp}°C`,
    humidity: `${weatherData.main.humidity}%`,
    pressure: `${weatherData.main.pressure} hPa`,
    windSpeed: `${Math.round(weatherData.wind.speed * 3.6)} km/h`
  };
  
  Object.keys(elements).forEach(id => {
    const element = document.getElementById(id);
    if (element) element.textContent = elements[id];
  });
}

function updateForecastDisplay() {
  if (!weatherData) return;
  
  const elements = {
    weatherIcon: weatherData.weather[0].icon,
    weatherDescription: weatherData.weather[0].description,
    rainChance: `Chuva: ${weatherData.forecast.rainChance}%`,
    maxTemp: `${weatherData.main.temp_max}°`,
    minTemp: `${weatherData.main.temp_min}°`
  };
  
  Object.keys(elements).forEach(id => {
    const element = document.getElementById(id);
    if (element) element.textContent = elements[id];
  });
}

function updateLocationDisplay(location) {
  const locationElement = document.getElementById('locationName');
  if (locationElement) {
    locationElement.textContent = location;
  }
}

// Carregar dispositivos do usuário
async function loadUserDevices() {
  console.log('📱 Carregando dispositivos do usuário...');
  
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
    }
    
    console.log('✅ Dispositivos carregados:', userDevices.length);
    
    if (userDevices.length > 0) {
      currentActiveDevice = userDevices[0];
      console.log('🔧 Dispositivo ativo:', currentActiveDevice.name);
      initializeArduinoListener();
      updateSystemStatus();
    } else {
      console.log('⚠️ Nenhum dispositivo encontrado');
      updateSystemStatusNoDevice();
    }
    
  } catch (error) {
    console.error('❌ Erro ao carregar dispositivos:', error);
    showNotification('Erro ao carregar dispositivos: ' + error.message, 'error');
  }
}

// ✅ CORREÇÃO 4: Função corrigida com monitor visual integrado
function initializeArduinoListener() {
  if (!currentActiveDevice || !currentActiveDevice.arduinoId) {
    console.log('⚠️ Nenhum dispositivo ativo para monitorar');
    return;
  }
  
  console.log('🚀 Iniciando monitoramento INTELIGENTE do Arduino:', currentActiveDevice.arduinoId);
  
  // Listener para status do Arduino
  const arduinoRef = ref(database, `arduinos/${currentActiveDevice.arduinoId}`);
  onValue(arduinoRef, (snapshot) => {
    const data = snapshot.val();
    console.log('📡 Dados do Arduino recebidos:', data);
    
    if (data) {
      // Confiar no campo "online" do banco
      const isOnline = data.online === true;
      
      // Se voltou online, resetar detecção
      if (isOnline) {
        resetOfflineDetection();
      }
      
      // ⚡ Verificar se data tem os campos necessários
if (!data || typeof data !== 'object') {
    console.warn('⚠️ Dados do Arduino inválidos:', data);
    return;
}

console.log('⚡ Status check:', {
    online: data.online,
    uptime: data.uptime,
    lastSeen: data.lastSeen,
    isOnline: isOnline
});

      
      updateSystemStatus({
        ...data,
        online: isOnline,
        lastSeen: data.lastSeen,
        uptime: data.uptime
      });
      updateRelayUI(data.state || false);
    } else {
      updateSystemStatusOffline();
    }
  }, (error) => {
    console.error('❌ Erro ao escutar Arduino:', error);
    updateSystemStatusOffline();
  });
  
  // Listener para devices (ações do usuário)
  const deviceRef = ref(database, `users/${currentUser.userId}/devices/${currentActiveDevice.id}`);
  onValue(deviceRef, (snapshot) => {
    const deviceData = snapshot.val();
    if (deviceData && deviceData.lastUpdated) {
      currentActiveDevice.lastUpdated = deviceData.lastUpdated;
      console.log('📝 Device lastUpdated atualizado:', deviceData.lastUpdated);
    }
  });
  
  // ✅ CORREÇÃO 4: Integrar monitor visual aqui (em vez de sobrescrever)
  if (!visualMonitorInitialized) {
    setTimeout(() => {
      initVisualStatusMonitor();
      visualMonitorInitialized = true;
    }, 1500);
  }
}

// Mensagem de boas-vindas personalizada v3

function updateWelcomeMessage() {
  const welcomeElement = document.getElementById('welcomeMessage');
  if (!welcomeElement || !currentUser) return;

  const currentHour = new Date().getHours();
  let greeting;
  if (currentHour < 12) greeting = 'Bom dia';
  else if (currentHour < 18) greeting = 'Boa tarde';
  else greeting = 'Boa noite';

  const firstName = (currentUser.nomeExibicao || currentUser.nome).split(' ')[0];

  // Verifica os campos obrigatórios e monta a lista do que falta
  const missingFields = [];
  if (!userAddress || !userAddress.cidade || !userAddress.estado || !userAddress.rua || !userAddress.numero) {
    missingFields.push("endereço");
  }

  let completeMessage = "";
  if (missingFields.length > 0) {
    completeMessage = `<span class="complete-profile-tip">
      &nbsp;|&nbsp;<span style="color:#eab616;">⚠️</span>
      Por favor, complete seu cadastro (${missingFields.join(', ')}) <a href="infoUsuarios.html" class="notification-action-btn">clicando aqui</a>.
    </span>`;
  }

  // Mensagem principal
  const message = `<span class="welcome-title">${greeting}, ${firstName}!</span>
    <span class="notification-text">
      Sistema de irrigação pronto para uso.
    </span>
    ${completeMessage}`;

    if (missingFields.length > 0) {
      welcomeElement.classList.add('has-tip');
    } else {
      welcomeElement.classList.remove('has-tip');
    }

  welcomeElement.innerHTML = message;
}

// ✅ CORREÇÃO 3: Função corrigida com initializeRelayButtonControl() integrado
function initializeEventListeners() {
  const relaySwitch = document.getElementById('relaySwitch');
  if (relaySwitch) {
    relaySwitch.addEventListener('change', toggleRelay);
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Botões do menu
  const menuButtons = {
    pumpConfigBtn: 'configBombas.html',
    userInfoBtn: 'infoUsuarios.html',
    chartsBtn: 'dados.html',
    terraBtn: 'terra.html'
  };

  Object.keys(menuButtons).forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', () => window.location.href = menuButtons[btnId]);
    }
  });

  // Atualizar dados meteorológicos a cada 15 minutos
  if (weatherUpdateInterval) clearInterval(weatherUpdateInterval);
  weatherUpdateInterval = setInterval(async () => {
    await getWeatherData();
  }, 15 * 60 * 1000);
  
  // ✅ CORREÇÃO 3: Inicializar controle do botão do relé aqui
  initializeRelayButtonControl();
}

// Controlar relé - FUNÇÃO PRINCIPAL OTIMIZADA
async function toggleRelay() {
  const relaySwitch = document.getElementById('relaySwitch');
  const newState = relaySwitch.checked;

  if (!currentActiveDevice || !currentActiveDevice.arduinoId) {
    showNotification('Nenhum dispositivo Arduino configurado!', 'error');
    relaySwitch.checked = false;
    return;
  }

  console.log('⚡ Alterando estado do Arduino', currentActiveDevice.arduinoId, 'para:', newState);

  relaySwitch.disabled = true;

  try {
    const currentTime = new Date().toISOString();
    
    // Atualizar ambos em paralelo para máxima velocidade
    await Promise.all([
      // Arduino state
      update(ref(database, `arduinos/${currentActiveDevice.arduinoId}`), {
        state: newState,
        lastControlled: currentTime,
        controlledBy: currentUser.userId
      }),
      
      // Device action log
      update(ref(database, `users/${currentUser.userId}/devices/${currentActiveDevice.id}`), {
        lastUpdated: currentTime,
        lastAction: {
          type: 'manual_control',
          state: newState,
          timestamp: currentTime,
          user: currentUser.email
        }
      })
    ]);

    // Atualizar localmente
    currentActiveDevice.lastUpdated = currentTime;

    console.log('✅ Estado do Arduino e Device atualizados:', newState);
    showNotification(
      `${currentActiveDevice.name} ${newState ? 'LIGADO' : 'DESLIGADO'} com sucesso!`,
      'success'
    );

  } catch (error) {
    console.error('❌ Erro ao controlar Arduino:', error);
    showNotification('Erro ao alterar estado do sistema!', 'error');
    relaySwitch.checked = !newState;
  } finally {
    relaySwitch.disabled = false;
  }
}

// SISTEMA DE DETECÇÃO OFFLINE INTELIGENTE
function startOfflineDetection() {
  if (offlineCheckInterval) clearInterval(offlineCheckInterval);
  
  // Verificação a cada 3 segundos
  offlineCheckInterval = setInterval(() => {
    if (currentActiveDevice && currentActiveDevice.arduinoId) {
      checkDeviceTimeout();
    }
  }, 3000);
  
  console.log('🔍 Detecção offline INTELIGENTE iniciada - Verificação a cada 3s');
}

// Função auxiliar para resetar quando ESP reconectar
function resetOfflineDetection() {
  lastKnownUptime = null;
  lastKnownLastSeen = null;
  stagnantCount = 0;
  console.log('🔄 Detecção offline resetada - Device voltou online');
}

// Verificação INTELIGENTE - só marca offline se valores estagnarem
async function checkDeviceTimeout() {
  try {
    const arduinoRef = ref(database, `arduinos/${currentActiveDevice.arduinoId}`);
    const snapshot = await get(arduinoRef);
    const data = snapshot.val();
    
    if (!data) return;
    
    console.log('🔍 Verificando status do device:', {
      online: data.online,
      uptime: data.uptime,
      lastSeen: data.lastSeen
    });
    
    // Se o ESP diz que está online
    if (data.online === true) {
     // ⚡ Garantir valores válidos
const currentUptime = data.uptime ? parseInt(data.uptime) || 0 : 0;
const currentLastSeen = data.lastSeen ? parseInt(data.lastSeen) || 0 : 0;

// Se ambos forem 0, dispositivo nunca conectou
if (currentUptime === 0 && currentLastSeen === 0) {
    console.log('⚠️ Dispositivo nunca conectou - aguardando primeira conexão');
    return; // Não fazer nada, só aguardar
}

      
      // PRIMEIRA VERIFICAÇÃO: Salvar valores iniciais
      if (lastKnownUptime === null) {
        lastKnownUptime = currentUptime;
        lastKnownLastSeen = currentLastSeen;
        stagnantCount = 0;
        console.log('✅ Valores iniciais salvos - Device ONLINE e ativo');
        return;
      }
      
      // SEGUNDA VERIFICAÇÃO: Ver se os valores MUDARAM
      const uptimeChanged = currentUptime !== lastKnownUptime;
      const lastSeenChanged = currentLastSeen !== lastKnownLastSeen;
      
      if (uptimeChanged || lastSeenChanged) {
        // VALORES MUDARAM = ESP ESTÁ VIVO E ATUALIZANDO
        console.log('✅ Device ATIVO - Valores atualizados:', {
          uptime: `${lastKnownUptime} -> ${currentUptime}`,
          lastSeen: `${lastKnownLastSeen} -> ${currentLastSeen}`
        });
        
        lastKnownUptime = currentUptime;
        lastKnownLastSeen = currentLastSeen;
        stagnantCount = 0;
        
        return;
      } else {
        // VALORES NÃO MUDARAM = POSSÍVEL PROBLEMA
        stagnantCount++;
        console.log(`⚠️ Valores estagnados (${stagnantCount}/3):`, {
          uptime: currentUptime,
          lastSeen: currentLastSeen
        });
        
        // SÓ MARCA OFFLINE APÓS 3 VERIFICAÇÕES SEM MUDANÇA (9 segundos)
        if (stagnantCount >= 3) {
          console.log('❌ Device confirmado OFFLINE - Valores não mudam há 9s - Marcando no banco...');
          
          await update(ref(database, `arduinos/${currentActiveDevice.arduinoId}`), {
            online: false
          });
          
          // Resetar contadores
          lastKnownUptime = null;
          lastKnownLastSeen = null;
          stagnantCount = 0;
          
          console.log('💾 Banco atualizado: online = false');
        }
      }
    } else {
      // Se já está offline, resetar contadores
      if (lastKnownUptime !== null) {
        console.log('🔄 Device já está offline - Resetando contadores');
        lastKnownUptime = null;
        lastKnownLastSeen = null;
        stagnantCount = 0;
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação de timeout:', error);
  }
}

// Funções de atualização de status
function updateSystemStatus(arduinoData = null) {
  const elements = {
    statusElement: document.getElementById('espStatus'),
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('espStatusText'),
    lastSeenElement: document.getElementById('lastSeen')
  };
  
  if (!elements.statusElement || !elements.statusDot || !elements.statusText || !elements.lastSeenElement) return;
  
  if (!currentActiveDevice) {
    updateSystemStatusNoDevice();
    return;
  }
  
  if (arduinoData && arduinoData.online) {
    elements.statusDot.className = 'status-dot online';
    elements.statusText.textContent = `${currentActiveDevice.name} Online`;
    elements.lastSeenElement.textContent = 'Conectado agora';
  } else {
    elements.statusDot.className = 'status-dot offline';
    elements.statusText.textContent = `${currentActiveDevice.name} Offline`;
    
    // Prioridade: devices lastUpdated > arduinos lastSeen
    let lastConnectionTime = null;
    
    if (currentActiveDevice.lastUpdated) {
      lastConnectionTime = new Date(currentActiveDevice.lastUpdated);
    } else if (arduinoData && arduinoData.lastSeen) {
      lastConnectionTime = new Date(parseInt(arduinoData.lastSeen));
    }
    
    if (lastConnectionTime && !isNaN(lastConnectionTime.getTime())) {
      elements.lastSeenElement.textContent = `Última conexão: ${formatDateTime(lastConnectionTime)}`;
    } else {
      elements.lastSeenElement.textContent = 'Aguardando primeira conexão...';
    }
  }
}

function updateSystemStatusNoDevice() {
  const elements = {
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('espStatusText'),
    lastSeenElement: document.getElementById('lastSeen'),
    relaySwitch: document.getElementById('relaySwitch')
  };
  
  if (!elements.statusDot || !elements.statusText || !elements.lastSeenElement) return;
  
  elements.statusDot.className = 'status-dot offline';
  elements.statusText.textContent = 'Nenhum dispositivo configurado';
  elements.lastSeenElement.textContent = 'Configure um dispositivo Arduino para começar';
  
  if (elements.relaySwitch) {
    elements.relaySwitch.disabled = true;
    elements.relaySwitch.checked = false;
  }
  
  updateRelayUI(false);
}

function updateSystemStatusOffline() {
  const elements = {
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('espStatusText'),
    lastSeenElement: document.getElementById('lastSeen')
  };
  
  if (!elements.statusDot || !elements.statusText || !elements.lastSeenElement) return;
  
  if (currentActiveDevice) {
    elements.statusDot.className = 'status-dot offline';
    elements.statusText.textContent = `${currentActiveDevice.name} Offline`;
    elements.lastSeenElement.textContent = 'Dispositivo desconectado';
  } else {
    updateSystemStatusNoDevice();
  }
}

function updateRelayUI(relayState) {
  const relaySwitch = document.getElementById('relaySwitch');
  const relayStatus = document.getElementById('relayStatus');
  
  if (!relaySwitch || !relayStatus) return;
  
  console.log('🔄 Atualizando UI do relé:', relayState);
  
  if (relaySwitch.checked !== relayState) {
    relaySwitch.checked = relayState;
  }
  
  relaySwitch.disabled = !(currentActiveDevice && currentActiveDevice.arduinoId);
  
  if (relayState) {
    relayStatus.textContent = 'LIGADO';
    relayStatus.className = 'status-text on';
  } else {
    relayStatus.textContent = 'DESLIGADO';
    relayStatus.className = 'status-text off';
  }
}

// Logout otimizado
function logout() {
  console.log('👋 Fazendo logout...');
  
  // Limpar todos os intervalos
  if (offlineCheckInterval) clearInterval(offlineCheckInterval);
  if (weatherUpdateInterval) clearInterval(weatherUpdateInterval);
  
  localStorage.removeItem('aquaflux_user_data');
  
  currentUser = null;
  userDevices = [];
  currentActiveDevice = null;
  
  // Resetar variáveis de detecção offline
  resetOfflineDetection();
  
  try {
    if (currentActiveDevice && currentActiveDevice.arduinoId) {
      off(ref(database, `arduinos/${currentActiveDevice.arduinoId}`));
    }
  } catch (error) {
    console.error('❌ Erro ao limpar listeners:', error);
  }
  
  redirectToLogin();
}

function redirectToLogin() {
  window.location.href = 'login.html';
}


// Formatação de data otimizada
function formatDateTime(date) {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
// ✅ Verificação periódica LEVE - só avisa
setInterval(() => {
    const userData = localStorage.getItem('aquaflux-userdata');
    if (!userData) {
        console.warn('⚠️ Sessão não encontrada no localStorage');
    }
}, 60000);


// Limpeza ao sair da página
window.addEventListener('beforeunload', () => {
  console.log('🔄 Limpando recursos...');
  
  if (offlineCheckInterval) clearInterval(offlineCheckInterval);
  if (weatherUpdateInterval) clearInterval(weatherUpdateInterval);
  
  try {
    if (currentActiveDevice && currentActiveDevice.arduinoId) {
      off(ref(database, `arduinos/${currentActiveDevice.arduinoId}`));
    }
  } catch (error) {
    console.error('❌ Erro ao limpar listeners:', error);
  }
});

// Expor funções necessárias globalmente
window.closePanel = () => {
  const modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }
};

// ========================================
// SISTEMA DE MONITORAMENTO VISUAL DO STATUS
// ========================================

function getActiveArduinoId() {
    if (currentActiveDevice && currentActiveDevice.arduinoId) {
        return currentActiveDevice.arduinoId;
    }
    return null;
}

function initVisualStatusMonitor() {
    const arduinoId = getActiveArduinoId();
    
    if (!arduinoId) {
        console.log('⚠️ Nenhum Arduino ID encontrado para monitoramento visual');
        return;
    }
    
    console.log('👁️ Iniciando monitoramento visual para:', arduinoId);
    
    const onlineRef = ref(database, `arduinos/${arduinoId}/online`);
    
    onValue(onlineRef, (snapshot) => {
        const isOnline = snapshot.val();
        console.log('👁️ Status visual atualizado:', isOnline);
        updateVisualStatusOnly(isOnline, arduinoId);
    }, (error) => {
        console.error('❌ Erro no monitoramento visual:', error);
    });
}

function updateVisualStatusOnly(isOnline, arduinoId) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('espStatusText');
    const lastSeen = document.getElementById('lastSeen');
    
    if (!statusDot || !statusText) {
        console.warn('⚠️ Elementos visuais não encontrados');
        return;
    }
    
    const deviceName = currentActiveDevice ? currentActiveDevice.name : arduinoId.replace('_', ' ');
    
    if (isOnline === true) {
        statusDot.classList.remove('offline');
        statusDot.classList.add('online');
        statusText.textContent = `${deviceName} Online`;
        if (lastSeen) lastSeen.textContent = 'Conectado agora';
        console.log('✅ Visual: ONLINE');
    } else {
        statusDot.classList.remove('online');
        statusDot.classList.add('offline');
        statusText.textContent = `${deviceName} Offline`;
        if (lastSeen) lastSeen.textContent = 'Aguardando conexão...';
        console.log('❌ Visual: OFFLINE');
    }
}

// ============================================================================
// SISTEMA DE CONTROLE DO BOTÃO BASEADO NO STATUS DO ESP8266
// ============================================================================

// ✅ CORREÇÃO 2: Função corrigida com seletor correto
function updateRelayButtonState() {
  const relaySwitch = document.getElementById('relaySwitch');
  const statusText = document.getElementById('espStatusText'); // ✅ CORREÇÃO: Usar ID correto
  
  if (!relaySwitch) return;
  
  // Verificar se o ESP está offline
  const isOffline = statusText && statusText.textContent.toLowerCase().includes('offline');
  
  if (isOffline) {
    // ESP OFFLINE - Desabilitar botão
    relaySwitch.disabled = true;
    relaySwitch.checked = false; // Forçar para desligado
    
    // Adicionar classe visual de desabilitado
    const switchContainer = relaySwitch.closest('.power-switch');
    if (switchContainer) {
      switchContainer.classList.add('switch-disabled');
    }
    
    console.log('🔴 ESP8266 Offline - Botão do relé desabilitado');
  } else {
    // ESP ONLINE - Habilitar botão
    relaySwitch.disabled = false;
    
    // Remover classe visual de desabilitado
    const switchContainer = relaySwitch.closest('.power-switch');
    if (switchContainer) {
      switchContainer.classList.remove('switch-disabled');
    }
    
    console.log('🟢 ESP8266 Online - Botão do relé habilitado');
  }
}

// Observar mudanças no status do ESP8266
function initializeRelayButtonControl() {
  // Executar verificação inicial
  updateRelayButtonState();
  
  // Observar mudanças no DOM (quando o status mudar)
  const statusElement = document.getElementById('espStatusText'); // ✅ CORREÇÃO: Usar ID correto
  
  if (statusElement) {
    // Criar um MutationObserver para detectar mudanças no texto
    const observer = new MutationObserver(() => {
      updateRelayButtonState();
    });
    
    // Configurar o observer
    observer.observe(statusElement, {
      childList: true,
      characterData: true,
      subtree: true
    });
    
    console.log('👁️ Sistema de controle do botão inicializado');
  }
  
  // Verificar periodicamente (backup caso o observer não funcione)
  setInterval(updateRelayButtonState, 3000);
  
  // Adicionar evento de clique para alertar quando offline
  const relaySwitch = document.getElementById('relaySwitch');
  if (relaySwitch) {
    relaySwitch.addEventListener('click', (e) => {
      if (relaySwitch.disabled) {
        e.preventDefault();
        showNotification('⚠️ ESP8266 está offline! Aguarde a reconexão para controlar o sistema.', 'warning');
      }
    });
  }
}
// 🔇 Desabilitar logs excessivos em produção
if (window.location.hostname !== 'localhost') {
    console.log = () => {};
}
// 🔔 SISTEMA UNIFICADO DE NOTIFICAÇÕES
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.init();
    }

    init() {
        // Criar container de toasts se não existir
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }
    }

    // Ícones SVG
    getIcon(type) {
        const icons = {
            success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>`,
            error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>`,
            warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>`,
            info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>`
        };
        return icons[type] || icons.info;
    }

    // Mostrar toast
    show(message, type = 'info', duration = 5000) {
        const id = Date.now();
        
        // Criar toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.dataset.id = id;
        
        toast.innerHTML = `
            <div class="toast-icon">
                ${this.getIcon(type)}
            </div>
            <div class="toast-content">
                <div class="toast-title">${this.getTitle(type)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Fechar">×</button>
        `;

        // Adicionar ao container
        this.container.appendChild(toast);

        // Salvar na lista de notificações
        const notification = {
            id,
            message,
            type,
            time: new Date(),
            read: false
        };
        this.notifications.unshift(notification);

        // Adicionar ao painel de notificações
        this.addToPanel(notification);

        // Eventos
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeToast(toast);
        });

        // Clicar no toast abre o painel
        toast.addEventListener('click', () => {
            this.openNotificationPanel();
            this.removeToast(toast);
        });

        // Auto-remover
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
    }

    // Remover toast
    removeToast(toast) {
        if (!toast || !toast.parentNode) return;
        
        toast.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 400);
    }

    // Título baseado no tipo
    getTitle(type) {
        const titles = {
            success: 'Sucesso!',
            error: 'Erro!',
            warning: 'Atenção!',
            info: 'Informação'
        };
        return titles[type] || 'Notificação';
    }

    // Adicionar ao painel de notificações
    addToPanel(notification) {
        const panel = document.querySelector('.notification-list');
        if (!panel) return;

        const item = document.createElement('div');
        item.className = 'notification-item unread';
        item.dataset.id = notification.id;

        const timeStr = this.formatTime(notification.time);

        item.innerHTML = `
            <div class="notification-icon ${notification.type}">
                ${this.getIcon(notification.type)}
            </div>
            <div class="notification-content">
                <div class="notification-title">${this.getTitle(notification.type)}</div>
                <div class="notification-text">${notification.message}</div>
                <div class="notification-time">${timeStr}</div>
            </div>
        `;

        // Adicionar no topo da lista
        panel.insertBefore(item, panel.firstChild);

        // Atualizar badge
        this.updateBadge();
    }

    // Abrir painel de notificações
    openNotificationPanel() {
        const panel = document.querySelector('.notification-panel');
        if (panel) {
            panel.classList.add('active');
        }
    }

    // Atualizar badge de contador
    updateBadge() {
        const badge = document.querySelector('.notification-badge');
        if (!badge) return;

        const unreadCount = this.notifications.filter(n => !n.read).length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }

    // Formatar tempo
    formatTime(date) {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'Agora mesmo';
        if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} h atrás`;
        return date.toLocaleDateString('pt-BR');
    }
}

// ⭐ Criar instância global
window.notificationSystem = new NotificationSystem();

// ⭐ Função global simplificada (substituir todas as showNotification)
window.showNotification = (message, type = 'info') => {
    window.notificationSystem.show(message, type);
};

// ⭐ Aliases para compatibilidade
window.showNotification = window.showNotification;
window.showNotification = window.showNotification;


console.log('✅ Sistema de monitoramento visual inicializado');
console.log('✅ home.js carregado - Versão Corrigida v4.0 - Todas as correções aplicadas');
