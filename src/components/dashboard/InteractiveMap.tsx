
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useCSVData } from '@/hooks/useCSVData';
import { MapPin, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

interface CountryMarker {
  geo: string;
  latitude: number;
  longitude: number;
  predicted_labour_force: number;
  un_region: string;
}

export const InteractiveMap = () => {
  const { data: predictionsData, loading: predictionsLoading } = useCSVData('predictions.csv');
  const { data: geoData, loading: geoLoading } = useCSVData('geo_data.csv');
  
  const [selectedYear, setSelectedYear] = useState(2025);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const years = [...new Set(predictionsData.map(item => item.time_period))].sort();
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && years.length > 0) {
      interval = setInterval(() => {
        setSelectedYear(prev => {
          const currentIndex = years.indexOf(prev);
          const nextIndex = currentIndex + 1;
          return nextIndex >= years.length ? years[0] : years[nextIndex];
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, years]);

  const getMarkersForYear = (year: number): CountryMarker[] => {
    const yearData = predictionsData.filter(item => item.time_period === year);
    return yearData.map(prediction => {
      const geoInfo = geoData.find(geo => geo.geo === prediction.geo);
      return {
        geo: prediction.geo,
        latitude: geoInfo?.latitude || 0,
        longitude: geoInfo?.longitude || 0,
        predicted_labour_force: prediction.predicted_labour_force,
        un_region: geoInfo?.un_region || 'Unknown'
      };
    }).filter(marker => marker.latitude !== 0 && marker.longitude !== 0);
  };

  const currentMarkers = getMarkersForYear(selectedYear);
  const maxValue = Math.max(...currentMarkers.map(m => m.predicted_labour_force));
  const minValue = Math.min(...currentMarkers.map(m => m.predicted_labour_force));

  const getMarkerSize = (value: number) => {
    const normalized = (value - minValue) / (maxValue - minValue);
    return Math.max(8, normalized * 40);
  };

  const getMarkerColor = (value: number) => {
    const normalized = (value - minValue) / (maxValue - minValue);
    if (normalized > 0.7) return '#059669'; // green-600
    if (normalized > 0.4) return '#d97706'; // amber-600
    return '#dc2626'; // red-600
  };

  const handleYearChange = (direction: 'prev' | 'next') => {
    const currentIndex = years.indexOf(selectedYear);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedYear(years[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < years.length - 1) {
      setSelectedYear(years[currentIndex + 1]);
    }
  };

  if (predictionsLoading || geoLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Interactive Labor Force Prediction Map
        </CardTitle>
        <CardDescription>
          Explore predicted labor force across European countries over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Time Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleYearChange('prev')}
                disabled={years.indexOf(selectedYear) === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleYearChange('next')}
                disabled={years.indexOf(selectedYear) === years.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{selectedYear}</div>
              <div className="text-sm text-gray-600">Selected Year</div>
            </div>
          </div>

          {/* Year Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{minYear}</span>
              <span>{maxYear}</span>
            </div>
            <Slider
              value={[selectedYear]}
              onValueChange={(value) => setSelectedYear(value[0])}
              min={minYear}
              max={maxYear}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Map Container */}
        <div className="relative bg-gray-50 rounded-lg h-96 overflow-hidden border">
          {/* SVG Map */}
          <svg 
            viewBox="0 0 800 600" 
            className="w-full h-full"
            style={{ transform: 'scale(1.2) translate(-50px, -20px)' }}
          >
            {/* Background */}
            <rect width="800" height="600" fill="#f8fafc" />
            
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="800" height="600" fill="url(#grid)" />
            
            {/* Country markers */}
            {currentMarkers.map((marker, index) => {
              // Convert lat/lng to SVG coordinates (simplified projection)
              const x = ((marker.longitude + 180) / 360) * 800;
              const y = ((90 - marker.latitude) / 180) * 600;
              const size = getMarkerSize(marker.predicted_labour_force);
              const color = getMarkerColor(marker.predicted_labour_force);
              
              return (
                <g key={`${marker.geo}-${index}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r={size / 2}
                    fill={color}
                    fillOpacity={0.7}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-pointer hover:fillOpacity-100 transition-all"
                    onClick={() => setSelectedCountry(
                      selectedCountry === marker.geo ? null : marker.geo
                    )}
                  />
                  <text
                    x={x}
                    y={y + size / 2 + 12}
                    textAnchor="middle"
                    className="text-xs font-medium fill-gray-700"
                    style={{ fontSize: '10px' }}
                  >
                    {marker.geo}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
            <div className="text-sm font-medium mb-2">Labor Force Scale</div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span>Low</span>
              <div className="w-3 h-3 rounded-full bg-amber-600"></div>
              <span>Medium</span>
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span>High</span>
            </div>
          </div>
        </div>

        {/* Selected Country Info */}
        {selectedCountry && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{selectedCountry}</h3>
            {(() => {
              const countryData = currentMarkers.find(m => m.geo === selectedCountry);
              if (!countryData) return null;
              
              return (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Predicted Labor Force:</span>
                    <div className="font-semibold text-lg">
                      {countryData.predicted_labour_force.toFixed(1)}M
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Region:</span>
                    <div className="font-medium">{countryData.un_region}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Coordinates:</span>
                    <div className="font-mono text-xs">
                      {countryData.latitude.toFixed(2)}, {countryData.longitude.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Year:</span>
                    <div className="font-medium">{selectedYear}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Statistics */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Countries</div>
              <div className="text-2xl font-bold">{currentMarkers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Predicted</div>
              <div className="text-2xl font-bold">
                {currentMarkers.reduce((sum, m) => sum + m.predicted_labour_force, 0).toFixed(1)}M
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Average</div>
              <div className="text-2xl font-bold">
                {(currentMarkers.reduce((sum, m) => sum + m.predicted_labour_force, 0) / currentMarkers.length).toFixed(1)}M
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
