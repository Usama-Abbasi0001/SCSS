import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { buildGoogleMapsUrl } from '../../services/safetyService';

interface LeafletAlertsMapProps {
  searchTarget?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

export default function LeafletAlertsMap({
  searchTarget,
  className = 'w-full h-full min-h-[500px] rounded-2xl',
  style
}: LeafletAlertsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(containerRef.current, {
        center: [24.8607, 67.0011],
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Subscribe to real-time Firestore alerts
    const unsub = onSnapshot(
      collection(db, 'alerts'),
      (snapshot) => {
        const seenIds = new Set<string>();

        snapshot.docs.forEach((docSnap) => {
          const alertId = docSnap.id;
          const data = docSnap.data();
          seenIds.add(alertId);

          const lat = typeof data.latitude === 'number' ? data.latitude : data.location?.lat;
          const lng = typeof data.longitude === 'number' ? data.longitude : data.location?.lng;

          if (!lat || !lng) return;

          const isEmergency = data.status === 'active' || data.type === 'emergency';
          const studentName = data.studentName || 'Student';
          const regNumber = data.registrationNumber || '';
          const parentName = data.parentName || 'Parent';
          const timestamp = data.timestamp || '';
          const gMapsUrl = data.googleMapsUrl || buildGoogleMapsUrl(lat, lng);

          const iconHtml = `
            <div style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;">
              ${isEmergency ? '<span style="position:absolute;width:48px;height:48px;border-radius:50%;background-color:rgba(244,63,94,0.4);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>' : ''}
              <div style="width:34px;height:34px;border-radius:50%;background:${isEmergency ? '#e11d48' : '#10b981'};border:3px solid #ffffff;box-shadow:0 10px 15px -3px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:16px;">
                ${isEmergency ? '??' : '???'}
              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-alert-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
          });

          const popupHtml = `
            <div style="font-family:system-ui,sans-serif;min-width:200px;padding:4px 6px;">
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:12px;padding:2px 6px;border-radius:9999px;font-weight:700;text-transform:uppercase;background:${isEmergency ? '#ffe4e6' : '#dcfce7'};color:${isEmergency ? '#be123c' : '#15803d'};">
                  ${data.status || 'Active'}
                </span>
              </div>
              <h4 style="margin:6px 0 2px;font-size:15px;font-weight:700;color:#0f172a;">${studentName}</h4>
              <p style="margin:0;font-size:12px;color:#64748b;">Reg: ${regNumber} • Parent: ${parentName}</p>
              <p style="margin:4px 0;font-size:11px;color:#94a3b8;">${timestamp}</p>
              <div style="margin-top:8px;">
                <a href="${gMapsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:4px 10px;background:#0284c7;color:#ffffff;text-decoration:none;border-radius:6px;font-size:11px;font-weight:600;">
                  Open in Google Maps ?
                </a>
              </div>
            </div>
          `;

          if (markersRef.current[alertId]) {
            const m = markersRef.current[alertId];
            m.setLatLng([lat, lng]);
            m.setIcon(customIcon);
            m.setPopupContent(popupHtml);
          } else {
            const m = L.marker([lat, lng], { icon: customIcon }).addTo(map);
            m.bindPopup(popupHtml);
            markersRef.current[alertId] = m;
          }
        });

        // Cleanup removed alerts
        Object.keys(markersRef.current).forEach((id) => {
          if (!seenIds.has(id)) {
            markersRef.current[id].remove();
            delete markersRef.current[id];
          }
        });
      },
      (err) => console.error('[LeafletAlertsMap] error', err)
    );

    return () => {
      unsub();
    };
  }, []);

  // Search target panning
  useEffect(() => {
    if (!searchTarget || !mapInstanceRef.current) return;
    const queryStr = searchTarget.toLowerCase().trim();

    const match = Object.values(markersRef.current).find((marker) => {
      const content = marker.getPopup()?.getContent();
      return typeof content === 'string' && content.toLowerCase().includes(queryStr);
    });

    if (match) {
      mapInstanceRef.current.panTo(match.getLatLng());
      mapInstanceRef.current.setZoom(16);
      match.openPopup();
    }
  }, [searchTarget]);

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
