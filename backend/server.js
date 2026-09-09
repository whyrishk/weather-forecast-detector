const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const API_KEY = process.env.OPENWEATHER_API_KEY || '3a278c1dd6d3c6ffa145adbf9264ef08';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

// Get coordinates from city name or PIN code
async function getCoords(query) {
  let url;

  if (/^\d{6}$/.test(query.trim())) {
    url = `${GEO_URL}/zip?zip=${query.trim()},IN&appid=${API_KEY}`;
    const r = await axios.get(url);
    return { lat: r.data.lat, lon: r.data.lon, name: r.data.name };
  } else {
    url = `${GEO_URL}/direct?q=${encodeURIComponent(query)},IN&limit=1&appid=${API_KEY}`;
    const r = await axios.get(url);
    if (!r.data.length) throw new Error('Location not found');

    return {
      lat: r.data[0].lat,
      lon: r.data[0].lon,
      name: r.data[0].name
    };
  }
}

// Weather API
app.get('/api/weather', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Query param "q" is required' });
    }

    const { lat, lon, name } = await getCoords(query);

    const [currentRes, forecastRes, airRes] = await Promise.all([
      axios.get(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
      axios.get(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
      axios.get(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    ]);

    const current = currentRes.data;
    const forecast = forecastRes.data;
    const air = airRes.data;

    // Group forecast by day
    const hourlyMap = {};

    forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toISOString().slice(0, 10);

      if (!hourlyMap[dayKey]) hourlyMap[dayKey] = [];

      hourlyMap[dayKey].push({
        hour: date.getUTCHours(),
        time: date.toISOString(),
        temp: Math.round(item.main.temp),
        feels_like: Math.round(item.main.feels_like),
        humidity: item.main.humidity,
        rain: item.rain ? (item.rain['3h'] || 0) : 0,
        rain_prob: Math.round((item.pop || 0) * 100),
        wind_speed: item.wind.speed,
        wind_deg: item.wind.deg,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        visibility: item.visibility || 10000,
        pressure: item.main.pressure,
        clouds: item.clouds.all
      });
    });

    const days = Object.keys(hourlyMap).slice(0, 7).map(dayKey => {
      const hours = hourlyMap[dayKey];

      return {
        date: dayKey,
        temp_max: Math.max(...hours.map(h => h.temp)),
        temp_min: Math.min(...hours.map(h => h.temp)),
        avg_humidity: Math.round(
          hours.reduce((s, h) => s + h.humidity, 0) / hours.length
        ),
        total_rain: parseFloat(
          hours.reduce((s, h) => s + h.rain, 0).toFixed(2)
        ),
        max_rain_prob: Math.max(...hours.map(h => h.rain_prob)),
        icon: hours[0]?.icon,
        description: hours[0]?.description || '',
        hourly: hours
      };
    });

    const aqiLabels = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    const aqi = air.list?.[0]?.main?.aqi || 1;

    res.json({
      location: {
        name: current.name || name,
        country: current.sys?.country || '',
        lat: Number(lat.toFixed(4)),
        lon: Number(lon.toFixed(4))
      },
     current: {
  temp: Math.round(current.main.temp),
  temp_max: Math.round(current.main.temp_max),
  temp_min: Math.round(current.main.temp_min),
  feels_like: Math.round(current.main.feels_like),
  humidity: current.main.humidity,
  pressure: current.main.pressure,
  clouds: current.clouds?.all ?? 0,
  dt: current.dt,
        visibility: (current.visibility / 1000).toFixed(1),
        wind_speed: current.wind.speed,
        wind_deg: current.wind.deg,
        description: current.weather[0].description,
        icon: current.weather[0].icon,
        sunrise: current.sys.sunrise,
        sunset: current.sys.sunset,
        aqi,
        aqi_label: aqiLabels[aqi],
        components: air.list?.[0]?.components || {}
      },
      forecast: days
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      error: err.response?.data?.message || err.message
    });
  }
});

// Geocoding API
app.get('/api/geocode', async (req, res) => {
  try {
    const q = req.query.q;

    const url = `${GEO_URL}/direct?q=${encodeURIComponent(q)},IN&limit=5&appid=${API_KEY}`;
    const r = await axios.get(url);

    res.json(
      r.data.map(c => ({
        name: c.name,
        country: c.country,
        state: c.state,
        lat: c.lat,
        lon: c.lon
      }))
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Weather API running at http://localhost:${PORT}`);
});