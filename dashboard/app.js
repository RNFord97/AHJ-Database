/**
 * app.js — CA AHJ Building Department Staffing Dashboard (2024)
 *
 * Architecture:
 *   CONFIG  – static chart/visual settings
 *   state   – mutable filter state (county, types, minStaff)
 *   Data pipeline: loadData → parseRow → applyFilters → render*
 *   Two linked charts: renderBarChart + renderScatter
 *   Both re-render on any filter change via applyFilters()
 */

// ── CONFIG ────────────────────────────────────────────────────────────────────

const CONFIG = {
  // Path relative to index.html; works on GitHub Pages static hosting
  dataPath: '../data/processed/AHJ_BD_Staffing_2024.csv',

  // Brand colors per AHJ type
  typeColors: {
    CITY:   '#f97316',  // orange-500
    COUNTY: '#06b6d4',  // cyan-500
    TOWNS:  '#8b5cf6',  // violet-500
  },

  bar: {
    maxBars:   20,
    rowHeight: 30,
    rowGap:    5,
    margin: { top: 8, right: 64, bottom: 36, left: 200 },
  },

  scatter: {
    margin: { top: 16, right: 24, bottom: 52, left: 64 },
    minR: 3,
    maxR: 22,
  },
};

// ── STATE ─────────────────────────────────────────────────────────────────────

const state = {
  allData: [],
  filtered: [],
  county:   '',
  types:    new Set(['CITY', 'COUNTY', 'TOWNS']),
  minStaff: 0,
};

// ── TOOLTIP ───────────────────────────────────────────────────────────────────

const tooltip = d3.select('#tooltip');

function showTooltip(html, event) {
  tooltip.classed('hidden', false).html(html);
  positionTooltip(event);
}

function positionTooltip(event) {
  const pad = 16;
  const tt  = tooltip.node().getBoundingClientRect();
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;

  let x = event.clientX + pad;
  let y = event.clientY - pad;

  // Flip left if near right edge
  if (x + tt.width + pad > vpW) x = event.clientX - tt.width - pad;
  // Flip up if near bottom edge
  if (y + tt.height + pad > vpH) y = event.clientY - tt.height - pad;

  tooltip.style('left', x + 'px').style('top', y + 'px');
}

function hideTooltip() {
  tooltip.classed('hidden', true);
}

// ── FORMATTERS ────────────────────────────────────────────────────────────────

const fmtInt   = d3.format(',');
const fmtMoney = v => {
  if (!v) return 'N/A';
  if (v >= 1e6) return '$' + d3.format('.1f')(v / 1e6) + 'M';
  return '$' + d3.format(',.0f')(v);
};
const fmtPop = v => {
  if (!v) return 'N/A';
  if (v >= 1e6) return d3.format('.2f')(v / 1e6) + 'M';
  if (v >= 1e3) return d3.format('.1f')(v / 1e3) + 'K';
  return fmtInt(v);
};

// ── TOOLTIP HTML ──────────────────────────────────────────────────────────────

function buildTooltip(d) {
  const wagesStr = d.wages      ? fmtMoney(d.wages)  : 'N/A';
  const popStr   = d.population ? fmtPop(d.population) : 'N/A';
  const typeColor = CONFIG.typeColors[d.type] || '#64748b';

  return `
    <div class="tooltip-name">${d.name}</div>
    <div class="tooltip-meta">
      ${d.county ? d.county + ' County · ' : ''}
      <span style="color:${typeColor};font-weight:600">${d.type}</span>
    </div>
    <div class="tooltip-row">
      <span class="tooltip-label">BD Staff</span>
      <span class="tooltip-value">${fmtInt(d.staffCount)}</span>
    </div>
    <div class="tooltip-row">
      <span class="tooltip-label">Total Wages</span>
      <span class="tooltip-value">${wagesStr}</span>
    </div>
    <div class="tooltip-row">
      <span class="tooltip-label">Population</span>
      <span class="tooltip-value">${popStr}</span>
    </div>
    ${d.department ? `<div style="color:#475569;font-size:10px;margin-top:6px">${d.department}</div>` : ''}
  `;
}

// ── FILTER & UPDATE ───────────────────────────────────────────────────────────

function applyFilters() {
  state.filtered = state.allData.filter(d =>
    d.staffCount > 0 &&
    d.staffCount >= state.minStaff &&
    (state.county === '' || d.county === state.county) &&
    state.types.has(d.type)
  );

  updateKPIs();
  renderBarChart();
  renderScatter();
}

// ── KPI CARDS ─────────────────────────────────────────────────────────────────

function updateKPIs() {
  const { filtered } = state;
  const totalStaff = d3.sum(filtered, d => d.staffCount);
  const totalWages = d3.sum(filtered, d => d.wages);
  const avg = filtered.length ? totalStaff / filtered.length : 0;

  d3.select('#kpi-count').text(fmtInt(filtered.length));
  d3.select('#kpi-staff').text(fmtInt(totalStaff));
  d3.select('#kpi-avg').text(avg.toFixed(1));
  d3.select('#kpi-wages').text(fmtMoney(totalWages));
  d3.select('#header-badge').text(`${fmtInt(filtered.length)} AHJs shown`);
}

// ── BAR CHART ─────────────────────────────────────────────────────────────────

function renderBarChart() {
  const host = document.getElementById('bar-chart');
  const containerW = host.clientWidth || 600;
  const { bar } = CONFIG;

  // Top 20 by staff count
  const top = [...state.filtered]
    .sort((a, b) => b.staffCount - a.staffCount)
    .slice(0, bar.maxBars);

  // Update badge
  d3.select('#bar-count-badge')
    .text(`showing top ${top.length} of ${fmtInt(state.filtered.length)}`);

  // Clear previous render
  d3.select('#bar-chart').selectAll('*').remove();

  if (top.length === 0) {
    d3.select('#bar-chart')
      .append('div').attr('class', 'empty-state')
      .text('No jurisdictions match the current filters.');
    return;
  }

  const { margin: m } = bar;
  const innerW  = containerW - m.left - m.right;
  const rowH    = bar.rowHeight + bar.rowGap;
  const chartH  = top.length * rowH;
  const totalH  = chartH + m.top + m.bottom;

  const svg = d3.select('#bar-chart')
    .append('svg')
    .attr('width', containerW)
    .attr('height', totalH)
    .attr('role', 'img')
    .attr('aria-label', 'Horizontal bar chart of top 20 AHJs by staff count');

  const g = svg.append('g')
    .attr('transform', `translate(${m.left},${m.top})`);

  // Scales
  const xMax = d3.max(top, d => d.staffCount);
  const xScale = d3.scaleLinear().domain([0, xMax]).range([0, innerW]).nice();
  const yScale = d3.scaleBand()
    .domain(top.map(d => d.name))
    .range([0, chartH])
    .padding(0.2);

  // Grid lines (vertical)
  g.append('g')
    .attr('class', 'grid')
    .call(
      d3.axisBottom(xScale)
        .ticks(5)
        .tickSize(chartH)
        .tickFormat('')
    )
    .call(el => el.select('.domain').remove())
    .call(el => el.selectAll('.tick line')
      .attr('class', 'grid-line')
      .attr('y1', 0)
    );

  // Bars
  g.selectAll('.bar-rect')
    .data(top)
    .join('rect')
    .attr('class', 'bar-rect')
    .attr('x', 0)
    .attr('y', d => yScale(d.name))
    .attr('height', yScale.bandwidth())
    .attr('width', d => xScale(d.staffCount))
    .attr('fill', d => CONFIG.typeColors[d.type] || '#64748b')
    .attr('rx', 4)
    .attr('ry', 4)
    .on('mousemove', (event, d) => showTooltip(buildTooltip(d), event))
    .on('mouseleave', hideTooltip);

  // Bar value labels
  g.selectAll('.bar-label')
    .data(top)
    .join('text')
    .attr('class', 'bar-label')
    .attr('x', d => xScale(d.staffCount) + 5)
    .attr('y', d => yScale(d.name) + yScale.bandwidth() / 2 + 4)
    .attr('fill', '#64748b')
    .attr('font-size', 10)
    .attr('font-family', 'Inter, ui-sans-serif, system-ui, sans-serif')
    .text(d => fmtInt(d.staffCount));

  // Y axis (names)
  g.append('g')
    .call(d3.axisLeft(yScale).tickSize(0))
    .call(el => el.select('.domain').remove())
    .selectAll('text')
    .attr('fill', '#94a3b8')
    .attr('font-size', 11)
    .attr('font-family', 'Inter, ui-sans-serif, system-ui, sans-serif')
    .attr('dx', -6);

  // X axis
  g.append('g')
    .attr('transform', `translate(0,${chartH})`)
    .call(d3.axisBottom(xScale).ticks(5).tickFormat(fmtInt))
    .call(el => el.select('.domain').attr('stroke', '#1e293b'));

  // X axis label
  svg.append('text')
    .attr('class', 'axis-label')
    .attr('x', m.left + innerW / 2)
    .attr('y', totalH - 4)
    .attr('text-anchor', 'middle')
    .text('Number of Building Department Staff');
}

// ── SCATTER CHART ─────────────────────────────────────────────────────────────

function renderScatter() {
  const host = document.getElementById('scatter-chart');
  const containerW = host.clientWidth || 600;
  const { scatter: s } = CONFIG;
  const m = s.margin;

  // Require population > 0 for log scale
  const data = state.filtered.filter(d => d.population > 0);

  d3.select('#scatter-chart').selectAll('*').remove();

  if (data.length === 0) {
    d3.select('#scatter-chart')
      .append('div').attr('class', 'empty-state')
      .text('No jurisdictions with population data match the current filters.');
    return;
  }

  const height  = Math.min(480, Math.max(300, Math.round(containerW * 0.46)));
  const innerW  = containerW - m.left - m.right;
  const innerH  = height - m.top - m.bottom;

  const svg = d3.select('#scatter-chart')
    .append('svg')
    .attr('width', containerW)
    .attr('height', height)
    .attr('role', 'img')
    .attr('aria-label', 'Scatter plot of staff count vs employer population');

  const g = svg.append('g')
    .attr('transform', `translate(${m.left},${m.top})`);

  // Scales
  const xScale = d3.scaleLog()
    .domain(d3.extent(data, d => d.population))
    .range([0, innerW])
    .nice();

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.staffCount)])
    .range([innerH, 0])
    .nice();

  const rScale = d3.scaleSqrt()
    .domain([0, d3.max(data, d => d.wages) || 1])
    .range([s.minR, s.maxR]);

  // Horizontal grid lines
  g.append('g')
    .attr('class', 'grid')
    .call(
      d3.axisLeft(yScale)
        .ticks(5)
        .tickSize(-innerW)
        .tickFormat('')
    )
    .call(el => el.select('.domain').remove())
    .call(el => el.selectAll('.tick line').attr('class', 'grid-line'));

  // Trend reference line: simple linear regression (staff ~ log(pop))
  const logPop = data.map(d => Math.log(d.population));
  const meanX  = d3.mean(logPop);
  const meanY  = d3.mean(data, d => d.staffCount);
  const num    = d3.sum(data, (d, i) => (logPop[i] - meanX) * (d.staffCount - meanY));
  const den    = d3.sum(logPop, x => (x - meanX) ** 2);
  const slope  = den > 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;

  const xExtent = d3.extent(data, d => d.population);
  const lineData = [
    { x: xExtent[0], y: slope * Math.log(xExtent[0]) + intercept },
    { x: xExtent[1], y: slope * Math.log(xExtent[1]) + intercept },
  ];

  const lineGen = d3.line()
    .x(d => xScale(d.x))
    .y(d => yScale(Math.max(0, d.y)));

  g.append('path')
    .datum(lineData)
    .attr('d', lineGen)
    .attr('fill', 'none')
    .attr('stroke', '#334155')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '5 4');

  g.append('text')
    .attr('class', 'ref-label')
    .attr('x', xScale(xExtent[1]) - 4)
    .attr('y', yScale(Math.max(0, lineData[1].y)) - 6)
    .attr('text-anchor', 'end')
    .text('trend');

  // Dots
  g.selectAll('.scatter-dot')
    .data(data)
    .join('circle')
    .attr('class', 'scatter-dot')
    .attr('cx', d => xScale(d.population))
    .attr('cy', d => yScale(d.staffCount))
    .attr('r', d => rScale(d.wages || 0))
    .attr('fill', d => CONFIG.typeColors[d.type] || '#64748b')
    .attr('opacity', 0.72)
    .attr('stroke', '#020617')
    .attr('stroke-width', 0.8)
    .on('mousemove', (event, d) => {
      d3.select(event.currentTarget)
        .raise()
        .attr('opacity', 1)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);
      showTooltip(buildTooltip(d), event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget)
        .attr('opacity', 0.72)
        .attr('stroke', '#020617')
        .attr('stroke-width', 0.8);
      hideTooltip();
    });

  // X axis (log scale — pick sensible tick values)
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(
      d3.axisBottom(xScale)
        .ticks(6)
        .tickFormat(v => fmtPop(v))
    );
  xAxis.select('.domain').attr('stroke', '#1e293b');

  // Y axis
  const yAxis = g.append('g')
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(fmtInt));
  yAxis.select('.domain').attr('stroke', '#1e293b');

  // Axis labels
  svg.append('text')
    .attr('class', 'axis-label')
    .attr('x', m.left + innerW / 2)
    .attr('y', height - 8)
    .attr('text-anchor', 'middle')
    .text('Employer Population (log scale)');

  svg.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -(m.top + innerH / 2))
    .attr('y', 14)
    .attr('text-anchor', 'middle')
    .text('BD Staff Count');

  // Legend (bottom-right of chart area)
  const legendTypes = ['CITY', 'COUNTY', 'TOWNS'];
  const legendX = m.left + innerW - 90;
  const legendY = m.top + 8;

  const legend = svg.append('g').attr('transform', `translate(${legendX},${legendY})`);

  legendTypes.forEach((type, i) => {
    const row = legend.append('g').attr('transform', `translate(0,${i * 18})`);
    row.append('circle')
      .attr('cx', 6).attr('cy', 6).attr('r', 5)
      .attr('fill', CONFIG.typeColors[type])
      .attr('opacity', 0.8);
    row.append('text')
      .attr('x', 16).attr('y', 10)
      .attr('fill', '#94a3b8')
      .attr('font-size', 11)
      .attr('font-family', 'Inter, ui-sans-serif, system-ui, sans-serif')
      .text(type);
  });

  // Bubble size legend
  const sLegendY = legendY + legendTypes.length * 18 + 12;
  svg.append('text')
    .attr('class', 'ref-label')
    .attr('x', legendX)
    .attr('y', sLegendY)
    .text('● size = wages');
}

// ── CONTROLS ──────────────────────────────────────────────────────────────────

function setupControls(data) {
  // ── County dropdown ──────────────────────────────────
  const counties = [...new Set(data.map(d => d.county).filter(Boolean))].sort();
  const select   = document.getElementById('county-select');

  counties.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });

  select.addEventListener('change', e => {
    state.county = e.target.value;
    applyFilters();
  });

  // ── AHJ Type toggles ────────────────────────────────
  const typeContainer = document.getElementById('type-filters');

  ['CITY', 'COUNTY', 'TOWNS'].forEach(type => {
    const btn = document.createElement('button');
    btn.className = 'type-btn active';
    btn.dataset.type = type;
    btn.textContent = type;
    btn.addEventListener('click', () => {
      // Keep at least one type active
      if (state.types.has(type) && state.types.size === 1) return;

      if (state.types.has(type)) {
        state.types.delete(type);
        btn.classList.remove('active');
      } else {
        state.types.add(type);
        btn.classList.add('active');
      }
      applyFilters();
    });
    typeContainer.appendChild(btn);
  });

  // ── Min staff slider ─────────────────────────────────
  const slider   = document.getElementById('staff-slider');
  const sliderLbl = document.getElementById('slider-val');

  slider.addEventListener('input', e => {
    state.minStaff = +e.target.value;
    sliderLbl.textContent = e.target.value;
    applyFilters();
  });

  // ── Reset button ─────────────────────────────────────
  document.getElementById('reset-btn').addEventListener('click', () => {
    state.county   = '';
    state.minStaff = 0;
    state.types    = new Set(['CITY', 'COUNTY', 'TOWNS']);

    select.value = '';
    slider.value = 0;
    sliderLbl.textContent = '0';

    document.querySelectorAll('.type-btn').forEach(b => b.classList.add('active'));

    applyFilters();
  });
}

// ── RESPONSIVE RESIZE ─────────────────────────────────────────────────────────

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (state.filtered.length > 0) {
      renderBarChart();
      renderScatter();
    }
  }, 180);
});

// ── DATA LOADING ──────────────────────────────────────────────────────────────

function parseRow(d) {
  return {
    id:         d.ID?.trim()                   || '',
    name:       d.BUILDING_DEPARTMENT?.trim()  || 'Unknown',
    type:       d.TYPE?.trim()                 || 'CITY',
    department: d.DEPARTMENT_NAME?.trim()      || '',
    county:     d.EmployerCounty?.trim()       || '',
    staffCount: +d.BD_STAFF_COUNT              || 0,
    wages:      +d.BD_STAFF_TOTAL_WAGES        || 0,
    population: +d.EmployerPopulation          || 0,
    match:      d.MATCH_GCC?.trim()            || '',
  };
}

async function loadData() {
  const raw = await d3.csv(CONFIG.dataPath);
  return raw.map(parseRow);
}

// ── UI STATE HELPERS ──────────────────────────────────────────────────────────

function showCharts() {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('charts-container').style.display = 'flex';
}

function showError(message) {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('error-state').classList.remove('hidden');
  document.getElementById('error-message').textContent = message;
}

// ── INIT ──────────────────────────────────────────────────────────────────────

async function init() {
  try {
    state.allData = await loadData();
    setupControls(state.allData);
    showCharts();
    applyFilters();
  } catch (err) {
    showError(err.message || String(err));
  }
}

init();
