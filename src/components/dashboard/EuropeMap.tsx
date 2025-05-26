
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useCSVData } from '@/hooks/useCSVData';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Play, Pause, ChevronLeft, ChevronRight, TrendingUp, History } from 'lucide-react';

interface CountryMarker {
  geo: string;
  latitude: number;
  longitude: number;
  labour_force: number;
  predicted_labour_force?: number;
  un_region: string;
  isHistorical: boolean;
}

export const EuropeMap = () => {
  const { data: predictionsData, loading: predictionsLoading } = useCSVData('predictions.csv');
  const { data: geoData, loading: geoLoading } = useCSVData('geo_data.csv');
  
  const [laborData, setLaborData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2020);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => {
    fetchLaborData();
  }, []);

  const fetchLaborData = async () => {
    try {
      const { data: labor } = await supabase
        .from('labor')
        .select('*')
        .order('year');
      
      console.log('Labor data fetched:', labor?.length || 0);
      setLaborData(labor || []);
    } catch (error) {
      console.error('Error fetching labor data:', error);
    }
  };

  // Combine historical and prediction years
  const historicalYears = [...new Set(laborData.map((item: any) => item.year))].sort();
  const predictionYears = [...new Set(predictionsData.map(item => item.time_period))].sort();
  const allYears = [...new Set([...historicalYears, ...predictionYears])].sort();
  
  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears);
  const transitionYear = Math.max(...historicalYears) + 1; // First prediction year

  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && allYears.length > 0) {
      interval = setInterval(() => {
        setSelectedYear(prev => {
          const currentIndex = allYears.indexOf(prev);
          const nextIndex = currentIndex + 1;
          return nextIndex >= allYears.length ? allYears[0] : allYears[nextIndex];
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, allYears]);

  const getMarkersForYear = (year: number): CountryMarker[] => {
    const isHistorical = year < transitionYear;
    
    if (isHistorical) {
      // Use historical labor data
      const yearData = laborData.filter((item: any) => item.year === year);
      
      // Group by country and sum male/female data
      const countryTotals = yearData.reduce((acc: any, item: any) => {
        const country = item.geo;
        if (!acc[country]) {
          acc[country] = 0;
        }
        acc[country] += item.labour_force || 0;
        return acc;
      }, {});

      return Object.entries(countryTotals).map(([country, total]: any) => {
        const geoInfo = geoData.find(geo => geo.geo === country);
        return {
          geo: country,
          latitude: geoInfo?.latitude || 0,
          longitude: geoInfo?.longitude || 0,
          labour_force: total,
          un_region: geoInfo?.un_region || 'Unknown',
          isHistorical: true
        };
      }).filter(marker => marker.latitude !== 0 && marker.longitude !== 0);
    } else {
      // Use prediction data
      const yearData = predictionsData.filter(item => item.time_period === year);
      return yearData.map(prediction => {
        const geoInfo = geoData.find(geo => geo.geo === prediction.geo);
        return {
          geo: prediction.geo,
          latitude: geoInfo?.latitude || 0,
          longitude: geoInfo?.longitude || 0,
          labour_force: 0,
          predicted_labour_force: prediction.predicted_labour_force,
          un_region: geoInfo?.un_region || 'Unknown',
          isHistorical: false
        };
      }).filter(marker => marker.latitude !== 0 && marker.longitude !== 0);
    }
  };

  const currentMarkers = getMarkersForYear(selectedYear);
  const isHistoricalView = selectedYear < transitionYear;
  
  const values = currentMarkers.map(m => 
    isHistoricalView ? m.labour_force : (m.predicted_labour_force || 0)
  );
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  const getMarkerSize = (value: number) => {
    if (maxValue === minValue) return 15;
    const normalized = (value - minValue) / (maxValue - minValue);
    return Math.max(8, normalized * 30);
  };

  const getMarkerColor = (value: number) => {
    if (maxValue === minValue) return '#3B82F6';
    const normalized = (value - minValue) / (maxValue - minValue);
    
    if (isHistoricalView) {
      // Blue tones for historical data
      if (normalized > 0.7) return '#1E40AF'; // blue-800
      if (normalized > 0.4) return '#3B82F6'; // blue-600
      return '#60A5FA'; // blue-400
    } else {
      // Green tones for predictions
      if (normalized > 0.7) return '#059669'; // green-600
      if (normalized > 0.4) return '#10B981'; // green-500
      return '#34D399'; // green-400
    }
  };

  // Convert lat/lng to SVG coordinates for Europe-focused projection
  const projectToEurope = (lat: number, lng: number) => {
    const minLat = 35, maxLat = 71;
    const minLng = -11, maxLng = 40;
    
    const clampedLat = Math.max(minLat, Math.min(maxLat, lat));
    const clampedLng = Math.max(minLng, Math.min(maxLng, lng));
    
    const x = ((clampedLng - minLng) / (maxLng - minLng)) * 800;
    const y = ((maxLat - clampedLat) / (maxLat - minLat)) * 600;
    
    return { x, y };
  };

  const handleYearChange = (direction: 'prev' | 'next') => {
    const currentIndex = allYears.indexOf(selectedYear);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedYear(allYears[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < allYears.length - 1) {
      setSelectedYear(allYears[currentIndex + 1]);
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
          Mapa Temporal de Fuerza Laboral Europea
        </CardTitle>
        <CardDescription>
          Datos históricos ({Math.min(...historicalYears)}-{Math.max(...historicalYears)}) y predicciones ({Math.min(...predictionYears)}-{Math.max(...predictionYears)})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Data Type Indicator */}
        <div className="mb-4 p-3 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isHistoricalView ? (
                <>
                  <History className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Datos Históricos</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Predicciones</span>
                </>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Transición en {transitionYear}
            </div>
          </div>
        </div>

        {/* Time Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleYearChange('prev')}
                disabled={allYears.indexOf(selectedYear) === 0}
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
                disabled={allYears.indexOf(selectedYear) === allYears.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{selectedYear}</div>
              <div className="text-sm text-gray-600">
                {isHistoricalView ? 'Datos Históricos' : 'Predicción'}
              </div>
            </div>
          </div>

          {/* Year Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{minYear}</span>
              <span className="text-xs text-gray-400">Transición: {transitionYear}</span>
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

        {/* Europe Map Container */}
        <div className="relative bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg h-96 overflow-hidden border-2 border-blue-200">
          <svg viewBox="0 0 800 600" className="w-full h-full">
            {/* Background */}
            <defs>
              <linearGradient id="europeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:"#e0f2fe", stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:"#bae6fd", stopOpacity:1}} />
              </linearGradient>
              <pattern id="europeGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            
            <rect width="800" height="600" fill="url(#europeGrid)" />
            <rect width="800" height="600" fill="url(#europeGradient)" opacity="0.7" />
            
            {/* Country markers */}
            {currentMarkers.map((marker, index) => {
              const { x, y } = projectToEurope(marker.latitude, marker.longitude);
              const value = isHistoricalView ? marker.labour_force : (marker.predicted_labour_force || 0);
              const size = getMarkerSize(value);
              const color = getMarkerColor(value);
              
              return (
                <g key={`${marker.geo}-${index}`}>
                  {/* Marker shadow */}
                  <circle
                    cx={x + 1}
                    cy={y + 1}
                    r={size / 2}
                    fill="rgba(0,0,0,0.2)"
                  />
                  {/* Main marker */}
                  <circle
                    cx={x}
                    cy={y}
                    r={size / 2}
                    fill={color}
                    fillOpacity={0.8}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-pointer hover:fillOpacity-100 transition-all hover:scale-110"
                    onClick={() => setSelectedCountry(
                      selectedCountry === marker.geo ? null : marker.geo
                    )}
                  />
                  {/* Country label */}
                  <text
                    x={x}
                    y={y + size / 2 + 15}
                    textAnchor="middle"
                    className="text-xs font-semibold fill-gray-800 pointer-events-none"
                    style={{ fontSize: '10px' }}
                  >
                    {marker.geo}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 border">
            <div className="text-sm font-semibold mb-3 text-gray-800">
              {isHistoricalView ? 'Fuerza Laboral Histórica' : 'Predicciones de Fuerza Laboral'}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full ${isHistoricalView ? 'bg-blue-400' : 'bg-green-400'}`}></div>
                <span>Baja ({(minValue / (isHistoricalView ? 1 : 1)).toFixed(1)}{isHistoricalView ? 'K' : 'M'})</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full ${isHistoricalView ? 'bg-blue-600' : 'bg-green-500'}`}></div>
                <span>Media</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full ${isHistoricalView ? 'bg-blue-800' : 'bg-green-600'}`}></div>
                <span>Alta ({(maxValue / (isHistoricalView ? 1 : 1)).toFixed(1)}{isHistoricalView ? 'K' : 'M'})</span>
              </div>
            </div>
          </div>

          {/* Map Title */}
          <div className="absolute top-4 left-4 bg-white/90 rounded-lg px-3 py-2 shadow-md">
            <div className="text-sm font-semibold text-gray-800">Europa - {selectedYear}</div>
            <div className="text-xs text-gray-600">
              {isHistoricalView ? 'Datos Reales' : 'Predicción'}
            </div>
          </div>
        </div>

        {/* Selected Country Info */}
        {selectedCountry && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-lg mb-2 text-blue-900">{selectedCountry}</h3>
            {(() => {
              const countryData = currentMarkers.find(m => m.geo === selectedCountry);
              if (!countryData) return null;
              
              const value = isHistoricalView ? countryData.labour_force : (countryData.predicted_labour_force || 0);
              const unit = isHistoricalView ? 'K' : 'M';
              const label = isHistoricalView ? 'Fuerza Laboral Histórica' : 'Fuerza Laboral Predicha';
              
              return (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">{label}:</span>
                    <div className="font-semibold text-lg text-blue-700">
                      {(value / (isHistoricalView ? 1 : 1)).toFixed(1)}{unit}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Región:</span>
                    <div className="font-medium text-gray-800">{countryData.un_region}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Tipo de Datos:</span>
                    <div className="font-medium text-gray-800">
                      {isHistoricalView ? 'Históricos' : 'Predicción'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Año:</span>
                    <div className="font-medium text-gray-800">{selectedYear}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Statistics Summary */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Países</div>
              <div className="text-2xl font-bold text-blue-600">{currentMarkers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">
                Total {isHistoricalView ? 'Histórico' : 'Predicho'}
              </div>
              <div className="text-2xl font-bold text-green-600">
                {currentMarkers.reduce((sum, m) => {
                  const value = isHistoricalView ? m.labour_force : (m.predicted_labour_force || 0);
                  return sum + value;
                }, 0).toFixed(1)}{isHistoricalView ? 'K' : 'M'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Promedio</div>
              <div className="text-2xl font-bold text-amber-600">
                {(currentMarkers.reduce((sum, m) => {
                  const value = isHistoricalView ? m.labour_force : (m.predicted_labour_force || 0);
                  return sum + value;
                }, 0) / currentMarkers.length).toFixed(1)}{isHistoricalView ? 'K' : 'M'}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
