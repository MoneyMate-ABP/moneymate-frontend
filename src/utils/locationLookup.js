const locationNameCache = new Map();

function toKey(lat, lng) {
  return `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
}

export async function getLocationName(lat, lng) {
  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return "";

  const key = toKey(latNum, lngNum);
  if (locationNameCache.has(key)) {
    return locationNameCache.get(key);
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latNum}&lon=${lngNum}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "id,en",
        },
      },
    );

    if (!res.ok) throw new Error("reverse geocoding failed");

    const data = await res.json();
    const locationName = data?.display_name || "";

    locationNameCache.set(key, locationName);
    return locationName;
  } catch {
    return "";
  }
}
