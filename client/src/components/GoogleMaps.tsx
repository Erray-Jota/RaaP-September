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
      // Create a realistic mock map visualization
      if (mapRef.current) {
        const mapContainer = mapRef.current;
        mapContainer.style.backgroundColor = '#a7c5a0';
        mapContainer.style.position = 'relative';
        mapContainer.style.overflow = 'hidden';
        mapContainer.style.backgroundImage = `
          radial-gradient(circle at 20% 30%, #4f8a4f 2px, transparent 2px),
          radial-gradient(circle at 80% 70%, #6b9d6b 1px, transparent 1px),
          linear-gradient(45deg, #a7c5a0 0%, #9bb896 50%, #8fac8c 100%)
        `;
        
        // Create realistic map content with positioned markers
        mapContainer.innerHTML = `
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;">
            <!-- Road lines to make it look like a map -->
            <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
              <path d="M0,60 Q150,80 300,70 T600,75" stroke="#d4c5b9" stroke-width="3" fill="none" opacity="0.7"/>
              <path d="M100,0 Q120,150 110,300" stroke="#d4c5b9" stroke-width="2" fill="none" opacity="0.5"/>
              <path d="M0,150 Q200,140 400,155 T800,160" stroke="#d4c5b9" stroke-width="2" fill="none" opacity="0.6"/>
              <path d="M250,0 Q260,100 255,200 T250,400" stroke="#d4c5b9" stroke-width="2" fill="none" opacity="0.4"/>
            </svg>
            
            <!-- Project location marker (center) -->
            <div style="position: absolute; top: 45%; left: 45%; transform: translate(-50%, -100%); z-index: 10;">
              <div style="background: #DC2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,0.3); white-space: nowrap;">
                🏠 Serenity Village
              </div>
              <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #DC2626; margin: 0 auto;"></div>
            </div>
            
            ${locations.filter(loc => loc.type !== 'project').map((loc, index) => {
              const positions = [
                { top: '25%', left: '25%' }, // Northwest
                { top: '35%', left: '70%' }, // Northeast
                { top: '65%', left: '30%' }, // Southwest
                { top: '70%', left: '75%' }, // Southeast
                { top: '20%', left: '60%' }, // North
                { top: '80%', left: '55%' }  // South
              ];
              const pos = positions[index % positions.length];
              const color = loc.type === 'fabricator' ? '#F59E0B' : loc.type === 'gc' ? '#059669' : loc.type === 'aor' ? '#2563EB' : '#8B5CF6';
              
              return `
                <div style="position: absolute; top: ${pos.top}; left: ${pos.left}; transform: translate(-50%, -100%); z-index: 5;">
                  <div style="background: ${color}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 500; box-shadow: 0 2px 6px rgba(0,0,0,0.2); white-space: nowrap; max-width: 120px; overflow: hidden; text-overflow: ellipsis;">
                    ${loc.title}
                  </div>
                  <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 6px solid ${color}; margin: 0 auto;"></div>
                </div>
              `;
            }).join('')}
            
            <!-- Map controls (zoom buttons) -->
            <div style="position: absolute; top: 10px; left: 10px; display: flex; flex-direction: column; gap: 2px;">
              <button style="width: 30px; height: 30px; background: white; border: 1px solid #ccc; border-radius: 3px; font-size: 18px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">+</button>
              <button style="width: 30px; height: 30px; background: white; border: 1px solid #ccc; border-radius: 3px; font-size: 18px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">−</button>
            </div>
            
            <!-- Map type control -->
            <div style="position: absolute; top: 10px; right: 10px;">
              <select style="padding: 4px 8px; background: white; border: 1px solid #ccc; border-radius: 3px; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <option>Map</option>
                <option>Satellite</option>
                <option>Terrain</option>
              </select>
            </div>
            
            <!-- Scale indicator -->
            <div style="position: absolute; bottom: 10px; left: 10px; background: white; padding: 4px 8px; border-radius: 3px; font-size: 11px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="width: 60px; height: 2px; background: #333; margin-bottom: 2px;"></div>
              <div>20 miles</div>
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