import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface LeafletMapProps {
  lat: number;
  lng: number;
  studentName?: string;
  isEmergency?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function LeafletMap({
  lat,
  lng,
  studentName = 'Student Location',
  isEmergency = false,
  className = 'w-full h-full min-h-[500px] rounded-2xl',
  style
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const safeLat = Number.isFinite(lat) && lat !== 0 ? lat : 24.8607;
    const safeLng = Number.isFinite(lng) && lng !== 0 ? lng : 67.0011;

    if (!mapInstanceRef.current) {
      const map = L.map(containerRef.current, {
        center: [safeLat, safeLng],
        zoom: 15,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    map.setView([safeLat, safeLng], map.getZoom());

    const iconHtml = `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;">
        ${isEmergency ? '<span style="position:absolute;width:48px;height:48px;border-radius:50%;background-color:rgba(244,63,94,0.4);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>' : ''}
        <div style="width:34px;height:34px;border-radius:50%;background:${isEmergency ? '#e11d48' : '#0284c7'};border:3px solid #ffffff;box-shadow:0 10px 15px -3px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:16px;">
          ${isEmergency ? '??' : '??'}
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: iconHtml,
      className: 'custom-map-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([safeLat, safeLng]);
      markerRef.current.setIcon(customIcon);
      markerRef.current.setPopupContent(`
        <div style="font-family:system-ui,sans-serif;padding:4px 6px;">
          <strong style="color:${isEmergency ? '#e11d48' : '#0284c7'};font-size:14px;">${studentName}</strong>
          <div style="font-size:12px;color:#475569;margin-top:4px;">
            Lat: ${safeLat.toFixed(6)}<br/>Lng: ${safeLng.toFixed(6)}
          </div>
        </div>
      `);
    } else {
      const marker = L.marker([safeLat, safeLng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:system-ui,sans-serif;padding:4px 6px;">
          <strong style="color:${isEmergency ? '#e11d48' : '#0284c7'};font-size:14px;">${studentName}</strong>
          <div style="font-size:12px;color:#475569;margin-top:4px;">
            Lat: ${safeLat.toFixed(6)}<br/>Lng: ${safeLng.toFixed(6)}
          </div>
        </div>
      `);
      markerRef.current = marker;
    }
  }, [lat, lng, studentName, isEmergency]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: 500, height: 500, width: '100%', zIndex: 1, ...style }}
    />
  );
}
