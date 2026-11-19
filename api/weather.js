// Echo Precision weather proxy for in-browser GPS coordinates or city/ZIP searches.
// Open-Meteo values are model estimates, not direct readings at the range.
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "GET") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "GET required" }));
  }
  try {
    const q = req.query || {};
    const city = String(q.city || "").trim();
    let lat, lon, placeName;

    if (city) {
      if (city.length < 2 || city.length > 90) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: "Enter city/state or ZIP." }));
      }
      const query = new URLSearchParams({ name: city, count: "5", language: "en", format: "json" });
      if (/^\d{5}$/.test(city)) query.set("countryCode", "US");
      const locationResponse = await fetch("https://geocoding-api.open-meteo.com/v1/search?" + query, {
        signal: AbortSignal.timeout(9000)
      });
      if (!locationResponse.ok) throw new Error("Location lookup unavailable");
      const locationData = await locationResponse.json();
      const matches = (locationData.results || []).filter(x => Number.isFinite(x.latitude) && Number.isFinite(x.longitude));
      if (!matches.length) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: "No matching city or ZIP. Try City, State." }));
      }
      const location = matches[0];
      lat = location.latitude;
      lon = location.longitude;
      placeName = [location.name, location.admin1, location.country_code].filter(Boolean).join(", ");
    } else {
      lat = Number(q.lat);
      lon = Number(q.lon);
      if (q.lat == null || q.lon == null || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: "Valid coordinates required." }));
      }
      placeName = "Device location";
    }

    const query = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure",
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      timezone: "auto"
    });
    const response = await fetch("https://api.open-meteo.com/v1/forecast?" + query, {
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error("Weather provider unavailable");
    const data = await response.json();
    const c = data.current;
    if (!c || !Number.isFinite(c.temperature_2m)) throw new Error("Weather data incomplete");

    res.statusCode = 200;
    return res.end(JSON.stringify({
      source: "Open-Meteo forecast estimate",
      sourceType: "model",
      placeName,
      at: new Date().toISOString(),
      modelTime: c.time || null,
      temperature: c.temperature_2m,
      windSpeed: c.wind_speed_10m ?? null,
      windDirection: c.wind_direction_10m ?? null,
      humidity: c.relative_humidity_2m ?? null,
      pressure: c.surface_pressure ?? null,
      altitudeMeters: Number.isFinite(data.elevation) ? data.elevation : null,
      latitude: Math.round(lat * 100) / 100,
      longitude: Math.round(lon * 100) / 100
    }));
  } catch (error) {
    res.statusCode = 502;
    return res.end(JSON.stringify({ error: error?.message || "Weather error" }));
  }
};
