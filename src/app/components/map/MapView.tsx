import { useEffect, useRef } from 'react';
import GoogleMap from './GoogleMap';

interface MapViewProps {
  lat: number;
  lng: number;
  studentName?: string;
}

export default function MapView({ lat, lng, studentName }: MapViewProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const position = { lat, lng };
    if (!markerRef.current) {
      markerRef.current = new window.google.maps.Marker({
        position,
        map: mapRef.current,
        title: studentName || 'Student location'
      });
      return;
    }

    markerRef.current.setPosition(position);
    markerRef.current.setTitle(studentName || 'Student location');
  }, [lat, lng, studentName]);

  useEffect(() => {
    return () => {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  return (
    <GoogleMap
      center={{ lat, lng }}
      zoom={15}
      className="w-full"
      style={{ minHeight: 500, height: 500 }}
      onLoad={(map) => {
        mapRef.current = map;
        const position = { lat, lng };
        markerRef.current = new window.google.maps.Marker({
          position,
          map,
          title: studentName || 'Student location'
        });
      }}
    />
  );
}
