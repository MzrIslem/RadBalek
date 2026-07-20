// Earthquakes over Algeria, last 14 days, M>=3.
// EMSC primary (faster/denser for the Mediterranean), USGS fallback. Both free.
const BOX = "minlatitude=18.9&maxlatitude=37.5&minlongitude=-8.7&maxlongitude=12&minmagnitude=3";

export async function fetchQuakes(fetchFn = fetch) {
  const start = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  try {
    return await fromEmsc(fetchFn, start);
  } catch {
    return await fromUsgs(fetchFn, start);
  }
}

async function fromEmsc(fetchFn, start) {
  const res = await fetchFn(
    `https://www.seismicportal.eu/fdsnws/event/1/query?format=json&starttime=${start}&${BOX}&limit=100`,
    { headers: { "user-agent": "radbalek/0.2" } }
  );
  if (res.status === 204) return []; // EMSC: no content = no events
  if (!res.ok) throw new Error(`EMSC HTTP ${res.status}`);
  const j = await res.json();
  return (j.features || []).map((f) => ({
    id: `emsc:${f.id}`,
    mag: f.properties.mag,
    time: f.properties.time,
    depth: f.properties.depth,
    lat: f.properties.lat,
    lon: f.properties.lon,
    place: f.properties.flynn_region,
  }));
}

async function fromUsgs(fetchFn, start) {
  const res = await fetchFn(
    `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start}&${BOX}&orderby=time`,
    { headers: { "user-agent": "radbalek/0.2" } }
  );
  if (!res.ok) throw new Error(`USGS HTTP ${res.status}`);
  const j = await res.json();
  return (j.features || []).map((f) => ({
    id: `usgs:${f.id}`,
    mag: f.properties.mag,
    time: new Date(f.properties.time).toISOString(),
    depth: f.geometry.coordinates[2],
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
    place: f.properties.place,
  }));
}
