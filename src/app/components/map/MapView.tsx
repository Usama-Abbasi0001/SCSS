import LeafletMap from './LeafletMap';

interface MapViewProps {
  lat: number;
  lng: number;
  studentName?: string;
  isEmergency?: boolean;
}

export default function MapView({ lat, lng, studentName, isEmergency = false }: MapViewProps) {
  return (
    <LeafletMap
      lat={lat}
      lng={lng}
      studentName={studentName}
      isEmergency={isEmergency}
      className="w-full h-full min-h-[500px]"
    />
  );
}
