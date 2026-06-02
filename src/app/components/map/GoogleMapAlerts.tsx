import { useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import GoogleMap from './GoogleMap';

const PAKISTAN_CENTER: google.maps.LatLngLiteral = { lat: 24.8607, lng: 67.0011 };
const MAP_MIN_HEIGHT_PX = 500;

function parseCoordinate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getAlertPosition(data: Record<string, unknown>): google.maps.LatLngLiteral | null {
  const location = data.location;
  if (!location || typeof location !== 'object') return null;

  const lat = parseCoordinate((location as Record<string, unknown>).lat);
  const lng = parseCoordinate((location as Record<string, unknown>).lng);
  if (lat === null || lng === null) return null;

  return { lat, lng };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface GoogleMapAlertsProps {
  searchTarget?: string | null;
}

export default function GoogleMapAlerts({ searchTarget }: GoogleMapAlertsProps) {
  const mapInstance = useRef<google.maps.Map | null>(null);
  const unsubscribeRef = useRef<() => void>();
  const markers = useRef<Record<string, google.maps.Marker>>({});
  const infoWindows = useRef<Record<string, google.maps.InfoWindow>>({});

  const clearMarkers = () => {
    Object.values(markers.current).forEach((marker) => marker.setMap(null));
    markers.current = {};
    infoWindows.current = {};
  };

  const upsertAlertMarker = (alertId: string, data: Record<string, unknown>, map: google.maps.Map) => {
    const position = getAlertPosition(data);
    if (!position) {
      if (markers.current[alertId]) {
        markers.current[alertId].setMap(null);
        delete markers.current[alertId];
        delete infoWindows.current[alertId];
      }
      return;
    }

    const studentName = (data.studentName as string) || 'Unknown student';
    const parentName = (data.parentName as string) || 'N/A';
    const type = (data.type as string) || 'unknown';
    const status = (data.status as string) || 'unknown';
    const timestamp = (data.timestamp as string) || '';

    const infoHtml = `
        <div style="min-width:200px;font-family:system-ui,sans-serif">
          <strong>${escapeHtml(studentName)}</strong>
          <div style="margin-top:6px;font-size:13px;color:#334155">
            <div>Parent: ${escapeHtml(parentName)}</div>
            <div>Type: ${escapeHtml(type)}</div>
            <div>Status: ${escapeHtml(status)}</div>
            ${timestamp ? `<div>Time: ${escapeHtml(timestamp)}</div>` : ''}
          </div>
        </div>
      `;

    const existing = markers.current[alertId];
    if (!existing) {
      const marker = new google.maps.Marker({
        position,
        map,
        title: studentName
      });
      const info = new google.maps.InfoWindow({ content: infoHtml });
      marker.addListener('click', () => info.open({ map, anchor: marker }));
      markers.current[alertId] = marker;
      infoWindows.current[alertId] = info;
      return;
    }

    existing.setPosition(position);
    existing.setTitle(studentName);
    infoWindows.current[alertId].setContent(infoHtml);
  };

  const subscribeToAlerts = (map: google.maps.Map) => {
    return onSnapshot(
      collection(db, 'alerts'),
      (snapshot) => {
        const seen = new Set<string>();

        snapshot.docs.forEach((docSnap) => {
          const alertId = docSnap.id;
          seen.add(alertId);
          upsertAlertMarker(alertId, docSnap.data() as Record<string, unknown>, map);
        });

        Object.keys(markers.current).forEach((alertId) => {
          if (!seen.has(alertId)) {
            markers.current[alertId].setMap(null);
            delete markers.current[alertId];
            delete infoWindows.current[alertId];
          }
        });
      },
      (error) => {
        console.error('[GoogleMapAlerts] Firestore listener error', error);
      }
    );
  };

  const handleMapLoad = (map: google.maps.Map) => {
    mapInstance.current = map;
    unsubscribeRef.current = subscribeToAlerts(map);
  };

  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
      clearMarkers();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!searchTarget || !mapInstance.current) return;

    const match = Object.entries(markers.current).find(([, marker]) => {
      const title = marker.getTitle() ?? '';
      return title.toLowerCase().includes(searchTarget.toLowerCase());
    });

    if (!match) return;

    const [alertId, marker] = match;
    const map = mapInstance.current;
    const position = marker.getPosition();
    if (!position || !map) return;

    map.panTo(position);
    map.setZoom(15);
    infoWindows.current[alertId]?.open({ map, anchor: marker });
  }, [searchTarget]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800">
      <GoogleMap
        center={PAKISTAN_CENTER}
        zoom={12}
        className="w-full"
        style={{ minHeight: MAP_MIN_HEIGHT_PX, height: MAP_MIN_HEIGHT_PX }}
        onLoad={handleMapLoad}
        onError={(message) => console.error('[GoogleMapAlerts] Map error', message)}
      />
    </div>
  );
}
