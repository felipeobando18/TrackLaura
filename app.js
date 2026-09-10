const accountData = {
  'Iam light': {
    leads: '642', cpl: '$5.84', spend: '$3,750', daily: '92', campaigns: [
      { name: 'Lead Magnet · Guía de hábitos', conversion: 'Formulario instantáneo', impressions: '428,602', leads: '642', cpl: '$5.84', spend: '$3,750', symbol: '↗', tone: '' },
      { name: 'Masterclass gratuita', conversion: 'Registro de evento', impressions: '187,492', leads: '283', cpl: '$6.18', spend: '$1,749', symbol: '✦', tone: 'yellow' },
      { name: 'Checklist · Captación Q3', conversion: 'Formulario instantáneo', impressions: '74,920', leads: '35', cpl: '$25.03', spend: '$876', symbol: '↗', tone: '' }
    ]
  },
  'Sculptor clinic': {
    leads: '642', cpl: '$7.16', spend: '$4,594', daily: '92', campaigns: [
      { name: 'Consulta inicial · Tratamientos', conversion: 'Formulario instantáneo', impressions: '390,210', leads: '421', cpl: '$6.84', spend: '$2,879', symbol: '✦', tone: '' },
      { name: 'Valoración gratuita', conversion: 'Formulario instantáneo', impressions: '208,430', leads: '176', cpl: '$7.92', spend: '$1,394', symbol: '◈', tone: 'coral' },
      { name: 'Guía de cuidados', conversion: 'Formulario instantáneo', impressions: '86,105', leads: '45', cpl: '$7.13', spend: '$321', symbol: '↗', tone: 'yellow' }
    ]
  },
};

const rows = document.querySelector('#campaignRows');
const search = document.querySelector('#campaignSearch');
const toast = document.querySelector('#toast');
let activeAccount = 'Iam light';
let dataSource = 'demo';

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));
const formatMoney = (value) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const demoDaily = [
  { date: '2024-09-02', leads: 38, spend: 42 }, { date: '2024-09-03', leads: 44, spend: 47 },
  { date: '2024-09-04', leads: 31, spend: 39 }, { date: '2024-09-05', leads: 52, spend: 55 },
  { date: '2024-09-06', leads: 46, spend: 51 }, { date: '2024-09-07', leads: 61, spend: 59 },
  { date: '2024-09-08', leads: 58, spend: 64 }
];

function currentCampaigns() {
  return accountData[activeAccount].campaigns;
}

function renderChart(daily = demoDaily) {
  const leadsLine = document.querySelector('#leadsLine');
  const spendLine = document.querySelector('#spendLine');
  const areaFill = document.querySelector('#chartAreaFill');
  const points = document.querySelector('#chartPoints');
  const labels = document.querySelector('#chartLabels');
  if (!leadsLine || !spendLine || !areaFill || !points || !labels || !daily.length) return;

  const chartWidth = 800;
  const chartHeight = 225;
  const maxLeads = Math.max(...daily.map((item) => Number(item.leads || 0)), 1);
  const maxSpend = Math.max(...daily.map((item) => Number(item.spend || 0)), 1);
  const toPoint = (item, index, max) => {
    const x = daily.length === 1 ? chartWidth / 2 : (index / (daily.length - 1)) * chartWidth;
    const y = chartHeight - (Number(item) / max) * (chartHeight - 18);
    return [x, y];
  };
  const makePath = (key, max) => daily.map((item, index) => {
    const [x, y] = toPoint(item[key], index, max);
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const leadsPath = makePath('leads', maxLeads);
  leadsLine.setAttribute('d', leadsPath);
  spendLine.setAttribute('d', makePath('spend', maxSpend));
  const lastPoint = toPoint(daily[daily.length - 1].leads, daily.length - 1, maxLeads);
  areaFill.setAttribute('d', `${leadsPath} L${lastPoint[0].toFixed(1)},${chartHeight} L0,${chartHeight} Z`);
  points.innerHTML = daily.map((item, index) => {
    const [x, y] = toPoint(item.leads, index, maxLeads);
    const cpl = item.leads ? Number(item.spend || 0) / Number(item.leads) : 0;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" class="chart-point" data-date="${item.date}" data-spend="${item.spend || 0}" data-leads="${item.leads || 0}" data-cpl="${cpl}" />`;
  }).join('');
  labels.innerHTML = daily.map((item) => `<span>${new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(new Date(`${item.date}T12:00:00`)).toUpperCase()}</span>`).join('');
  const tooltip = document.querySelector('#chartTooltip');
  const dateFormat = (date) => new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
  points.querySelectorAll('.chart-point').forEach((point) => {
    point.addEventListener('mouseenter', () => {
      tooltip.innerHTML = `<strong>${dateFormat(point.dataset.date)}</strong><span><b>Inversión</b> ${formatMoney(point.dataset.spend)}</span><span><b>Leads</b> ${formatNumber(point.dataset.leads)}</span><span><b>CPL</b> ${formatMoney(point.dataset.cpl)}</span>`;
      tooltip.style.left = `${(Number(point.getAttribute('cx')) / chartWidth) * 100}%`;
      tooltip.style.top = `${Number(point.getAttribute('cy')) - 20}px`;
      tooltip.classList.add('visible');
    });
    point.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
  });
}

function applyAccountData(data) {
  accountData[activeAccount] = {
    ...accountData[activeAccount],
    leads: formatNumber(data.totals.leads),
    cpl: formatMoney(data.totals.cpl),
    spend: formatMoney(data.totals.spend),
    daily: formatNumber(Math.round(Number(data.totals.leads || 0) / Math.max(getSelectedDays(), 1))),
    campaigns: data.campaigns.map((campaign) => ({
      ...campaign,
      impressions: formatNumber(campaign.impressions),
      leads: formatNumber(campaign.leads),
      resultLabel: campaign.resultLabel || 'Leads',
      costLabel: campaign.costLabel || 'CPL',
      cpl: formatMoney(campaign.cpl),
      spend: formatMoney(campaign.spend)
    }))
  };
  renderChart(data.daily);
  const current = accountData[activeAccount];
  document.querySelector('#totalLeads').textContent = current.leads;
  document.querySelector('#summaryLeads').textContent = current.leads;
  document.querySelector('#dailyLeads').textContent = current.daily;
  document.querySelector('.metric-card:nth-child(2) .metric-value').textContent = current.cpl;
  document.querySelector('.metric-card:nth-child(3) .metric-value').textContent = current.spend;
  renderCampaigns();
}

function getSelectedDays() {
  const range = document.querySelector('#dateRange').value;
  if (range !== 'custom') return range === 'today' ? 1 : Number(range);
  const start = new Date(`${document.querySelector('#dateStart').value}T12:00:00`);
  const end = new Date(`${document.querySelector('#dateEnd').value}T12:00:00`);
  return Math.round((end - start) / 86400000) + 1;
}

async function loadMetaInsights() {
  const params = new URLSearchParams({ account: activeAccount });
  const range = document.querySelector('#dateRange').value;
  if (range === 'custom') {
    params.set('date_start', document.querySelector('#dateStart').value);
    params.set('date_end', document.querySelector('#dateEnd').value);
  } else {
    params.set('days', range === 'today' ? '1' : range);
  }

  try {
    const response = await fetch(`/api/meta-insights?${params}`);
    if (!response.ok) throw new Error('Meta no está configurado todavía');
    const data = await response.json();
    if (data.demo || data.source !== 'meta') throw new Error('Modo demo');
    applyAccountData(data);
    dataSource = 'meta';
    document.querySelector('#connectionLabel').textContent = 'Meta Ads · datos en vivo';
  } catch {
    dataSource = 'demo';
    document.querySelector('#connectionLabel').textContent = 'Meta Ads · modo demo';
  }
}

function renderCampaigns() {
  const searchTerm = search.value.trim().toLowerCase();
  const visibleCampaigns = currentCampaigns().filter((campaign) => {
    return `${campaign.name} ${campaign.conversion}`.toLowerCase().includes(searchTerm);
  });

  rows.innerHTML = visibleCampaigns.length
    ? visibleCampaigns.map((campaign) => `
      <tr>
        <td><div class="campaign-name"><span class="campaign-symbol ${campaign.tone}">${campaign.symbol}</span>${campaign.name}</div></td>
        <td><span class="conversion-tag">${campaign.conversion}</span></td>
        <td class="number">${campaign.impressions}</td>
        <td class="number">${campaign.leads} <small class="result-label">${campaign.resultLabel || 'Leads'}</small></td>
        <td class="number">${campaign.cpl} <small class="result-label">${campaign.costLabel || 'CPL'}</small></td>
        <td class="number">${campaign.spend}</td>
        <td><span class="status">Activa</span></td>
        <td><button class="row-menu" aria-label="Opciones para ${campaign.name}">•••</button></td>
      </tr>`).join('')
    : '<tr><td colspan="8" class="empty-state">No encontramos campañas con esos filtros.</td></tr>';
}

search.addEventListener('input', renderCampaigns);

document.querySelector('#dateRange').addEventListener('change', (event) => {
  const rangeLabels = { '7': '7 días', '14': '14 días', '30': '30 días', today: 'hoy', custom: 'periodo personalizado' };
  document.querySelector('.date-note').textContent = `Datos atribuidos según ventana de Ads Manager · ${rangeLabels[event.target.value]}`;
  document.querySelector('#customDates').hidden = event.target.value !== 'custom';
  showToast(`Rango actualizado: ${rangeLabels[event.target.value]}`);
  if (event.target.value !== 'custom') loadMetaInsights();
});

document.querySelector('#applyDates').addEventListener('click', () => {
  const start = document.querySelector('#dateStart').value;
  const end = document.querySelector('#dateEnd').value;
  if (!start || !end || start > end) {
    showToast('Revisa las fechas seleccionadas');
    return;
  }
  const format = (date) => new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(new Date(`${date}T12:00:00`)).toUpperCase();
  document.querySelector('.date-note').textContent = `Datos atribuidos según ventana de Ads Manager · ${format(start)} – ${format(end)}`;
  document.querySelector('#dateHeading').textContent = `${format(start)} – ${format(end)}`;
  showToast('Periodo personalizado aplicado');
  loadMetaInsights();
});

document.querySelectorAll('.account-option').forEach((option) => {
  option.addEventListener('click', () => {
    activeAccount = option.dataset.account;
    const data = accountData[activeAccount];
    document.querySelector('#totalLeads').textContent = data.leads;
    document.querySelector('#summaryLeads').textContent = data.leads;
    document.querySelector('#dailyLeads').textContent = data.daily;
    document.querySelector('.metric-card:nth-child(2) .metric-value').textContent = data.cpl;
    document.querySelector('.metric-card:nth-child(3) .metric-value').textContent = data.spend;
    document.querySelectorAll('.account-option').forEach((item) => item.classList.toggle('active', item === option));
    renderCampaigns();
    showToast(`Cuenta activa: ${activeAccount}`);
    loadMetaInsights();
  });
});

document.querySelector('#exportButton').addEventListener('click', () => {
  const headers = ['Cuenta', 'Campaña', 'Tipo de conversión', 'Impresiones', 'Leads', 'CPL', 'Inversión'];
  const csv = [headers, ...currentCampaigns().map((campaign) => [activeAccount, campaign.name, campaign.conversion, campaign.impressions, campaign.leads, campaign.cpl, campaign.spend])]
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  link.download = 'tracklaura-campanas.csv';
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Exportación descargada');
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove('show'), 2400);
}

renderCampaigns();
renderChart();
loadMetaInsights();
