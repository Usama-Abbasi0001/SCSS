import LeafletAlertsMap from './LeafletAlertsMap';

interface GoogleMapAlertsProps {
  searchTarget?: string | null;
}

export default function GoogleMapAlerts({ searchTarget }: GoogleMapAlertsProps) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800">
      <LeafletAlertsMap searchTarget={searchTarget} className="w-full h-full min-h-[500px]" />
    </div>
  );
}
