import { useEffect, useRef, useState } from 'react';
import googleMapsLoader from '@/utils/googleMapsLoader';

interface RouteMapProps {
  destinationAddress: string;
  projectName: string;
  height?: string;
  className?: string;
}

export default function RouteMap({
  destinationAddress,
  projectName,
  height = '400px',
  className = ''
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        await googleMapsLoader.loadGoogleMaps();
        
        // Create the map
        const map = new (window as any).google.maps.Map(mapRef.current, {
          zoom: 6,
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

        // Create directions service and renderer
        const directionsService = new (window as any).google.maps.DirectionsService();
        const directionsRenderer = new (window as any).google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#2563EB',
            strokeWeight: 5,
            strokeOpacity: 0.8
          }
        });
        
        directionsRenderer.setMap(map);

        // Calculate route from Boise, Idaho to destination
        const request = {
          origin: 'Thomaston, GA, USA',
          destination: destinationAddress,
          travelMode: (window as any).google.maps.TravelMode.DRIVING,
          unitSystem: (window as any).google.maps.UnitSystem.IMPERIAL,
          avoidHighways: false,
          avoidTolls: false
        };

        directionsService.route(request, (result: any, status: any) => {
          if (status === 'OK') {
            directionsRenderer.setDirections(result);
            
            // Extract route information
            const route = result.routes[0];
            const leg = route.legs[0];
            
            setRouteInfo({
              distance: leg.distance.text,
              duration: leg.duration.text
            });

            // Custom markers for start and end points
            const startMarker = new (window as any).google.maps.Marker({
              position: leg.start_location,
              map: map,
              title: 'Thomaston, GA',
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8" fill="#059669" stroke="white" stroke-width="2"/>
                    <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">S</text>
                  </svg>
                `),
                scaledSize: new (window as any).google.maps.Size(32, 32),
                anchor: new (window as any).google.maps.Point(16, 16)
              }
            });

            const endMarker = new (window as any).google.maps.Marker({
              position: leg.end_location,
              map: map,
              title: projectName,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8" fill="#DC2626" stroke="white" stroke-width="2"/>
                    <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">E</text>
                  </svg>
                `),
                scaledSize: new (window as any).google.maps.Size(32, 32),
                anchor: new (window as any).google.maps.Point(16, 16)
              }
            });

            // Info windows with safe DOM manipulation
            const startInfoWindowDiv = document.createElement('div');
            startInfoWindowDiv.style.maxWidth = '200px';
            startInfoWindowDiv.style.fontFamily = "'Inter', sans-serif";
            
            const startHeading = document.createElement('h3');
            startHeading.style.margin = '0 0 8px 0';
            startHeading.style.color = '#1f2937';
            startHeading.style.fontSize = '16px';
            startHeading.style.fontWeight = '600';
            startHeading.textContent = 'Starting Point'; // Safe text content
            
            const startParagraph = document.createElement('p');
            startParagraph.style.margin = '0';
            startParagraph.style.color = '#4b5563';
            startParagraph.style.fontSize = '13px';
            startParagraph.textContent = 'Thomaston, GA'; // Safe text content
            
            startInfoWindowDiv.appendChild(startHeading);
            startInfoWindowDiv.appendChild(startParagraph);
            
            const startInfoWindow = new (window as any).google.maps.InfoWindow({
              content: startInfoWindowDiv
            });

            const endInfoWindowDiv = document.createElement('div');
            endInfoWindowDiv.style.maxWidth = '250px';
            endInfoWindowDiv.style.fontFamily = "'Inter', sans-serif";
            
            const endHeading = document.createElement('h3');
            endHeading.style.margin = '0 0 8px 0';
            endHeading.style.color = '#1f2937';
            endHeading.style.fontSize = '16px';
            endHeading.style.fontWeight = '600';
            endHeading.textContent = projectName; // Safe text content
            
            const endParagraph = document.createElement('p');
            endParagraph.style.margin = '0';
            endParagraph.style.color = '#4b5563';
            endParagraph.style.fontSize = '13px';
            endParagraph.textContent = destinationAddress; // Safe text content
            
            endInfoWindowDiv.appendChild(endHeading);
            endInfoWindowDiv.appendChild(endParagraph);
            
            const endInfoWindow = new (window as any).google.maps.InfoWindow({
              content: endInfoWindowDiv
            });

            startMarker.addListener('click', () => {
              endInfoWindow.close();
              startInfoWindow.open(map, startMarker);
            });

            endMarker.addListener('click', () => {
              startInfoWindow.close();
              endInfoWindow.open(map, endMarker);
            });

            setIsLoaded(true);
          } else {
            setLoadError('Failed to calculate route: ' + status);
          }
        });

      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setLoadError('Failed to load Google Maps');
      }
    };

    initializeMap();
  }, [destinationAddress, projectName]);

  if (loadError) {
    return (
      <div className={`border rounded-lg p-4 bg-gray-50 ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-sm">Unable to load route map</p>
            <p className="text-xs text-gray-400 mt-1">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="border rounded-lg overflow-hidden" style={{ height }}>
        <div 
          ref={mapRef} 
          style={{ width: '100%', height: '100%' }}
          data-testid="route-map"
        />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading route...</p>
            </div>
          </div>
        )}
      </div>
      
      {routeInfo && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{routeInfo.distance}</div>
            <div className="font-semibold text-blue-600">Distance</div>
            <div className="text-gray-600 text-sm">from Thomaston, GA</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{routeInfo.duration}</div>
            <div className="font-semibold text-green-600">Drive Time</div>
            <div className="text-gray-600 text-sm">estimated</div>
          </div>
        </div>
      )}
    </div>
  );
}