/**
 * RELATORIOS.JS - Sistema Completo de Geração de Relatórios
 * AquaFlux v2.0 - SEM DUPLICAR FIREBASE
 */

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getDatabase, ref, get, set, push } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

// ========== CONFIGURAÇÃO FIREBASE (REUTILIZAR SE JÁ EXISTIR) ==========
const firebaseConfig = {
    apiKey: "AIzaSyBycnpeGWw-ecRDXLxdOrNAMhfQzLWwp4",
    authDomain: "aqua-flux.firebaseapp.com",
    databaseURL: "https://aqua-flux-default-rtdb.firebaseio.com",
    projectId: "aqua-flux",
    storageBucket: "aqua-flux.firebasestorage.app",
    messagingSenderId: "188013221293",
    appId: "1:188013221293:web:c98dc4ef68966f95677d24"
};

// Verificar se Firebase já foi inicializado
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('🔥 Firebase inicializado (novo)');
} else {
    app = getApp();
    console.log('🔥 Firebase reutilizado (já existente)');
}

const database = getDatabase(app);

// ========== VARIÁVEIS GLOBAIS ==========
let currentUser = null;
let userDevices = [];
let allHistory = [];
let savedReports = [];

// Tarifas de água
const WATER_TARIFFS = {
    'São Paulo': { company: 'SABESP', pricePerM3: 6.40, state: 'SP' },
    'SP': { company: 'SABESP', pricePerM3: 6.40, state: 'SP' },
    'Brasília': { company: 'CAESB', pricePerM3: 6.20, state: 'DF' },
    'DF': { company: 'CAESB', pricePerM3: 6.20, state: 'DF' },
    'default': { company: 'Média Nacional', pricePerM3: 6.50, state: 'BR' }
};

// ========== INICIALIZAÇÃO ==========
console.log('📊 Relatórios.js iniciando...');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    console.log('📊 Inicializando sistema de relatórios...');
    
    if (!initializeUser()) {
        return;
    }
    
    setupEventListeners();
    loadAllData();
}

function initializeUser() {
    const userData = localStorage.getItem('aquaflux-userdata') || localStorage.getItem('aquafluxuserdata');
    
    if (!userData) {
        showNotification('Sessão expirada. Faça login novamente.', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        return false;
    }
    
    try {
        currentUser = JSON.parse(userData);
        console.log('✅ Usuário autenticado:', currentUser.nome);
        return true;
    } catch (error) {
        console.error('❌ Erro ao carregar usuário:', error);
        return false;
    }
}

// ========== CARREGAR DADOS ==========
async function loadAllData() {
    try {
        showNotification('Carregando dados...', 'info', 2000);
        await loadUserDevices();
        await loadHistoryData();
        await loadSavedReports();
        console.log('✅ Dados carregados com sucesso');
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        showNotification('Erro ao carregar dados', 'error');
    }
}

async function loadUserDevices() {
    try {
        const arduinosRef = ref(database, 'arduinos');
        const snapshot = await get(arduinosRef);
        
        if (snapshot.exists()) {
            const arduinos = snapshot.val();
            userDevices = [];
            
            Object.keys(arduinos).forEach(espId => {
                const esp = arduinos[espId];
                if (esp && esp.userId === currentUser.userId) {
                    userDevices.push({
                        id: espId,
                        name: esp.deviceName || espId,
                        online: !!esp.online,
                        waterFlow: esp.waterFlow || 5.0
                    });
                }
            });
            
            console.log('✅ Dispositivos:', userDevices.length);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar dispositivos:', error);
    }
}

async function loadHistoryData() {
    try {
        const historyRef = ref(database, 'history');
        const snapshot = await get(historyRef);
        
        if (!snapshot.exists()) {
            console.log('⚠️ Nenhum histórico encontrado');
            return;
        }
        
        const historyData = snapshot.val();
        allHistory = [];
        
        Object.keys(historyData).forEach(espId => {
            const userDevice = userDevices.find(d => d.id === espId);
            if (!userDevice) return;
            
            const espHistory = historyData[espId];
            Object.keys(espHistory).forEach(historyId => {
                const record = espHistory[historyId];
                allHistory.push({
                    id: historyId,
                    espId: espId,
                    espName: userDevice.name,
                    data: record.data,
                    tempoLigado: record.tempoLigado || '00:00:00',
                    lm: parseFloat(record.lm || 0),
                    tipo: record.tipo || 'manual',
                    timestamp: parseDateTime(record.data, record.tempoLigado || '00:00:00')
                });
            });
        });
        
        allHistory.sort((a, b) => b.timestamp - a.timestamp);
        console.log('✅ Histórico:', allHistory.length, 'registros');
    } catch (error) {
        console.error('❌ Erro ao carregar histórico:', error);
    }
}

async function loadSavedReports() {
    try {
        const reportsRef = ref(database, 'users/' + currentUser.userId + '/reports');
        const snapshot = await get(reportsRef);
        
        savedReports = [];
        
        if (snapshot.exists()) {
            const reports = snapshot.val();
            savedReports = Object.keys(reports).map(key => ({
                id: key,
                ...reports[key]
            }));
            console.log('✅ Relatórios salvos:', savedReports.length);
        } else {
            console.log('⚠️ Nenhum relatório salvo');
        }
        
        renderSavedReports();
    } catch (error) {
        console.error('❌ Erro ao carregar relatórios:', error);
    }
}

// ========== CÁLCULOS ==========
function calculateStatistics(startDate, endDate) {
    let filteredHistory = allHistory;
    
    if (startDate && endDate) {
        filteredHistory = allHistory.filter(record => {
            const recordDate = new Date(record.timestamp);
            return recordDate >= startDate && recordDate <= endDate;
        });
    }
    
    const stats = {
        activationsTotal: 0,
        activationsAuto: 0,
        activationsManual: 0,
        totalTime: 0,
        consumption: 0,
        dailyAvg: 0,
        peakHour: 0,
        peakHourCount: 0,
        deviceStats: {}
    };
    
    filteredHistory.forEach(record => {
        const timeMinutes = parseTempoLigado(record.tempoLigado);
        const consumption = record.lm * timeMinutes;
        
        stats.activationsTotal++;
        stats.totalTime += timeMinutes;
        stats.consumption += consumption;
        
        if (record.tipo === 'automatico') {
            stats.activationsAuto++;
        } else {
            stats.activationsManual++;
        }
        
        if (!stats.deviceStats[record.espId]) {
            stats.deviceStats[record.espId] = {
                name: record.espName,
                activations: 0,
                time: 0,
                consumption: 0
            };
        }
        stats.deviceStats[record.espId].activations++;
        stats.deviceStats[record.espId].time += timeMinutes;
        stats.deviceStats[record.espId].consumption += consumption;
    });
    
    if (startDate && endDate) {
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        stats.dailyAvg = days > 0 ? (stats.activationsTotal / days).toFixed(1) : 0;
    }
    
    return stats;
}

function calculateWaterCost(consumptionInLiters) {
    let tariffInfo = WATER_TARIFFS['default'];
    
    if (currentUser.endereco) {
        const userCity = currentUser.endereco.cidade;
        const userState = currentUser.endereco.estado;
        
        if (WATER_TARIFFS[userCity]) {
            tariffInfo = WATER_TARIFFS[userCity];
        } else if (WATER_TARIFFS[userState]) {
            tariffInfo = WATER_TARIFFS[userState];
        }
    }
    
    const consumptionInM3 = consumptionInLiters / 1000;
    const cost = consumptionInM3 * tariffInfo.pricePerM3;
    
    return {
        cost: cost,
        company: tariffInfo.company,
        pricePerM3: tariffInfo.pricePerM3,
        state: tariffInfo.state
    };
}

// ========== GERAÇÃO DE RELATÓRIOS ==========
async function generateReport(type) {
    try {
        console.log('📊 Gerando relatório:', type);
        showNotification('Gerando relatório...', 'info');
        
        let reportData;
        
        if (type === 'monthly') {
            reportData = await generateMonthlyReport();
        } else if (type === 'costs') {
            reportData = await generateCostsReport();
        } else if (type === 'performance') {
            reportData = await generatePerformanceReport();
        } else if (type === 'custom') {
            reportData = await generateCustomReport();
        } else {
            throw new Error('Tipo inválido');
        }
        
        console.log('📊 Relatório gerado:', reportData);
        
        await saveReportToDatabase(reportData);
        await downloadReportPDF(reportData);
        
        showNotification('Relatório gerado com sucesso!', 'success');
        await loadSavedReports();
        
    } catch (error) {
        console.error('❌ Erro:', error);
        showNotification('Erro ao gerar relatório', 'error');
    }
}

async function generateMonthlyReport() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const stats = calculateStatistics(monthStart, monthEnd);
    const costData = calculateWaterCost(stats.consumption);
    
    const monthName = monthStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    return {
        type: 'monthly',
        title: 'Relatório Mensal - ' + monthName,
        period: monthStart.toLocaleDateString('pt-BR') + ' a ' + monthEnd.toLocaleDateString('pt-BR'),
        generatedAt: new Date().toISOString(),
        data: {
            activationsTotal: stats.activationsTotal,
            activationsAuto: stats.activationsAuto,
            activationsManual: stats.activationsManual,
            totalTime: stats.totalTime,
            consumption: stats.consumption,
            cost: costData.cost,
            costCompany: costData.company,
            dailyAvg: stats.dailyAvg,
            peakHour: stats.peakHour,
            deviceStats: stats.deviceStats
        }
    };
}

async function generateCostsReport() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const stats = calculateStatistics(monthStart, monthEnd);
    const costData = calculateWaterCost(stats.consumption);
    
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const prevStats = calculateStatistics(prevMonthStart, prevMonthEnd);
    const prevCostData = calculateWaterCost(prevStats.consumption);
    
    const savings = prevCostData.cost - costData.cost;
    const savingsPercent = prevCostData.cost > 0 ? ((savings / prevCostData.cost) * 100).toFixed(1) : 0;
    
    return {
        type: 'costs',
        title: 'Relatório de Custos',
        period: monthStart.toLocaleDateString('pt-BR') + ' a ' + monthEnd.toLocaleDateString('pt-BR'),
        generatedAt: new Date().toISOString(),
        data: {
            currentMonth: {
                consumption: stats.consumption,
                cost: costData.cost,
                company: costData.company,
                pricePerM3: costData.pricePerM3
            },
            previousMonth: {
                consumption: prevStats.consumption,
                cost: prevCostData.cost
            },
            savings: savings,
            savingsPercent: savingsPercent
        }
    };
}

async function generatePerformanceReport() {
    const now = new Date();
    const last30Days = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const stats = calculateStatistics(last30Days, now);
    
    const totalDevices = userDevices.length;
    const successRate = stats.activationsTotal > 0 ? ((stats.activationsAuto / stats.activationsTotal) * 100).toFixed(1) : 0;
    
    return {
        type: 'performance',
        title: 'Relatório de Performance',
        period: 'Últimos 30 dias',
        generatedAt: new Date().toISOString(),
        data: {
            totalDevices: totalDevices,
            onlineDevices: userDevices.filter(d => d.online).length,
            activationsTotal: stats.activationsTotal,
            successRate: successRate,
            avgPerDay: (stats.activationsTotal / 30).toFixed(1),
            peakHour: String(stats.peakHour).padStart(2, '0') + ':00',
            consumption: stats.consumption,
            deviceStats: stats.deviceStats
        }
    };
}

async function generateCustomReport() {
    const now = new Date();
    const last7Days = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const stats = calculateStatistics(last7Days, now);
    const costData = calculateWaterCost(stats.consumption);
    
    return {
        type: 'custom',
        title: 'Relatório Customizado - Últimos 7 Dias',
        period: last7Days.toLocaleDateString('pt-BR') + ' a ' + now.toLocaleDateString('pt-BR'),
        generatedAt: new Date().toISOString(),
        data: {
            activationsTotal: stats.activationsTotal,
            totalTime: stats.totalTime,
            consumption: stats.consumption,
            cost: costData.cost,
            deviceStats: stats.deviceStats
        }
    };
}

// ========== SALVAR NO FIREBASE ==========
async function saveReportToDatabase(reportData) {
    try {
        const reportsRef = ref(database, 'users/' + currentUser.userId + '/reports');
        const newReportRef = push(reportsRef);
        
        await set(newReportRef, {
            type: reportData.type,
            title: reportData.title,
            period: reportData.period,
            generatedAt: reportData.generatedAt,
            data: reportData.data,
            savedAt: new Date().toISOString(),
            userId: currentUser.userId
        });
        
        console.log('✅ Salvo no Firebase:', newReportRef.key);
        return newReportRef.key;
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        throw error;
    }
}

// ========== GERAR PDF ==========
async function downloadReportPDF(reportData) {
    try {
        if (typeof window.jspdf === 'undefined') {
            console.log('📥 Carregando jsPDF...');
            await loadJsPDF();
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 20;
        
        // Cabeçalho
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text('AquaFlux', pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 12;
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(reportData.title, pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Período: ' + reportData.period, pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 5;
        const dateStr = new Date(reportData.generatedAt).toLocaleString('pt-BR');
        doc.text('Gerado em: ' + dateStr, pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 15;
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.5);
        doc.line(20, yPos, pageWidth - 20, yPos);
        yPos += 15;
        
        // Conteúdo
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        const data = reportData.data;
        
        if (reportData.type === 'monthly') {
            doc.setFont('helvetica', 'bold');
            doc.text('Resumo Mensal:', 20, yPos);
            yPos += 8;
            doc.setFont('helvetica', 'normal');
            
            doc.text('Total de Ativações: ' + data.activationsTotal, 25, yPos);
            yPos += 7;
            doc.text('Ativações Automáticas: ' + data.activationsAuto, 25, yPos);
            yPos += 7;
            doc.text('Ativações Manuais: ' + data.activationsManual, 25, yPos);
            yPos += 7;
            doc.text('Tempo Total: ' + Math.round(data.totalTime) + ' minutos', 25, yPos);
            yPos += 7;
            doc.text('Consumo de Água: ' + Math.round(data.consumption) + ' litros', 25, yPos);
            yPos += 7;
            doc.text('Custo Estimado: R$ ' + data.cost.toFixed(2) + ' (' + data.costCompany + ')', 25, yPos);
            yPos += 7;
            doc.text('Média Diária: ' + data.dailyAvg + ' ativações/dia', 25, yPos);
        }
        
        if (reportData.type === 'costs') {
            doc.setFont('helvetica', 'bold');
            doc.text('Análise de Custos:', 20, yPos);
            yPos += 10;
            doc.text('Mês Atual:', 20, yPos);
            yPos += 7;
            doc.setFont('helvetica', 'normal');
            doc.text('Consumo: ' + Math.round(data.currentMonth.consumption) + ' litros', 25, yPos);
            yPos += 7;
            doc.text('Custo: R$ ' + data.currentMonth.cost.toFixed(2), 25, yPos);
            yPos += 7;
            doc.text('Companhia: ' + data.currentMonth.company, 25, yPos);
            yPos += 10;
            doc.setFont('helvetica', 'bold');
            doc.text('Mês Anterior:', 20, yPos);
            yPos += 7;
            doc.setFont('helvetica', 'normal');
            doc.text('Consumo: ' + Math.round(data.previousMonth.consumption) + ' litros', 25, yPos);
            yPos += 7;
            doc.text('Custo: R$ ' + data.previousMonth.cost.toFixed(2), 25, yPos);
            yPos += 10;
            const savingsText = data.savings >= 0 ? 'Economia' : 'Aumento';
            doc.text(savingsText + ': R$ ' + Math.abs(data.savings).toFixed(2) + ' (' + data.savingsPercent + '%)', 25, yPos);
        }
        
        if (reportData.type === 'performance') {
            doc.setFont('helvetica', 'bold');
            doc.text('Análise de Performance:', 20, yPos);
            yPos += 8;
            doc.setFont('helvetica', 'normal');
            doc.text('Total de Dispositivos: ' + data.totalDevices, 25, yPos);
            yPos += 7;
            doc.text('Dispositivos Online: ' + data.onlineDevices, 25, yPos);
            yPos += 7;
            doc.text('Total de Ativações: ' + data.activationsTotal, 25, yPos);
            yPos += 7;
            doc.text('Taxa de Sucesso: ' + data.successRate + '%', 25, yPos);
            yPos += 7;
            doc.text('Média por Dia: ' + data.avgPerDay + ' ativações', 25, yPos);
            yPos += 7;
            doc.text('Consumo Total: ' + Math.round(data.consumption) + ' litros', 25, yPos);
        }
        
        if (reportData.type === 'custom') {
            doc.setFont('helvetica', 'bold');
            doc.text('Relatório Customizado:', 20, yPos);
            yPos += 8;
            doc.setFont('helvetica', 'normal');
            doc.text('Total de Ativações: ' + data.activationsTotal, 25, yPos);
            yPos += 7;
            doc.text('Tempo Total: ' + Math.round(data.totalTime) + ' minutos', 25, yPos);
            yPos += 7;
            doc.text('Consumo: ' + Math.round(data.consumption) + ' litros', 25, yPos);
            yPos += 7;
            doc.text('Custo: R$ ' + data.cost.toFixed(2), 25, yPos);
        }
        
        // Dispositivos
        if (data.deviceStats && Object.keys(data.deviceStats).length > 0) {
            yPos += 15;
            doc.setFont('helvetica', 'bold');
            doc.text('Por Dispositivo:', 20, yPos);
            yPos += 8;
            doc.setFont('helvetica', 'normal');
            
            Object.values(data.deviceStats).forEach(device => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                const deviceText = device.name + ': ' + device.activations + ' ativações, ' + Math.round(device.consumption) + ' litros';
                doc.text(deviceText, 25, yPos);
                yPos += 6;
            });
        }
        
        // Rodapé
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('AquaFlux - Sistema Inteligente de Irrigação', pageWidth / 2, 285, { align: 'center' });
        
        const filename = 'aquaflux-' + reportData.type + '-' + Date.now() + '.pdf';
        doc.save(filename);
        
        console.log('✅ PDF gerado:', filename);
    } catch (error) {
        console.error('❌ Erro ao gerar PDF:', error);
        throw error;
    }
}

function loadJsPDF() {
    return new Promise((resolve, reject) => {
        if (typeof window.jspdf !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            console.log('✅ jsPDF carregado');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ Erro ao carregar jsPDF');
            reject(new Error('Falha ao carregar jsPDF'));
        };
        document.head.appendChild(script);
    });
}

// ========== RENDERIZAR RELATÓRIOS ==========
function renderSavedReports() {
    const tbody = document.querySelector('#relatorios tbody');
    
    if (!tbody) {
        console.warn('⚠️ tbody não encontrado');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (savedReports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:#6b7280;">Nenhum relatório salvo</td></tr>';
        return;
    }
    
    const typeLabels = {
        'monthly': 'Mensal',
        'costs': 'Custos',
        'performance': 'Performance',
        'custom': 'Customizado'
    };
    
    savedReports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    
    savedReports.forEach(report => {
        const row = document.createElement('tr');
        const date = new Date(report.generatedAt);
        
        row.innerHTML = '<td>' + date.toLocaleDateString('pt-BR') + '</td>' +
                       '<td><span class="device-badge">' + typeLabels[report.type] + '</span></td>' +
                       '<td>' + report.period + '</td>' +
                       '<td><span class="status-badge status-success">✓ Completo</span></td>' +
                       '<td><button class="export-btn download-report-btn" data-report-id="' + report.id + '" style="padding: 8px 15px; font-size: 12px;">📥 Download</button></td>';
        
        tbody.appendChild(row);
    });
    
    document.querySelectorAll('.download-report-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const reportId = this.getAttribute('data-report-id');
            downloadSavedReport(reportId);
        });
    });
    
    console.log('✅ Renderizados:', savedReports.length, 'relatórios');
}

async function downloadSavedReport(reportId) {
    try {
        showNotification('Gerando PDF...', 'info');
        
        const report = savedReports.find(r => r.id === reportId);
        if (!report) {
            throw new Error('Relatório não encontrado');
        }
        
        await downloadReportPDF(report);
        showNotification('Download iniciado!', 'success');
    } catch (error) {
        console.error('❌ Erro:', error);
        showNotification('Erro ao baixar', 'error');
    }
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    console.log('⚙️ Configurando listeners...');
    
    const generateBtns = document.querySelectorAll('.generate-report-btn');
    console.log('📌 Botões encontrados:', generateBtns.length);
    
    generateBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            console.log('🖱️ Clique:', type);
            generateReport(type);
        });
    });
    
    console.log('✅ Listeners OK');
}

// ========== AUXILIARES ==========
function parseDateTime(dateStr, timeStr) {
    try {
        if (!dateStr) return Date.now();
        
        const parts = dateStr.split('/');
        if (parts.length !== 3) return Date.now();
        
        const day = Number(parts[0]);
        const month = Number(parts[1]);
        const year = Number(parts[2]);
        
        const tParts = (timeStr || '00:00:00').split(':').map(Number);
        const hour = tParts[0] || 0;
        const minute = tParts[1] || 0;
        const second = tParts[2] || 0;
        
        return new Date(year, month - 1, day, hour, minute, second).getTime();
    } catch (error) {
        return Date.now();
    }
}

function parseTempoLigado(tempoStr) {
    try {
        const cleanTime = (tempoStr || '00:00:00').split('.')[0];
        const parts = cleanTime.split(':').map(n => Number(n) || 0);
        const hours = parts[0] || 0;
        const minutes = parts[1] || 0;
        const seconds = parts[2] || 0;
        return (hours * 60) + minutes + (seconds / 60);
    } catch (error) {
        return 0;
    }
}

function showNotification(message, type, duration) {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type, null, duration || 5000);
    } else {
        console.log('[' + type.toUpperCase() + ']', message);
    }
}

console.log('✅ Relatórios.js carregado!');
