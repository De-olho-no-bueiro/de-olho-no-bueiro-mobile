export type PolygonPoint = {
  latitude: number;
  longitude: number;
};

function getSignedArea(points: PolygonPoint[]) {
  let area = 0;

  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    area += current.longitude * next.latitude - next.longitude * current.latitude;
  }

  return area / 2;
}

export function ordenarPontosPoligono(points: PolygonPoint[]) {
  if (points.length < 4) {
    return [...points];
  }

  const center = points.reduce(
    (acc, point) => ({
      latitude: acc.latitude + point.latitude / points.length,
      longitude: acc.longitude + point.longitude / points.length,
    }),
    { latitude: 0, longitude: 0 },
  );

  const ordered = [...points].sort((a, b) => {
    const angleA = Math.atan2(a.latitude - center.latitude, a.longitude - center.longitude);
    const angleB = Math.atan2(b.latitude - center.latitude, b.longitude - center.longitude);
    return angleA - angleB;
  });

  return getSignedArea(ordered) < 0 ? ordered.reverse() : ordered;
}
