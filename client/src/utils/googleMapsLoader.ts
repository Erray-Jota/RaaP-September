// Global singleton to manage Google Maps API loading
class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private loadPromise: Promise<void> | null = null;
  private isLoaded = false;
  private apiKey: string | null = null;

  private constructor() {}

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  async loadGoogleMaps(): Promise<void> {
    // If already loaded, return immediately
    if (this.isLoaded && (window as any).google && (window as any).google.maps) {
      return Promise.resolve();
    }

    // If currently loading, return the existing promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Start loading process
    this.loadPromise = this.doLoad();
    return this.loadPromise;
  }

  private async doLoad(): Promise<void> {
    try {
      // Fetch API key if not already cached
      if (!this.apiKey) {
        const response = await fetch('/api/config/maps');
        if (!response.ok) {
          throw new Error('Failed to fetch API key');
        }
        const config = await response.json();
        
        if (!config.apiKey) {
          throw new Error('Google Maps API key not configured');
        }
        this.apiKey = config.apiKey;
      }

      // Check if script already exists and remove it to start fresh
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.remove();
      }

      // Create new script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;

      return new Promise<void>((resolve, reject) => {
        script.onload = () => {
          this.isLoaded = true;
          this.loadPromise = null;
          resolve();
        };
        
        script.onerror = () => {
          this.loadPromise = null;
          reject(new Error('Failed to load Google Maps API'));
        };

        document.head.appendChild(script);
      });
    } catch (error) {
      this.loadPromise = null;
      throw error;
    }
  }

  isGoogleMapsLoaded(): boolean {
    return this.isLoaded && (window as any).google && (window as any).google.maps;
  }
}

export default GoogleMapsLoader.getInstance();