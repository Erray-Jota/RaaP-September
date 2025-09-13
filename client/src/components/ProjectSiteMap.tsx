import { useEffect, useRef, useState } from 'react';
import googleMapsLoader from '@/utils/googleMapsLoader';

interface ProjectSiteMapProps {
  address: string;
  projectName: string;
  height?: string;
  className?: string;
}

export default function ProjectSiteMap({
  address,
  projectName,
  height = '400px',
  className = ''
}: ProjectSiteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        await googleMapsLoader.loadGoogleMaps();
        
        // If no address provided, show default US map view
        if (!address || address.trim() === '') {
          // Default center of the United States (approximately Kansas)
          const defaultCenter = { lat: 39.8283, lng: -98.5795 };
          
          const map = new (window as any).google.maps.Map(mapRef.current, {
            center: defaultCenter,
            zoom: 4, // Show most of the US
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

          setIsLoaded(true);
          return;
        }

        // If address is provided, geocode it and zoom to location
        const geocoder = new (window as any).google.maps.Geocoder();
        
        geocoder.geocode({ address: address }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            
            // Create the map
            const map = new (window as any).google.maps.Map(mapRef.current, {
              center: location,
              zoom: 15,
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

            // Add a marker for the project site
            const marker = new (window as any).google.maps.Marker({
              position: location,
              map: map,
              title: projectName,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#DC2626" stroke="white" stroke-width="2"/>
                    <circle cx="12" cy="12" r="4" fill="white"/>
                  </svg>
                `),
                scaledSize: new (window as any).google.maps.Size(40, 40),
                anchor: new (window as any).google.maps.Point(20, 20)
              }
            });

            // Add info window with safe DOM manipulation
            const infoWindowDiv = document.createElement('div');
            infoWindowDiv.style.maxWidth = '250px';
            infoWindowDiv.style.fontFamily = "'Inter', sans-serif";
            
            const heading = document.createElement('h3');
            heading.style.margin = '0 0 8px 0';
            heading.style.color = '#1f2937';
            heading.style.fontSize = '16px';
            heading.style.fontWeight = '600';
            heading.textContent = projectName; // Safe text content
            
            const paragraph = document.createElement('p');
            paragraph.style.margin = '0';
            paragraph.style.color = '#4b5563';
            paragraph.style.fontSize = '13px';
            paragraph.textContent = address; // Safe text content
            
            infoWindowDiv.appendChild(heading);
            infoWindowDiv.appendChild(paragraph);
            
            const infoWindow = new (window as any).google.maps.InfoWindow({
              content: infoWindowDiv
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });

            setIsLoaded(true);
          } else {
            setLoadError('Failed to geocode address: ' + address);
          }
        });
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setLoadError('Failed to load Google Maps');
      }
    };

    // Reset error and loading state when address changes
    setLoadError(null);
    setIsLoaded(false);
    initializeMap();
  }, [address, projectName]);

  if (loadError) {
    return (
      <div className={`border rounded-lg p-4 bg-gray-50 ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-sm">Unable to load map</p>
            <p className="text-xs text-gray-400 mt-1">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <div 
        ref={mapRef} 
        style={{ width: '100%', height: '100%' }}
        data-testid="project-site-map"
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}