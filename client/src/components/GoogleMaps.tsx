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

// Create custom marker icon with partner type icons
const createMarkerIcon = (type: string, isProject: boolean = false) => {
  const size = isProject ? 40 : 32;
  const color = getMarkerColor(type);
  
  // Get the appropriate icon SVG path based on partner type
  const getIconPath = (partnerType: string) => {
    switch(partnerType) {
      case 'fabricator':
        return '<path d="M3 21V7L8 3L13 7V21H11V14H9V21H3ZM5 19H7V12H5V19ZM14 21V10L19 6L22 8V21H20V14H18V21H14ZM16 19H20V12H16V19Z" fill="white"/>';
      case 'gc':
        return '<path d="M13 3V5H21V19H19V21H15V19H9V21H5V19H3V5H11V3H13ZM11 7H5V17H7V15H9V17H15V15H17V17H19V7H13V9H11V7Z" fill="white"/>';
      case 'aor':
        return '<path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="white"/>';
      case 'consultant':
        return '<path d="M16 4C18.2 4 20 5.8 20 8C20 10.2 18.2 12 16 12C13.8 12 12 10.2 12 8C12 5.8 13.8 4 16 4ZM16 6C14.9 6 14 6.9 14 8C14 9.1 14.9 10 16 10C17.1 10 18 9.1 18 8C18 6.9 17.1 6 16 6ZM8 8C9.1 8 10 7.1 10 6C10 4.9 9.1 4 8 4C6.9 4 6 4.9 6 6C6 7.1 6.9 8 8 8ZM8 10C5.8 10 2 11.1 2 13.3V16H10V13.3C10 11.1 8.2 10 8 10ZM16 14C13.8 14 10 15.1 10 17.3V20H22V17.3C22 15.1 18.2 14 16 14Z" fill="white"/>';
      case 'transportation':
        return '<path d="M20 8H18V6C18 4.9 17.1 4 16 4H4C2.9 4 2 4.9 2 6V17H4C4 18.7 5.3 20 7 20S10 18.7 10 17H14C14 18.7 15.3 20 17 20S20 18.7 20 17H22V13L20 8ZM7 18.5C6.2 18.5 5.5 17.8 5.5 17S6.2 15.5 7 15.5 8.5 16.2 8.5 17 7.8 18.5 7 18.5ZM17 18.5C16.2 18.5 15.5 17.8 15.5 17S16.2 15.5 17 15.5 18.5 16.2 18.5 17 17.8 18.5 17 18.5ZM16 6V8H20L18.5 6H16Z" fill="white"/>';
      case 'engineering':
        return '<path d="M12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5ZM19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.97 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.49 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.51 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.72 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.21 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.03 4.95 18.95L7.44 17.95C7.96 18.35 8.52 18.68 9.13 18.93L9.51 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.49 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.95L19.05 18.95C19.28 19.04 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98Z" fill="white"/>';
      default:
        return '<circle cx="12" cy="12" r="6" fill="white"/>';
    }
  };
  
  const svg = isProject ? 
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>` :
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      ${getIconPath(type)}
    </svg>`;
  
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