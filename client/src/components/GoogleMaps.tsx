import { useEffect, useRef, useState } from 'react';
import GoogleMapsLoader from '@/utils/googleMapsLoader';

// Location interface
interface Location {
  lat: number;
  lng: number;
  title: string;
  type: 'project' | 'fabricator' | 'gc' | 'aor' | 'consultant' | 'transportation';
  info?: string;
}

// Props interface
interface GoogleMapsProps {
  locations: Location[];
  center: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  className?: string;
}

// Custom marker colors for different partner types
const getMarkerColor = (type: string) => {
  const colors = {
    project: '#DC2626',      // Red
    fabricator: '#F59E0B',   // Amber
    gc: '#059669',           // Emerald
    aor: '#2563EB',          // Blue
    consultant: '#8B5CF6',   // Violet
    transportation: '#EAB308' // Yellow
  };
  return colors[type as keyof typeof colors] || colors.fabricator;
};

// Create custom marker icon
const createMarkerIcon = (color: string, isProject: boolean = false) => {
  const size = isProject ? 40 : 32;
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      ${isProject ? '<circle cx="12" cy="12" r="4" fill="white"/>' : ''}
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export default function GoogleMaps({
  locations,
  center,
  zoom = 10,
  height = '400px',
  className = ''
}: GoogleMapsProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current) return;

      try {
        const map = new (window as any).google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeId: (window as any).google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi.business',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true
        });

        mapInstanceRef.current = map;

        // Add markers for all locations
        locations.forEach((location) => {
          const isProject = location.type === 'project';
          const color = getMarkerColor(location.type);
          
          const marker = new (window as any).google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map,
            title: location.title,
            icon: {
              url: createMarkerIcon(color, isProject),
              scaledSize: new (window as any).google.maps.Size(isProject ? 40 : 32, isProject ? 40 : 32),
              anchor: new (window as any).google.maps.Point(isProject ? 20 : 16, isProject ? 20 : 16)
            },
            zIndex: isProject ? 1000 : 100
          });

          // Create info window content
          const infoWindowContent = `
            <div style="padding: 12px; min-width: 250px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937; font-size: 16px;">${location.title}</h3>
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${color}; margin-right: 8px;"></div>
                <span style="font-size: 14px; color: #6b7280; text-transform: capitalize; font-weight: 500;">
                  ${location.type === 'aor' ? 'Architect of Record' : location.type.replace('_', ' ')}
                </span>
              </div>
              ${location.info ? `
                <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.4;">
                  ${location.info}
                </p>
              ` : ''}
              ${isProject ? `
                <div style="margin-top: 8px; padding: 8px; background: #fef3c7; border-radius: 6px; border-left: 4px solid ${color};">
                  <span style="font-size: 12px; color: #92400e; font-weight: 600;">📍 PROJECT LOCATION</span>
                </div>
              ` : ''}
            </div>
          `;

          const infoWindow = new (window as any).google.maps.InfoWindow({
            content: infoWindowContent
          });

          marker.addListener('click', () => {
            // Close all other info windows first
            infoWindow.open(map, marker);
          });
        });

        setIsLoaded(true);
        setLoadError(null);
      } catch (error) {
        console.error('Error initializing map:', error);
        setLoadError('Failed to initialize map');
      }
    };

    const loadGoogleMaps = async () => {
      const loader = GoogleMapsLoader.getInstance();
      
      try {
        await loader.loadGoogleMaps();
        initializeMap();
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setLoadError('Failed to load Google Maps API');
      }
    };

    loadGoogleMaps();

    return () => {
      // Cleanup if needed
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [locations, center, zoom]);

  if (loadError) {
    return (
      <div 
        className={className}
        style={{ 
          height, 
          width: '100%',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fef2f2'
        }}
      >
        <div style={{ textAlign: 'center', color: '#dc2626' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Map Loading Error</p>
          <p style={{ margin: 0, fontSize: '14px' }}>{loadError}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className={className}
        style={{ 
          height, 
          width: '100%',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb'
        }}
      >
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Loading Map...</p>
          <p style={{ margin: 0, fontSize: '14px' }}>Initializing Google Maps</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={className}
      style={{ 
        height, 
        width: '100%',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}
    />
  );
}