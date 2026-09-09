/* ── CONFIG ───────────────────────────────────────────────────────────────── */
const API_BASE = "https://weather-forecast-detector.onrender.com";

/* ── STATE ───────────────────────────────────────────────────────────────── */
let state = {
  unit: 'C',       // 'C' or 'F'
  data: null,
  selectedDay: 0,
  searchTimer: null,
};

/* ── DOM REFS ─────────────────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const searchInput   = $('searchInput');
const suggestionsEl = $('suggestions');
const loading       = $('loading');
const errorMsg      = $('errorMsg');
const btnC          = $('btnC');
const btnF          = $('btnF');
const locBtn        = $('locBtn');

/* ── UTILITIES ────────────────────────────────────────────────────────────── */
const toF  = c => Math.round(c * 9/5 + 32);
const disp = c => state.unit === 'C' ? `${c}°C` : `${toF(c)}°F`;

function windDir(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function fmtTime(unix, offsetSec = 0) {
  const d = new Date((unix + offsetSec) * 1000);
  return d.toUTCString().slice(17, 22);
}

function fmtDate(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function fmtDayName(iso, idx) {
  if (idx === 0) return 'Today';
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
}

function iconUrl(code) {
  return `https://openweathermap.org/img/wn/${code}@2x.png`;
}

function aqiColor(aqi) {
  return ['', '#34d399', '#a3e635', '#fbbf24', '#f87171', '#c084fc'][aqi] || '#34d399';
}

function setVisibility(sections, show) {
  sections.forEach(id => $( id )?.classList.toggle('hidden', !show));
}

/* ── LOADING / ERROR ─────────────────────────────────────────────────────── */
function showLoading(on) {
  loading.classList.toggle('hidden', !on);
  setVisibility(['heroCard','statsRow','forecastCard','aqiCard','mapCard'], !on);
  if (on) setVisibility(['hourlyCard'], false);
}

function showError(msg) {
  errorMsg.textContent = '⚠ ' + msg;
  errorMsg.classList.remove('hidden');
  setTimeout(() => errorMsg.classList.add('hidden'), 6000);
}

/* ── FETCH WEATHER ────────────────────────────────────────────────────────── */
async function fetchWeather(query) {
  showLoading(true);
  errorMsg.classList.add('hidden');
  try {
    const res = await fetch(`${API_BASE}/weather?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Unknown error');
    }
    state.data = await res.json();
    renderAll();
  } catch (e) {
    showError(e.message);
    showLoading(false);
  }
}

/* ── RENDER ALL ──────────────────────────────────────────────────────────── */
function renderAll() {
  showLoading(false);
  if (!state.data) return;
  renderHero();
  renderStats();
  renderForecast();
  renderAQI();
  renderMap();
  setVisibility(['heroCard','statsRow','forecastCard','aqiCard','mapCard'], true);
}

/* ── HERO ────────────────────────────────────────────────────────────────── */
/* ── HERO ────────────────────────────────────────────────────────────────── */
function renderHero() {
  const { location: loc, current: c } = state.data;

  $('heroCity').textContent = loc.name;
  $('heroCountry').textContent = loc.country;

  $('heroTemp').textContent = disp(c.temp);
  $('heroDesc').textContent = c.description;

  $('heroHigh').textContent = disp(c.temp_max ?? c.temp);
  $('heroLow').textContent = disp(c.temp_min ?? c.temp);

  $('heroFeels').textContent = disp(c.feels_like);

  $('heroIcon').src = iconUrl(c.icon);
  $('heroIcon').alt = c.description;

  $('sunrise').textContent = fmtTime(c.sunrise);
  $('sunset').textContent = fmtTime(c.sunset);

  $('lastUpdated').textContent =
    c.dt
      ? `Updated: ${new Date(c.dt * 1000).toLocaleTimeString()}`
      : 'Updated: --';
}


/* ── STATS ───────────────────────────────────────────────────────────────── */
function renderStats() {
  const c = state.data.current;
  $('stHumidity').textContent = `${c.humidity}%`;
  $('stHumidityBar').style.width = `${c.humidity}%`;
  $('stWind').textContent = `${c.wind_speed} m/s`;
  $('stWindDir').textContent = `Direction: ${windDir(c.wind_deg)} ${c.wind_deg}°${c.wind_gust ? ` · Gust ${c.wind_gust} m/s` : ''}`;
  $('stPressure').textContent = `${c.pressure} hPa`;
  $('stVis').textContent = `${c.visibility} km`;
  $('stClouds').textContent = `${c.clouds}%`;
  const aqiEl = $('stAqi');
  aqiEl.textContent = c.aqi;
  aqiEl.style.color = aqiColor(c.aqi);
  const lbl = $('stAqiLabel');
  lbl.textContent = c.aqi_label;
  lbl.style.color = aqiColor(c.aqi);
}

/* ── 7-DAY FORECAST ──────────────────────────────────────────────────────── */
function renderForecast() {
  const grid = $('forecastGrid');
  grid.innerHTML = '';
  state.data.forecast.forEach((day, idx) => {
    const el = document.createElement('div');
    el.className = 'day-card' + (idx === state.selectedDay ? ' selected' : '');
    el.innerHTML = `
      <div class="day-name">${fmtDayName(day.date, idx)}</div>
      <img class="day-icon" src="${iconUrl(day.icon)}" alt="${day.description}"/>
      <div class="day-high">${disp(day.temp_max)}</div>
      <div class="day-low">${disp(day.temp_min)}</div>
      <div class="day-rain">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14v-4H7l5-8v4h4l-5 8z"/></svg>
        ${day.max_rain_prob}%
      </div>`;
    el.addEventListener('click', () => {
      state.selectedDay = idx;
      document.querySelectorAll('.day-card').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
      renderHourly(idx);
    });
    grid.appendChild(el);
  });
}

/* ── HOURLY DETAIL ───────────────────────────────────────────────────────── */
function renderHourly(dayIdx) {
  const day = state.data.forecast[dayIdx];
  const card = $('hourlyCard');
  card.classList.remove('hidden');
  $('hourlyDate').textContent = `Hourly · ${fmtDate(day.date)}`;

  // Hour cards
  const scroll = $('hourlyScroll');
  scroll.innerHTML = '';
  day.hourly.forEach(h => {
    const timeStr = new Date(h.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const el = document.createElement('div');
    el.className = 'hour-card';
    el.innerHTML = `
      <div class="hour-time">${timeStr}</div>
      <img class="hour-icon" src="${iconUrl(h.icon)}" alt="${h.description}"/>
      <div class="hour-temp">${disp(h.temp)}</div>
      <div class="hour-rain">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14v-4H7l5-8v4h4l-5 8z"/></svg>
        ${h.rain_prob}%
      </div>
      <div class="hour-hum">💧 ${h.humidity}%</div>`;
    scroll.appendChild(el);
  });

  // Rain probability chart
  drawRainChart(day.hourly);
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── RAIN CHART ──────────────────────────────────────────────────────────── */
function drawRainChart(hourly) {
  const canvas = $('rainCanvas');
  canvas.width = canvas.offsetWidth || 800;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const probs = hourly.map(h => h.rain_prob);
  const labels = hourly.map(h =>
    new Date(h.time).toLocaleTimeString('en-US', { hour: '2-digit', hour12: true }));

  ctx.clearRect(0, 0, W, H);

  const padL = 30, padR = 10, padT = 10, padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const n = probs.length;
  const step = chartW / (n - 1 || 1);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,.05)';
  ctx.lineWidth = 1;
  [0, 25, 50, 75, 100].forEach(v => {
    const y = padT + chartH - (v / 100) * chartH;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillStyle = 'rgba(122,139,168,.5)';
    ctx.font = '9px Space Grotesk, sans-serif';
    ctx.fillText(v + '%', 0, y + 3);
  });

  if (n < 2) return;

  // Build path
  const pts = probs.map((p, i) => ({
    x: padL + i * step,
    y: padT + chartH - (p / 100) * chartH
  }));

  // Fill gradient
  const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
  grad.addColorStop(0, 'rgba(96,165,250,.5)');
  grad.addColorStop(1, 'rgba(96,165,250,.02)');

  ctx.beginPath();
  ctx.moveTo(pts[0].x, padT + chartH);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[n-1].x, padT + chartH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < n; i++) {
    const cx = (pts[i-1].x + pts[i].x) / 2;
    ctx.bezierCurveTo(cx, pts[i-1].y, cx, pts[i].y, pts[i].x, pts[i].y);
  }
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dots & labels
  pts.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#60a5fa';
    ctx.fill();
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(122,139,168,.7)';
      ctx.font = '9px Space Grotesk, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], p.x, H - 6);
    }
  });
}

/* ── AQI ─────────────────────────────────────────────────────────────────── */
function renderAQI() {
  const comps = state.data.current.components;
  const grid = $('aqiGrid');
  const items = [
    { key: 'pm2_5',  label: 'PM 2.5',  unit: 'μg/m³' },
    { key: 'pm10',   label: 'PM 10',   unit: 'μg/m³' },
    { key: 'o3',     label: 'Ozone',   unit: 'μg/m³' },
    { key: 'no2',    label: 'NO₂',     unit: 'μg/m³' },
    { key: 'co',     label: 'CO',      unit: 'μg/m³' },
    { key: 'so2',    label: 'SO₂',     unit: 'μg/m³' },
  ];
  grid.innerHTML = items.map(item => `
    <div class="aqi-item">
      <div class="aqi-item-label">${item.label}</div>
      <div class="aqi-item-val">${comps[item.key] != null ? Math.round(comps[item.key]) : '–'}</div>
      <div class="aqi-item-unit">${item.unit}</div>
    </div>`).join('');
}

/* ── MAP ─────────────────────────────────────────────────────────────────── */
function renderMap() {
  const { lat, lon, name } = state.data.location;
  $('mapFrame').innerHTML = `
    <iframe
      src="https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.1},${lat-0.1},${lon+0.1},${lat+0.1}&layer=mapnik&marker=${lat},${lon}"
      style="width:100%;height:260px;border-radius:10px;border:none;"
      title="${name} map"
      loading="lazy">
    </iframe>`;
}

/* ── UNIT TOGGLE ─────────────────────────────────────────────────────────── */
function setUnit(u) {
  state.unit = u;
  btnC.classList.toggle('active', u === 'C');
  btnF.classList.toggle('active', u === 'F');
  if (state.data) {
    renderHero();
    renderForecast();
    const hCard = $('hourlyCard');
    if (!hCard.classList.contains('hidden')) renderHourly(state.selectedDay);
  }
}
btnC.addEventListener('click', () => setUnit('C'));
btnF.addEventListener('click', () => setUnit('F'));

/* ── SEARCH / AUTOCOMPLETE ───────────────────────────────────────────────── */
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const q = searchInput.value.trim();
    if (q) { suggestionsEl.classList.add('hidden'); fetchWeather(q); }
  }
});

searchInput.addEventListener('input', () => {
  clearTimeout(state.searchTimer);
  const q = searchInput.value.trim();
  if (q.length < 2) { suggestionsEl.classList.add('hidden'); return; }
  state.searchTimer = setTimeout(async () => {
    try {
      const res = await fetch(`${API_BASE}/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!data.length) { suggestionsEl.classList.add('hidden'); return; }
      suggestionsEl.innerHTML = data.map(c =>
        `<div class="sug-item" data-name="${c.name}, ${c.country}">
           ${c.name}${c.state ? ', ' + c.state : ''}, ${c.country}
         </div>`).join('');
      suggestionsEl.classList.remove('hidden');
      suggestionsEl.querySelectorAll('.sug-item').forEach(el => {
        el.addEventListener('click', () => {
          searchInput.value = el.dataset.name;
          suggestionsEl.classList.add('hidden');
          fetchWeather(el.dataset.name);
        });
      });
    } catch (_) { suggestionsEl.classList.add('hidden'); }
  }, 350);
});

document.addEventListener('click', e => {
  if (!suggestionsEl.contains(e.target) && e.target !== searchInput)
    suggestionsEl.classList.add('hidden');
});

/* ── GEOLOCATION ─────────────────────────────────────────────────────────── */
locBtn.addEventListener('click', () => {
  if (!navigator.geolocation) { showError('Geolocation not supported.'); return; }
  showLoading(true);
  navigator.geolocation.getCurrentPosition(
    pos => fetchWeather(`${pos.coords.latitude},${pos.coords.longitude}`),
    () => { showLoading(false); showError('Location access denied.'); }
  );
});

/* ── CLOSE HOURLY ────────────────────────────────────────────────────────── */
$('closeHourly').addEventListener('click', () => {
  $('hourlyCard').classList.add('hidden');
  document.querySelectorAll('.day-card').forEach(c => c.classList.remove('selected'));
  state.selectedDay = null;
});

/* ── RESIZE: redraw chart ────────────────────────────────────────────────── */
window.addEventListener('resize', () => {
  if (!$('hourlyCard').classList.contains('hidden') && state.data && state.selectedDay != null) {
    drawRainChart(state.data.forecast[state.selectedDay].hourly);
  }
});

/* ── INIT: load default city ─────────────────────────────────────────────── */
fetchWeather('London');
