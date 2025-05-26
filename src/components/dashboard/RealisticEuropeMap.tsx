
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useCSVData } from '@/hooks/useCSVData';
import { 
  ComposableMap, 
  Geographies, 
  Geography,
  Marker
} from "react-simple-maps";
import { scaleLinear } from 'd3-scale';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { MapPin, Play, Pause, ChevronLeft, ChevronRight, TrendingUp, History } from 'lucide-react';

// Europe GeoJSON map data
const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/continents/europe.json";

interface CountryData {
  geo: string;
  latitude: number;
  longitude: number;
  labour_force: number;
  predicted_labour_force?: number;
  un_region: string;
  population?: number;
  fertility_rate?: number;
  isHistorical: boolean;
}

export const RealisticEuropeMap = () => {
  const { data: predictionsData, loading: predictionsLoading } = useCSVData('predictions.csv');
  const { data: geoData, loading: geoLoading } = useCSVData('geo_data.csv');
  
  const [laborData, setLaborData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2020);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState("");

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
  const transitionYear = Math.max(...historicalYears) + 1;

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

  const getMarkersForYear = (year: number): CountryData[] => {
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

  // Scale for circle size based on labor force
  const sizeScale = scaleLinear().domain([minValue, maxValue]).range([8, 25]);
  
  // Scale for circle color
  const colorScale = scaleLinear<string>()
    .domain([minValue, maxValue])
    .range(isHistoricalView ? ['#60A5FA', '#1E40AF'] : ['#34D399', '#059669']);

  const handleYearChange = (direction: 'prev' | 'next') => {
    const currentIndex = allYears.indexOf(selectedYear);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedYear(allYears[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < allYears.length - 1) {
      setSelectedYear(allYears[currentIndex + 1]);
    }
  };

  const handleMarkerHover = (marker: CountryData) => {
    const value = isHistoricalView ? marker.labour_force : (marker.predicted_labour_force || 0);
    const unit = isHistoricalView ? 'K' : 'M';
    const label = isHistoricalView ? 'Fuerza Laboral' : 'Predicción';
    
    setTooltipContent(
      `${marker.geo}<br/>${label}: ${(value / (isHistoricalView ? 1 : 1)).toFixed(1)}${unit}<br/>Región: ${marker.un_region}<br/>Año: ${selectedYear}`
    );
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
          Mapa Realista de Europa - Fuerza Laboral
        </CardTitle>
        <CardDescription>
          Visualización geográfica con datos históricos ({Math.min(...historicalYears)}-{Math.max(...historicalYears)}) y predicciones ({Math.min(...predictionYears)}-{Math.max(...predictionYears)})
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

        {/* Realistic Europe Map */}
        <div className="relative bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg h-[600px] overflow-hidden border-2 border-blue-200">
          <ComposableMap
            projectionConfig={{ 
              scale: 700,
              center: [10, 55] // Center on Europe
            }}
            projection="geoMercator"
            width={800}
            height={600}
            data-tooltip-id="europe-map-tooltip"
            className="w-full h-full"
          >
            {/* Europe countries */}
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#E5E7EB"
                    stroke="#9CA3AF"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "#D1D5DB", outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>
            
            {/* Data markers */}
            {currentMarkers.map((marker, i) => {
              const value = isHistoricalView ? marker.labour_force : (marker.predicted_labour_force || 0);
              return (
                <Marker 
                  key={`marker-${i}`} 
                  coordinates={[marker.longitude, marker.latitude]}
                  onMouseEnter={() => handleMarkerHover(marker)}
                  onMouseLeave={() => setTooltipContent("")}
                  onClick={() => setSelectedCountry(
                    selectedCountry === marker.geo ? null : marker.geo
                  )}
                >
                  <circle
                    r={sizeScale(value)}
                    fill={colorScale(value)}
                    opacity={0.8}
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="cursor-pointer hover:opacity-100 transition-all hover:scale-110"
                  />
                  <text
                    textAnchor="middle"
                    y={sizeScale(value) + 15}
                    className="text-xs font-semibold fill-gray-800 pointer-events-none"
                    style={{ fontSize: '10px' }}
                  >
                    {marker.geo}
                  </text>
                </Marker>
              );
            })}
          </ComposableMap>

          <ReactTooltip 
            id="europe-map-tooltip" 
            html={tooltipContent}
            className="bg-white shadow-lg border rounded-lg p-2 text-sm"
          />

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 border">
            <div className="text-sm font-semibold mb-3 text-gray-800">
              {isHistoricalView ? 'Fuerza Laboral Histórica' : 'Predicciones de Fuerza Laboral'}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full ${isHistoricalView ? 'bg-blue-400' : 'bg-green-400'}`}></div>
                <span>Menor valor</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full ${isHistoricalView ? 'bg-blue-800' : 'bg-green-600'}`}></div>
                <span>Mayor valor</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Tamaño del círculo = Magnitud del valor
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
