import { useEffect, useRef, useState } from 'react';

interface MapLocation {
  lat: number;
  lng: number;
  title: string;
  type: 'project' | 'fabricator' | 'gc' | 'aor' | 'consultant' | 'transportation' | 'engineering';
  info?: string;
}

interface GoogleMapsProps {
  locations: MapLocation[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  className?: string;
}

// Serenity Village coordinates (5224 Chestnut Road, Olivehurst CA)
const SERENITY_VILLAGE_COORDS = { lat: 39.0825, lng: -121.5644 };

// Partner icons mapping
const getMarkerIcon = (type: string): string => {
  const iconColors = {
    project: '#DC2626', // red-600
    fabricator: '#F59E0B', // amber-500
    gc: '#059669', // emerald-600
    aor: '#2563EB', // blue-600
    consultant: '#7C3AED', // violet-600
    transportation: '#EA580C', // orange-600
    engineering: '#0891B2', // cyan-600
  };
  
  const color = iconColors[type as keyof typeof iconColors] || '#6B7280';
  
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${color}">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `)}`;
};

export default function GoogleMaps({ 
  locations, 
  center = SERENITY_VILLAGE_COORDS, 
  zoom = 10, 
  height = '400px',
  className = ''
}: GoogleMapsProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeMap = () => {
      if (mapRef.current && (window as any).google && (window as any).google.maps) {
        const map = new (window as any).google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeId: (window as any).google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        mapInstanceRef.current = map;

        // Add markers for all locations
        locations.forEach((location) => {
          const marker = new (window as any).google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map,
            title: location.title,
            icon: {
              url: getMarkerIcon(location.type),
              scaledSize: new (window as any).google.maps.Size(30, 30),
              anchor: new (window as any).google.maps.Point(15, 30)
            }
          });

          // Add info window
          const infoWindow = new (window as any).google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${location.title}</h3>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280; text-transform: capitalize;">${location.type.replace('_', ' ')}</p>
                ${location.info ? `<p style="margin: 0; font-size: 13px; color: #4b5563;">${location.info}</p>` : ''}
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        });

        setIsLoaded(true);
      }
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
    } else {
      // Create a mock map visualization since this is for demo purposes
      if (mapRef.current) {
        const mapContainer = mapRef.current;
        mapContainer.style.backgroundColor = '#e5f3ff';
        mapContainer.style.position = 'relative';
        mapContainer.style.overflow = 'hidden';
        
        // Create mock map content
        mapContainer.innerHTML = `
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%); display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center; color: #0277bd;">
              <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Serenity Village & Partner Locations</div>
              <div style="font-size: 14px; opacity: 0.8;">Interactive map view showing project and partner locations</div>
              <div style="margin-top: 16px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                ${locations.map(loc => `
                  <div style="display: flex; align-items: center; gap: 4px; background: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: ${loc.type === 'project' ? '#DC2626' : loc.type === 'fabricator' ? '#F59E0B' : loc.type === 'gc' ? '#059669' : '#2563EB'}"></div>
                    <span style="color: #374151;">${loc.title}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;
        
        setIsLoaded(true);
      }
    }

    return () => {
      // Cleanup if needed
    };
  }, [locations, center, zoom]);

  return (
    <div className={className}>
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg overflow-hidden border border-gray-200"
      />
      {!isLoaded && (
        <div 
          style={{ height }}
          className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Type declaration for Google Maps
declare global {
  interface Window {
    google: any;
  }
}