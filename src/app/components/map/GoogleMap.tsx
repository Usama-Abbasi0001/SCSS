import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

interface GoogleMapProps {
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  className?: string;
  style?: CSSProperties;
  onLoad?: (map: google.maps.Map) => void;
  onError?: (message: string) => void;
}

const DEFAULT_CENTER: google.maps.LatLngLiteral = {
  lat: 24.8607,
  lng: 67.0011
};

const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();

function isApiKeyConfigured(value?: string): value is string {
  return Boolean(value && value !== 'YOUR_GOOGLE_MAPS_API_KEY');
}

export default function GoogleMap({
  center = DEFAULT_CENTER,
  zoom = 12,
  className,
  style,
  onLoad,
  onError
}: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const [mapError, setMapError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
  }, [onLoad, onError]);

  useEffect(() => {
    if (!isApiKeyConfigured(mapsApiKey)) {
      const message =
        'Google Maps API key is missing or invalid. Set VITE_GOOGLE_MAPS_API_KEY in .env and restart the dev server.';
      setMapError(message);
      setLoading(false);
      onErrorRef.current?.(message);
      return;
    }

    let cancelled = false;
    setMapError(null);
    setLoading(true);

    async function loadGoogleMaps() {
      try {
        setOptions({
          key: mapsApiKey,
          v: 'weekly',
          libraries: ['places']
        });

        const { Map } = await importLibrary('maps');

        if (cancelled || !containerRef.current) return;

        const map = new Map(containerRef.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true
        });

        if (cancelled) return;

        setMapInstance(map);
        setLoading(false);
        onLoadRef.current?.(map);
      } catch (error) {
        const message =
          'Failed to load Google Maps. Verify VITE_GOOGLE_MAPS_API_KEY, enable the Maps JavaScript API, and restart the app.';
        console.error('[GoogleMap] load error', error);
        if (!cancelled) {
          setMapError(message);
          setLoading(false);
          onErrorRef.current?.(message);
        }
      }
    }

    void loadGoogleMaps();

    return () => {
      cancelled = true;
    };
  }, [center.lat, center.lng, zoom]);

  useEffect(() => {
    if (!mapInstance) return;
    mapInstance.setCenter(center);
    mapInstance.setZoom(zoom);
  }, [center, zoom, mapInstance]);

  if (mapError) {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/10 ${className ?? ''}`} style={style}>
        <div className="flex min-h-[500px] w-full items-center justify-center px-6 py-10 text-center text-sm text-amber-100">
          {mapError}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-800 ${className ?? ''}`} style={style}>
      <div ref={containerRef} className="w-full h-full min-h-[500px]" />
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/85 text-sm text-slate-300">
          Loading map…
        </div>
      )}
    </div>
  );
}
