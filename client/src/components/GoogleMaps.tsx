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

// Create custom marker icon with clear partner type display
const createMarkerIcon = (type: string, isProject: boolean = false) => {
  const size = isProject ? 40 : 24;
  const color = getMarkerColor(type);
  
  if (isProject) {
    // Project markers keep the original circle design
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  } else {
    // Partner markers use colored dots for better visibility
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="2"/>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
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

        // Add markers for each location
        const infoWindow = new (window as any).google.maps.InfoWindow();
        
        locations.forEach((location) => {
          const isProject = location.type === 'project';
          
          const marker = new (window as any).google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: map,
            title: location.title,
            icon: {
              url: createMarkerIcon(location.type, isProject),
              scaledSize: new (window as any).google.maps.Size(isProject ? 40 : 32, isProject ? 40 : 32),
              anchor: new (window as any).google.maps.Point(isProject ? 20 : 16, isProject ? 20 : 16)
            }
          });

          // Add click listener for info window
          marker.addListener('click', () => {
            const content = `
              <div style="max-width: 250px; font-family: 'Inter', sans-serif;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">${location.title}</h3>
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; text-transform: capitalize;">${location.type === 'aor' ? 'Architect of Record' : location.type === 'gc' ? 'General Contractor' : location.type}</p>
                ${location.info ? `<p style="margin: 0; color: #4b5563; font-size: 13px;">${location.info}</p>` : ''}
              </div>
            `;
            
            infoWindow.setContent(content);
            infoWindow.open(map, marker);
          });
        });

        // Adjust map bounds to show all markers
        if (locations.length > 1) {
          const bounds = new (window as any).google.maps.LatLngBounds();
          locations.forEach(location => {
            bounds.extend(new (window as any).google.maps.LatLng(location.lat, location.lng));
          });
          map.fitBounds(bounds);
          
          // Ensure minimum zoom level
          const listener = (window as any).google.maps.event.addListener(map, 'idle', () => {
            if (map.getZoom() > 15) map.setZoom(15);
            (window as any).google.maps.event.removeListener(listener);
          });
        }

      } catch (error) {
        console.error('Error initializing Google Maps:', error);
        setLoadError('Failed to initialize map');
      }
    };

    const loadMap = async () => {
      try {
        setLoadError(null);
        await GoogleMapsLoader.loadGoogleMaps();
        setIsLoaded(true);
        initializeMap();
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setLoadError('Failed to load Google Maps. Please check your API key configuration.');
      }
    };

    loadMap();
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
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#dc2626' }}>Map Loading Error</p>
          <p style={{ margin: 0, fontSize: '14px', color: '#7f1d1d' }}>{loadError}</p>
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
        <div style={{ textAlign: 'center', padding: '20px' }}>
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