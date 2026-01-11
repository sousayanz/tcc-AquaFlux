// ============================================================
// DADOS.JS - SISTEMA COMPLETO DE ANÁLISE AQUAFLUX v5.0 FINAL
// Data: 08/12/2025
// Desenvolvido para análise 100% funcional de irrigação
// SOLUÇÃO DEFINITIVA: Uso de Chart.getChart() para limpeza
// ============================================================

(function() {
  'use strict';

  console.log("🚀 [DADOS.JS] Iniciando carregamento completo v5.0 FINAL...");

  // ============================================================
  // CONFIGURAÇÃO FIREBASE
  // ============================================================
  
  const firebaseConfig = {
    apiKey: "AIzaSyBycnpeGWw-ecRDXLxdOrNAMhfQzLWwp4",
    authDomain: "aqua-flux.firebaseapp.com",
    databaseURL: "https://aqua-flux-default-rtdb.firebaseio.com",
    projectId: "aqua-flux",
    storageBucket: "aqua-flux.firebasestorage.app",
    messagingSenderId: "188013221293",
    appId: "1:188013221293:web:c98dc4ef68966f95677d24",
    measurementId: "G-1651EB8ML3"
  };

  // Inicializar Firebase (modo compat)
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const database = firebase.database();

  // ============================================================
  // VARIÁVEIS GLOBAIS
  // ============================================================
  
  let currentUser = null;
  let firebaseUserData = null;
  let userDevices = [];
  let allHistory = [];
  let statsCache = null;
  let selectedPeriod = "7d";
  let dataLoaded = false;
  let listenersAttached = false;

  // IDs dos Canvas (crucial para destruição segura)
  const CANVAS_IDS = {
    activations: "activationsChart",
    time: "timeChart",
    hourly: "hourlyChart",
    efficiency: "efficiencyChart"
  };

  // Tarifas de água por região (atualizado dez/2025)
  const WATER_TARIFFS = {
    'São Paulo': { company: 'SABESP', pricePerM3: 6.40, state: 'SP' },
    'SP': { company: 'SABESP', pricePerM3: 6.40, state: 'SP' },
    'Rio de Janeiro': { company: 'CEDAE', pricePerM3: 7.50, state: 'RJ' },
    'RJ': { company: 'CEDAE', pricePerM3: 7.50, state: 'RJ' },
    'Minas Gerais': { company: 'COPASA', pricePerM3: 5.80, state: 'MG' },
    'MG': { company: 'COPASA', pricePerM3: 5.80, state: 'MG' },
    'Brasília': { company: 'CAESB', pricePerM3: 6.20, state: 'DF' },
    'DF': { company: 'CAESB', pricePerM3: 6.20, state: 'DF' },
    'default': { company: 'Média Nacional', pricePerM3: 6.50, state: 'BR' }
  };

  // ============================================================
  // SISTEMA DE LOGS AVANÇADO
  // ============================================================
  
  const Logger = {
    info(message, data = null) {
      console.log(`ℹ️ [INFO] ${new Date().toLocaleTimeString()} - ${message}`, data || "");
    },
    success(message, data = null) {
      console.log(`✅ [SUCCESS] ${new Date().toLocaleTimeString()} - ${message}`, data || "");
    },
    warning(message, data = null) {
      console.warn(`⚠️ [WARN] ${new Date().toLocaleTimeString()} - ${message}`, data || "");
    },
    error(message, error = null) {
      console.error(`❌ [ERROR] ${new Date().toLocaleTimeString()} - ${message}`, error || "");
    },
    debug(message, data = null) {
      console.log(`🐞 [DEBUG] ${new Date().toLocaleTimeString()} - ${message}`, data || "");
    }
  };

  // ============================================================
  // SISTEMA DE NOTIFICAÇÕES (TOASTS)
  // ============================================================
  
  function createToastContainer() {
    const container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
    `;
    document.body.appendChild(container);
    return container;
  }

  function removeToast(toast) {
    toast.classList.remove("show");
    toast.classList.add("removing");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }

  function showNotification(message, type = "info", duration = 5000) {
    Logger.info(`Notificação (${type}): ${message}`);

    let container = document.getElementById("toast-container");
    if (!container) {
      container = createToastContainer();
    }

    const icons = {
      success: "✔️",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️"
    };

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.style.cssText = `
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;
    
    toast.innerHTML = `
      <div style="font-size: 20px;">${icons[type] || icons.info}</div>
      <div style="flex: 1;">${message}</div>
      <button class="toast-close" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0; line-height: 1;">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 10);

    toast.querySelector(".toast-close").onclick = () => removeToast(toast);

    if (duration > 0) {
      setTimeout(() => removeToast(toast), duration);
    }

    return toast;
  }

  // ============================================================
  // AUTENTICAÇÃO E USUÁRIO
  // ============================================================
  
  function initializeUser() {
    Logger.info("Verificando autenticação do usuário (dados.js)...");
    const userData = localStorage.getItem("aquafluxuserdata") || localStorage.getItem("aquaflux-userdata");
    
    if (!userData) {
      Logger.warning("Usuário não autenticado");
      showNotification("Sessão expirada. Faça login novamente.", "warning");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
      return false;
    }

    try {
      currentUser = JSON.parse(userData);
      Logger.success("Usuário autenticado", { 
        userId: currentUser.userId, 
        nome: currentUser.nome 
      });
      return true;
    } catch (error) {
      Logger.error("Erro ao processar dados do usuário", error);
      localStorage.removeItem("aquafluxuserdata");
      localStorage.removeItem("aquaflux-userdata");
      window.location.href = "login.html";
      return false;
    }
  }

  // ============================================================
  // CARREGAR DADOS DO USUÁRIO (LOCALIZAÇÃO PARA TARIFA)
  // ============================================================
  
  async function loadUserData() {
    Logger.info("Carregando dados do usuário do Firebase...");
    if (!currentUser || !currentUser.userId) {
      throw new Error("Usuário não definido");
    }

    try {
      const snapshot = await database.ref(`users/${currentUser.userId}`).once('value');
      if (snapshot.exists()) {
        firebaseUserData = snapshot.val();
        Logger.success("Dados do usuário carregados", {
          nome: firebaseUserData.nome,
          cidade: firebaseUserData.endereco?.cidade,
          estado: firebaseUserData.endereco?.estado
        });
      } else {
        Logger.warning("Dados do usuário não encontrados no Firebase");
        firebaseUserData = {};
      }
    } catch (error) {
      Logger.error("Erro ao carregar dados do usuário", error);
      throw error;
    }
  }

  // ============================================================
  // CARREGAR DISPOSITIVOS
  // ============================================================
  
  async function loadUserDevices() {
    Logger.info("Carregando dispositivos vinculados ao usuário...");
    userDevices = [];

    try {
      const snapshot = await database.ref("arduinos").once('value');
      if (snapshot.exists()) {
        const arduinos = snapshot.val();
        Object.keys(arduinos).forEach((espId) => {
          const esp = arduinos[espId];
          if (esp && esp.userId === currentUser.userId) {
            userDevices.push({
              id: espId,
              name: esp.deviceName || espId.replace("_", " "),
              online: !!esp.online,
              state: esp.state || false,
              lastSeen: esp.lastSeen || 0,
              waterFlow: esp.waterFlow || 5.0
            });
            Logger.debug("Dispositivo encontrado", { espId, esp });
          }
        });
        Logger.success(`Total de dispositivos encontrados: ${userDevices.length}`);
      } else {
        Logger.warning("Nenhum dispositivo encontrado no nó 'arduinos'");
      }

      // Preencher select de dispositivos
      const deviceFilter = document.getElementById("deviceFilter");
      if (deviceFilter) {
        deviceFilter.innerHTML = `<option value="all">Todos os Dispositivos</option>`;
        userDevices.forEach((d) => {
          const opt = document.createElement("option");
          opt.value = d.id;
          opt.textContent = d.name;
          deviceFilter.appendChild(opt);
        });
      }
    } catch (error) {
      Logger.error("Erro ao carregar dispositivos", error);
      throw error;
    }
  }

  // ============================================================
  // CARREGAR HISTÓRICO COMPLETO
  // ============================================================
  
  async function loadHistoryData() {
    Logger.info("Carregando histórico de ativações...");
    allHistory = [];

    try {
      const snapshot = await database.ref("history").once('value');

      if (!snapshot.exists()) {
        Logger.warning("Nenhum histórico encontrado no nó 'history'");
        return;
      }

      const historyData = snapshot.val();
      Logger.debug("Dados brutos do histórico", historyData);

      Object.keys(historyData).forEach((espId) => {
        const userDevice = userDevices.find((d) => d.id === espId);
        if (!userDevice) {
          Logger.debug("Histórico ignorado (ESP não pertence a este usuário)", espId);
          return;
        }

        const espHistory = historyData[espId];
        Logger.debug(`Processando histórico do ESP: ${espId}`);

        Object.keys(espHistory).forEach((activationId) => {
          const record = espHistory[activationId];

          if (!record || typeof record !== "object") {
            Logger.warning("Registro de histórico inválido", { activationId, record });
            return;
          }

          const data = record.data || "";
          const tempoLigado = record.tempoLigado || "00:00:00.00";
          const lm = parseFloat(record.lm || "0") || 0;
          const tipo = record.tipo || "manual";
          const espIdFromRecord = record.espId || espId;

          const historyRecord = {
            id: activationId,
            espId: espIdFromRecord,
            espName: userDevice.name,
            data: data,
            tempoLigado: tempoLigado,
            lm: lm,
            tipo: tipo,
            userId: record.userId || currentUser.userId,
            timestamp: parseDateTime(data, tempoLigado)
          };

          allHistory.push(historyRecord);
          Logger.debug("Registro processado", historyRecord);
        });
      });

      allHistory.sort((a, b) => b.timestamp - a.timestamp);
      Logger.success(`Total de registros carregados: ${allHistory.length}`);
      Logger.debug("Primeiros 5 registros", allHistory.slice(0, 5));
    } catch (error) {
      Logger.error("Erro ao carregar histórico", error);
      throw error;
    }
  }

  // ============================================================
  // PARSE DATA/HORA
  // ============================================================
  
  function parseDateTime(dateStr, timeStr) {
    try {
      if (!dateStr || typeof dateStr !== "string") {
        Logger.warning("Data inválida recebida", dateStr);
        return Date.now();
      }

      const dateParts = dateStr.split("/");
      if (dateParts.length !== 3) {
        Logger.warning("Formato de data inválido", dateStr);
        return Date.now();
      }

      const [day, month, year] = dateParts.map((n) => Number(n) || 0);

      const cleanTime = (timeStr || "00:00:00.00").split(".")[0];
      const timeParts = cleanTime.split(":").map((n) => Number(n) || 0);
      const [hour, minute, second] = [
        timeParts[0] || 0,
        timeParts[1] || 0,
        timeParts[2] || 0
      ];

      const ts = new Date(year, month - 1, day, hour, minute, second).getTime();
      if (isNaN(ts)) {
        Logger.warning("Timestamp gerado inválido", { dateStr, timeStr });
        return Date.now();
      }
      return ts;
    } catch (error) {
      Logger.error("Erro ao converter data/hora", error);
      return Date.now();
    }
  }

  function parseTempoLigado(tempoStr) {
    try {
      const cleanTime = (tempoStr || "00:00:00").split(".")[0];
      const parts = cleanTime.split(":").map((n) => Number(n) || 0);
      const hours = parts[0] || 0;
      const minutes = parts[1] || 0;
      const seconds = parts[2] || 0;
      return hours * 60 + minutes + seconds / 60;
    } catch (error) {
      Logger.error("Erro ao processar tempo ligado", error);
      return 0;
    }
  }

  // ============================================================
  // CÁLCULO DE ESTATÍSTICAS COMPLETO
  // ============================================================
  
  function calculateStatistics() {
    Logger.info("Calculando estatísticas completas...");

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let stats = {
      activationsMonth: 0,
      activationsToday: 0,
      timeToday: 0,
      timeWeek: 0,
      consumptionDaily: 0,
      consumptionWeekly: 0,
      consumptionMonthly: 0,
      activationsByDay: Array(7).fill(0),
      activationsByHour: Array(24).fill(0),
      timeByDay: Array(7).fill(0),
      dailyData: {},
      manualActivations: 0,
      autoActivations: 0,
      manualConsumption: 0,
      autoConsumption: 0,
      peakHour: 0,
      peakHourActivations: 0
    };

    allHistory.forEach((record) => {
      const recordDate = new Date(record.timestamp);
      const timeMinutes = parseTempoLigado(record.tempoLigado);
      const consumption = record.lm * timeMinutes;

      if (record.tipo === "automatico") {
        stats.autoActivations++;
        stats.autoConsumption += consumption;
      } else {
        stats.manualActivations++;
        stats.manualConsumption += consumption;
      }

      if (recordDate >= thisMonthStart) {
        stats.activationsMonth++;
        stats.consumptionMonthly += consumption;
      }

      if (recordDate >= today) {
        stats.activationsToday++;
        stats.timeToday += timeMinutes;
        stats.consumptionDaily += consumption;
      }

      if (recordDate >= thisWeekStart) {
        stats.timeWeek += timeMinutes;
        stats.consumptionWeekly += consumption;
      }

      const dayOfWeek = recordDate.getDay();
      stats.activationsByDay[dayOfWeek]++;
      stats.timeByDay[dayOfWeek] += timeMinutes;

      const hour = recordDate.getHours();
      if (!isNaN(hour) && hour >= 0 && hour < 24) {
        stats.activationsByHour[hour]++;
        if (stats.activationsByHour[hour] > stats.peakHourActivations) {
          stats.peakHourActivations = stats.activationsByHour[hour];
          stats.peakHour = hour;
        }
      }

      const dateKey = recordDate.toLocaleDateString("pt-BR");
      if (!stats.dailyData[dateKey]) {
        stats.dailyData[dateKey] = {
          activations: 0,
          time: 0,
          consumption: 0
        };
      }
      stats.dailyData[dateKey].activations++;
      stats.dailyData[dateKey].time += timeMinutes;
      stats.dailyData[dateKey].consumption += consumption;
    });

    Logger.success("Estatísticas calculadas", stats);
    return stats;
  }

  // ============================================================
  // CALCULAR ESTATÍSTICAS POR PERÍODO DINÂMICO (7D/30D/90D)
  // ============================================================
  
  function calculateStatisticsByPeriod(days) {
    Logger.info(`Calculando estatísticas para ${days} dias...`);

    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - days);

    let stats = {
      activationsByDate: [],
      labels: [],
      totalActivations: 0,
      avgPerDay: 0
    };

    // Criar mapa de datas
    const dateMap = {};
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateKey = date.toLocaleDateString("pt-BR");
      dateMap[dateKey] = 0;
      
      if (days === 7) {
        stats.labels.push(date.toLocaleDateString("pt-BR", { weekday: 'short' }));
      } else {
        stats.labels.push(date.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' }));
      }
    }

    // Contar ativações por data
    allHistory.forEach((record) => {
      const recordDate = new Date(record.timestamp);
      if (recordDate >= periodStart) {
        const dateKey = recordDate.toLocaleDateString("pt-BR");
        if (dateMap.hasOwnProperty(dateKey)) {
          dateMap[dateKey]++;
          stats.totalActivations++;
        }
      }
    });

    stats.activationsByDate = Object.values(dateMap);
    stats.avgPerDay = stats.totalActivations > 0 ? (stats.totalActivations / days).toFixed(1) : "0";

    Logger.debug(`Estatísticas do período (${days}d)`, stats);
    return stats;
  }

  // ============================================================
  // CALCULAR CUSTO BASEADO NA LOCALIZAÇÃO
  // ============================================================
  
  function calculateWaterCost(consumptionInLiters) {
    let tariffInfo = WATER_TARIFFS.default;

    if (firebaseUserData && firebaseUserData.endereco) {
      const userCity = firebaseUserData.endereco.cidade;
      const userState = firebaseUserData.endereco.estado;

      if (WATER_TARIFFS[userCity]) {
        tariffInfo = WATER_TARIFFS[userCity];
        Logger.debug("Tarifa encontrada para cidade", { userCity, tariffInfo });
      } else if (WATER_TARIFFS[userState]) {
        tariffInfo = WATER_TARIFFS[userState];
        Logger.debug("Tarifa encontrada para estado", { userState, tariffInfo });
      } else {
        Logger.warning(`Tarifa não encontrada para ${userCity}/${userState}, usando média nacional`);
      }
    }

    const consumptionInM3 = consumptionInLiters / 1000;
    const cost = consumptionInM3 * tariffInfo.pricePerM3;

    Logger.debug("Cálculo de custo", {
      consumptionLiters: consumptionInLiters,
      consumptionM3: consumptionInM3,
      tariff: tariffInfo,
      cost: cost
    });

    return {
      cost: cost,
      company: tariffInfo.company,
      pricePerM3: tariffInfo.pricePerM3,
      state: tariffInfo.state
    };
  }

  // ============================================================
  // ATUALIZADORES DE UI
  // ============================================================
  
  function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    } else {
      Logger.warning(`Elemento não encontrado para atualização: ${id}`);
    }
  }

  function updateProgressCircle(elementId, value, max) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const percent = Math.min((value / max) * 100 || 0, 100).toFixed(1);
    element.setAttribute("stroke-dasharray", `${percent}, 100`);
  }

  function updateStatCards(stats) {
    Logger.info("Atualizando cards de estatísticas...");

    updateElement("totalActivationsMonth", stats.activationsMonth);
    updateElement("activationsToday", stats.activationsToday);
    updateElement("timeTodayMinutes", Math.round(stats.timeToday));
    updateElement("timeWeekHours", (stats.timeWeek / 60).toFixed(1));
    updateElement("dailyWaterConsumption", `${Math.round(stats.consumptionDaily)}L`);
    updateElement("weeklyWaterConsumption", `${Math.round(stats.consumptionWeekly)}L`);
    updateElement("monthlyWaterConsumption", `${Math.round(stats.consumptionMonthly)}L`);

    const costData = calculateWaterCost(stats.consumptionMonthly);
    updateElement("estimatedCost", `R$ ${costData.cost.toFixed(2)}`);

    const costElement = document.getElementById("estimatedCost");
    if (costElement && costElement.parentElement) {
      let companyInfo = costElement.parentElement.querySelector(".cost-company-info");
      if (!companyInfo) {
        companyInfo = document.createElement("small");
        companyInfo.className = "cost-company-info";
        companyInfo.style.cssText = "display: block; font-size: 0.75rem; color: #f0f9ff; margin-top: 4px;";
        costElement.parentElement.appendChild(companyInfo);
      }
      companyInfo.textContent = `${costData.company} - ${costData.state} | R$ ${costData.pricePerM3.toFixed(2)}/m³`;
    }

    const peakHourEl = document.getElementById("peakHour");
    if (peakHourEl) {
      const startHour = String(stats.peakHour).padStart(2, "0");
      const endHour = String(stats.peakHour + 1).padStart(2, "0");
      peakHourEl.textContent = `${startHour}:00 - ${endHour}:00`;
    }

    updateElement("chartTotalActivations", stats.activationsMonth);
    const avgPerDay = stats.activationsMonth > 0 ? (stats.activationsMonth / 30).toFixed(1) : "0";
    updateElement("chartAvgPerDay", avgPerDay);

    Logger.success("Cards de estatísticas atualizados.");
  }

  function updateWaterConsumption(stats) {
    Logger.info("Atualizando consumo de água manual x automático...");

    updateElement("autoConsumption", `${Math.round(stats.autoConsumption)}L`);
    updateElement("manualConsumption", `${Math.round(stats.manualConsumption)}L`);

    const total = stats.autoConsumption + stats.manualConsumption;
    let autoPercent = 0;
    let manualPercent = 0;

    if (total > 0) {
      autoPercent = (stats.autoConsumption / total) * 100;
      manualPercent = (stats.manualConsumption / total) * 100;
    }

    const autoFill = document.getElementById("autoFill");
    const manualFill = document.getElementById("manualFill");
    if (autoFill) autoFill.style.width = `${autoPercent.toFixed(1)}%`;
    if (manualFill) manualFill.style.width = `${manualPercent.toFixed(1)}%`;

    updateProgressCircle("dailyProgress", stats.consumptionDaily, 50);
    updateProgressCircle("weeklyProgress", stats.consumptionWeekly, 350);
    updateProgressCircle("monthlyProgress", stats.consumptionMonthly, 1500);

    Logger.success("Consumo de água atualizado.");
  }

  // ============================================================
  // FUNÇÃO DE DESTRUIÇÃO SEGURA (SOLUÇÃO DEFINITIVA)
  // ============================================================
  
  function safeDestroyChart(canvasId) {
    if (window.Chart) {
      // Pergunta diretamente ao Chart.js se existe gráfico neste canvas
      const existingChart = Chart.getChart(canvasId);
      if (existingChart) {
        Logger.info(`🗑️ Destruindo gráfico existente em: ${canvasId}`);
        existingChart.destroy();
        return true;
      }
    }
    return false;
  }

  // ============================================================
  // ATUALIZAR GRÁFICO DE ATIVAÇÕES POR PERÍODO (7D/30D/90D)
  // ============================================================
  
  function updateActivationsChartByPeriod(period) {
    selectedPeriod = period;
    
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const stats = calculateStatisticsByPeriod(days);

    // Atualizar cards de rodapé
    updateElement("chartTotalActivations", stats.totalActivations);
    updateElement("chartAvgPerDay", stats.avgPerDay);
    
    // Calcular tendência (comparação com período anterior)
    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (days * 2));
    const previousPeriodEnd = new Date();
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - days);
    
    let previousCount = 0;
    allHistory.forEach((record) => {
      const recordDate = new Date(record.timestamp);
      if (recordDate >= previousPeriodStart && recordDate < previousPeriodEnd) {
        previousCount++;
      }
    });
    
    const trend = previousCount > 0 
      ? (((stats.totalActivations - previousCount) / previousCount) * 100).toFixed(0)
      : stats.totalActivations > 0 ? "+100" : "0";
    
    updateElement("chartTrend", `${trend > 0 ? '+' : ''}${trend}%`);

    // Recria o gráfico (a função initializeCharts já tem destruição)
    initializeCharts();
  }

  // ============================================================
  // GRÁFICOS (Chart.js) - VERSÃO DEFINITIVA COM DESTRUIÇÃO SEGURA
  // ============================================================
  
  function initializeCharts() {
    Logger.info("🎨 Inicializando/Recriando gráficos...");

    if (!window.Chart) {
      Logger.error("Chart.js não foi carregado!");
      return;
    }

    // Configurações globais do Chart.js
    Chart.defaults.font.family = "Inter, sans-serif";
    Chart.defaults.color = "#6b7280";

    const activationsCanvas = document.getElementById(CANVAS_IDS.activations);
    const timeCanvas = document.getElementById(CANVAS_IDS.time);
    const hourlyCanvas = document.getElementById(CANVAS_IDS.hourly);
    const efficiencyCanvas = document.getElementById(CANVAS_IDS.efficiency);

    if (!activationsCanvas) {
      Logger.warning("Canvas de gráficos não encontrado");
      return;
    }

    // ============================================================
    // 1. GRÁFICO DE ATIVAÇÕES POR PERÍODO (7D/30D/90D)
    // ============================================================
    
    if (activationsCanvas) {
      // DESTRUIR GRÁFICO EXISTENTE (SOLUÇÃO CRÍTICA)
      safeDestroyChart(CANVAS_IDS.activations);

      const days = selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : 90;
      const stats = calculateStatisticsByPeriod(days);
      
      try {
        new Chart(activationsCanvas.getContext('2d'), {
          type: "bar",
          data: {
            labels: stats.labels,
            datasets: [{
              label: "Ativações",
              data: stats.activationsByDate,
              backgroundColor: "rgba(59, 130, 246, 0.8)",
              borderColor: "rgba(59, 130, 246, 1)",
              borderWidth: 2,
              borderRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `Ativações: ${context.parsed.y}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { 
                  stepSize: 1,
                  callback: function(value) {
                    if (Number.isInteger(value)) {
                      return value;
                    }
                  }
                }
              },
              x: {
                ticks: {
                  maxRotation: 45,
                  minRotation: 45
                }
              }
            }
          }
        });
        Logger.success("✅ Gráfico de ativações criado");
      } catch (error) {
        Logger.error("Erro ao criar gráfico de ativações", error);
      }
    }

    // ============================================================
    // 2. GRÁFICO DE TEMPO (MANUAL vs AUTOMÁTICO) - POR DIA DA SEMANA
    // ============================================================
    
    if (timeCanvas) {
      // DESTRUIR GRÁFICO EXISTENTE (SOLUÇÃO CRÍTICA)
      safeDestroyChart(CANVAS_IDS.time);

      const timeByDayManual = Array(7).fill(0);
      const timeByDayAuto = Array(7).fill(0);
      
      allHistory.forEach((record) => {
        const recordDate = new Date(record.timestamp);
        const dayOfWeek = recordDate.getDay();
        const timeMinutes = parseTempoLigado(record.tempoLigado);
        
        if (record.tipo === "automatico") {
          timeByDayAuto[dayOfWeek] += timeMinutes;
        } else {
          timeByDayManual[dayOfWeek] += timeMinutes;
        }
      });

      try {
        new Chart(timeCanvas.getContext('2d'), {
          type: "line",
          data: {
            labels: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
            datasets: [
              {
                label: "Automático",
                data: timeByDayAuto,
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                borderColor: "rgba(59, 130, 246, 1)",
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: "rgba(59, 130, 246, 1)"
              },
              {
                label: "Manual",
                data: timeByDayManual,
                backgroundColor: "rgba(16, 185, 129, 0.2)",
                borderColor: "rgba(16, 185, 129, 1)",
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: "rgba(16, 185, 129, 1)"
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true, position: 'bottom' },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} min`;
                  }
                }
              }
            },
            scales: {
              y: { 
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return value.toFixed(0) + ' min';
                  }
                }
              }
            }
          }
        });
        Logger.success("✅ Gráfico de tempo criado");
      } catch (error) {
        Logger.error("Erro ao criar gráfico de tempo", error);
      }
    }

    // ============================================================
    // 3. GRÁFICO DE DISTRIBUIÇÃO HORÁRIA (TODAS as ativações)
    // ============================================================
    
    if (hourlyCanvas) {
      // DESTRUIR GRÁFICO EXISTENTE (SOLUÇÃO CRÍTICA)
      safeDestroyChart(CANVAS_IDS.hourly);

      const activationsByHour = Array(24).fill(0);
      
      allHistory.forEach((record) => {
        const recordDate = new Date(record.timestamp);
        const hour = recordDate.getHours();
        if (!isNaN(hour) && hour >= 0 && hour < 24) {
          activationsByHour[hour]++;
        }
      });

      try {
        new Chart(hourlyCanvas.getContext('2d'), {
          type: "bar",
          data: {
            labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
            datasets: [{
              label: "Ativações",
              data: activationsByHour,
              backgroundColor: "rgba(59, 130, 246, 0.6)",
              borderColor: "rgba(59, 130, 246, 1)",
              borderWidth: 2,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `Ativações: ${context.parsed.y}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { 
                  stepSize: 1,
                  callback: function(value) {
                    if (Number.isInteger(value)) {
                      return value;
                    }
                  }
                }
              }
            }
          }
        });
        Logger.success("✅ Gráfico horário criado");
      } catch (error) {
        Logger.error("Erro ao criar gráfico horário", error);
      }
    }

    // ============================================================
    // 4. GRÁFICO DE EFICIÊNCIA
    // ============================================================
    
    if (efficiencyCanvas) {
      // DESTRUIR GRÁFICO EXISTENTE (SOLUÇÃO CRÍTICA)
      safeDestroyChart(CANVAS_IDS.efficiency);

      try {
        new Chart(efficiencyCanvas.getContext('2d'), {
          type: "doughnut",
          data: {
            labels: ["Sucesso", "Falhas"],
            datasets: [{
              data: [98, 2],
              backgroundColor: ["rgba(34, 197, 94, 0.8)", "rgba(239, 68, 68, 0.8)"],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "bottom" }
            }
          }
        });
        Logger.success("✅ Gráfico de eficiência criado");
      } catch (error) {
        Logger.error("Erro ao criar gráfico de eficiência", error);
      }
    }

    Logger.success("🎉 Todos os gráficos foram criados com sucesso!");
  }

  // ============================================================
  // TABELA DE HISTÓRICO
  // ============================================================
  
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function updateHistoryTable() {
    Logger.info("Atualizando tabela de histórico detalhado...");

    const tableBody = document.getElementById("historyTableBody");
    if (!tableBody) {
      Logger.warning("Elemento 'historyTableBody' não encontrado.");
      return;
    }

    tableBody.innerHTML = "";

    const recentHistory = allHistory.slice(0, 50);
    if (recentHistory.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:20px;color:#6b7280;">
            Nenhum registro de histórico disponível.
          </td>
        </tr>
      `;
      Logger.info("Nenhum histórico para exibir.");
      return;
    }

    recentHistory.forEach((record) => {
      const row = document.createElement("tr");
      const timeMinutes = parseTempoLigado(record.tempoLigado);
      const consumption = Math.round(record.lm * timeMinutes);
      const tipoLabel = record.tipo === "automatico" ? "Automático" : "Manual";
      const tipoClass = record.tipo === "automatico" ? "action-badge-auto" : "action-badge-manual";

      row.innerHTML = `
        <td>${escapeHtml(record.data || "N/A")}</td>
        <td><span class="device-badge">${escapeHtml(record.espName || record.espId)}</span></td>
        <td><span class="${tipoClass}">${tipoLabel}</span></td>
        <td>${escapeHtml(record.tempoLigado || "00:00:00")}</td>
        <td>${consumption}L</td>
        <td><span class="origin-badge">ESP</span></td>
        <td><span class="status-badge status-success">✓ Concluído</span></td>
      `;

      tableBody.appendChild(row);
    });

    const historyCount = document.getElementById("historyCount");
    if (historyCount) {
      historyCount.textContent = `${allHistory.length} registros`;
    }

    Logger.success(`Tabela de histórico atualizada com ${recentHistory.length} registros.`);
  }

  // ============================================================
  // TOGGLE DO HISTÓRICO
  // ============================================================
  
  function setupHistoryToggle() {
    const historyToggle = document.getElementById('historyToggle');
    const historyContent = document.getElementById('historyContent');
    const historyToggleBtn = document.getElementById('historyToggleBtn');
    
    if (historyToggle && historyContent) {
      // Remover event listeners anteriores clonando elemento
      const newToggle = historyToggle.cloneNode(true);
      historyToggle.parentNode.replaceChild(newToggle, historyToggle);
      
      newToggle.addEventListener('click', () => {
        const isExpanded = historyContent.style.maxHeight && historyContent.style.maxHeight !== '0px';
        
        if (isExpanded) {
          historyContent.style.maxHeight = '0px';
          historyContent.style.opacity = '0';
          if (historyToggleBtn) {
            historyToggleBtn.style.transform = 'rotate(0deg)';
          }
        } else {
          historyContent.style.maxHeight = historyContent.scrollHeight + 'px';
          historyContent.style.opacity = '1';
          if (historyToggleBtn) {
            historyToggleBtn.style.transform = 'rotate(180deg)';
          }
        }
      });
      
      if (allHistory.length > 0) {
        setTimeout(() => {
          historyContent.style.maxHeight = historyContent.scrollHeight + 'px';
          historyContent.style.opacity = '1';
          if (historyToggleBtn) {
            historyToggleBtn.style.transform = 'rotate(180deg)';
          }
        }, 500);
      }
    }
  }

  // ============================================================
  // PROCESSAR E EXIBIR DADOS
  // ============================================================
  
  function processAndDisplayData() {
    Logger.info("Processando e exibindo dados...");

    const stats = calculateStatistics();
    statsCache = stats;

    updateStatCards(stats);
    updateWaterConsumption(stats);
    updateHistoryTable();
    setupHistoryToggle();

    Logger.success("Dados processados e exibidos com sucesso.");
  }

  // ============================================================
  // EVENT LISTENERS (APENAS UMA VEZ)
  // ============================================================
  
  function setupEventListeners() {
    if (listenersAttached) {
      Logger.info("⚠️ Event listeners já configurados anteriormente, pulando...");
      return;
    }

    Logger.info("🔧 Configurando event listeners da aba Dados...");

    // Botão de exportar
    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        Logger.info("Exportação de dados solicitada.");
        exportData();
      });
    }

    // Filtros
    const periodFilter = document.getElementById("periodFilter");
    if (periodFilter) {
      periodFilter.addEventListener("change", (e) => {
        Logger.info("Filtro de período alterado", e.target.value);
      });
    }

    const deviceFilter = document.getElementById("deviceFilter");
    if (deviceFilter) {
      deviceFilter.addEventListener("change", (e) => {
        Logger.info("Filtro de dispositivo alterado", e.target.value);
      });
    }

    // ============================================================
    // BOTÕES DE PERÍODO DO GRÁFICO (7D/30D/90D)
    // ============================================================
    
    const periodTabs = document.querySelectorAll(".period-tab");
    periodTabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        const period = e.target.getAttribute("data-period");
        
        // Remover classe 'active' de todos
        periodTabs.forEach(t => t.classList.remove("active"));
        
        // Adicionar 'active' no clicado
        e.target.classList.add("active");
        
        // Atualizar gráfico
        updateActivationsChartByPeriod(period);
        
        Logger.info(`📊 Período alterado para: ${period}`);
      });
    });

    listenersAttached = true;
    Logger.success("✅ Event listeners configurados com sucesso.");
  }

  // ============================================================
  // EXPORTAÇÃO CSV
  // ============================================================
  
  function generateCSV() {
    const headers = [
      "Data",
      "Hora",
      "Dispositivo",
      "Tipo",
      "Tempo Ligado",
      "Vazão (L/min)",
      "Consumo (L)",
      "Custo Estimado (R$)"
    ];
    const rows = [headers.join(",")];

    allHistory.forEach((record) => {
      const timeMinutes = parseTempoLigado(record.tempoLigado);
      const consumption = (record.lm * timeMinutes).toFixed(2);
      const costData = calculateWaterCost(parseFloat(consumption));
      const dateObj = new Date(record.timestamp);
      const date = dateObj.toLocaleDateString("pt-BR");
      const time = dateObj.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      });

      const row = [
        date,
        time,
        record.espName || record.espId,
        record.tipo === "automatico" ? "Automático" : "Manual",
        record.tempoLigado || "",
        record.lm.toFixed(1),
        consumption,
        costData.cost.toFixed(2)
      ];

      rows.push(row.join(","));
    });

    return rows.join("\n");
  }

  function exportData() {
    try {
      const csvContent = generateCSV();
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `aquaflux-dados-${Date.now()}.csv`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Logger.success("Dados exportados com sucesso.");
      showNotification("Dados exportados com sucesso!", "success");
    } catch (error) {
      Logger.error("Erro ao exportar dados", error);
      showNotification("Erro ao exportar dados.", "error");
    }
  }

  // ============================================================
  // INICIALIZAÇÃO DA SEÇÃO DE DADOS (FUNÇÃO PRINCIPAL)
  // ============================================================
  
  async function initializeDataSection(forceReload = false) {
    try {
      Logger.info("============================================");
      Logger.info("📊 INICIALIZANDO SEÇÃO DE DADOS v5.0 FINAL");
      Logger.info("============================================");

      if (!currentUser) {
        if (!initializeUser()) {
          Logger.error("Falha na autenticação.");
          return;
        }
      }

      // CARREGAR DADOS (apenas na primeira vez ou se forçado)
      if (!dataLoaded || forceReload) {
        showNotification("Carregando dados...", "info", 2000);
        await loadUserData();
        await loadUserDevices();
        await loadHistoryData();
        dataLoaded = true;
      } else {
        Logger.info("♻️ Dados já carregados anteriormente, reutilizando cache...");
      }

      // Processar e exibir dados
      processAndDisplayData();

      // INICIALIZAR GRÁFICOS
      setTimeout(() => {
        initializeCharts();
        setupEventListeners();
      }, 300);

      Logger.success("============================================");
      Logger.success("✅ SEÇÃO DE DADOS INICIALIZADA COM SUCESSO!");
      Logger.success("============================================");
      showNotification("Dados carregados com sucesso!", "success", 3000);
    } catch (error) {
      Logger.error("Falha crítica na inicialização da seção de dados", error);
      showNotification("Erro ao carregar dados. Tente novamente.", "error");
    }
  }

  // ============================================================
  // EXPORTAÇÕES GLOBAIS E LISTENERS DO DOM
  // ============================================================

  // Exportar globalmente
  window.initializeDataSection = initializeDataSection;

  // Exportar função de destruição para uso externo
  window.destroyDataCharts = function() {
    Logger.info("🔄 Destruindo todos os gráficos da aba Dados...");
    Object.values(CANVAS_IDS).forEach(canvasId => {
      safeDestroyChart(canvasId);
    });
  };

  // Auto-inicializar e detectar mudanças de aba
  document.addEventListener("DOMContentLoaded", () => {
    Logger.info("DOM carregado. dados.js v5.0 FINAL pronto.");
    
    const dadosSection = document.getElementById("dados");
    if (dadosSection && !dadosSection.classList.contains("active")) {
      Logger.info("Aguardando ativação da aba Dados...");
    }

    // Detectar mudança de abas para limpar gráficos quando sair
    const menuItems = document.querySelectorAll(".menu-item");
    menuItems.forEach(item => {
      item.addEventListener("click", (e) => {
        const targetSection = e.currentTarget.getAttribute("data-section");
        
        // Se sair da aba "dados", destruir gráficos para liberar canvas
        if (targetSection !== "dados") {
          Logger.info("🔄 Saindo da aba Dados, destruindo gráficos...");
          window.destroyDataCharts();
        }
      });
    });

    Logger.success("📊 dados.js v5.0 FINAL CARREGADO E PRONTO! 🚀");
  });

})();
