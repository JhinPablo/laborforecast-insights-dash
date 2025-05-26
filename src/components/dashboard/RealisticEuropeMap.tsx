
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useCSVData } from '@/hooks/useCSVData';
import { 
  ComposableMap, 
  Geographies, 
  Geography
} from "react-simple-maps";
import { scaleLinear } from 'd3-scale';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { MapPin, Play, Pause, ChevronLeft, ChevronRight, TrendingUp, History } from 'lucide-react';

// High-quality Europe GeoJSON map data
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

interface CountryData {
  geo: string;
  value: number;
  un_region: string;
  isHistorical: boolean;
}

export const RealisticEuropeMap = () => {
  const { data: predictionsData, loading: predictionsLoading } = useCSVData('predictions.csv');
  const { data: geoData, loading: geoLoading } = useCSVData('geo_data.csv');
  
  const [laborData, setLaborData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2025);
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

  // Get historical years from labor data
  const historicalYears = [...new Set(laborData.map((item: any) => item.year))].sort();
  
  // Predictions are from 2025 to 2049
  const predictionYears = Array.from({length: 25}, (_, i) => 2025 + i);
  
  // Filter prediction data to only include 2025-2049
  const filteredPredictionsData = predictionsData.filter(item => 
    item.time_period >= 2025 && item.time_period <= 2049
  );
  
  const allYears = [...new Set([...historicalYears, ...predictionYears])].sort();
  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears);
  const transitionYear = historicalYears.length > 0 ? Math.max(...historicalYears) + 1 : 2025;

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

  const getCountryDataForYear = (year: number): CountryData[] => {
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
          value: total,
          un_region: geoInfo?.un_region || 'Unknown',
          isHistorical: true
        };
      });
    } else {
      // Use prediction data (2025-2049)
      const yearData = filteredPredictionsData.filter(item => item.time_period === year);
      return yearData.map(prediction => {
        const geoInfo = geoData.find(geo => geo.geo === prediction.geo);
        return {
          geo: prediction.geo,
          value: prediction.predicted_labour_force,
          un_region: geoInfo?.un_region || 'Unknown',
          isHistorical: false
        };
      });
    }
  };

  const currentData = getCountryDataForYear(selectedYear);
  const isHistoricalView = selectedYear < transitionYear;
  
  const values = currentData.map(d => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  // Create color scale - darker colors for higher values, lighter for lower values
  const colorScale = scaleLinear<string>()
    .domain([minValue, maxValue])
    .range(isHistoricalView ? ['#dbeafe', '#1e3a8a'] : ['#dcfce7', '#14532d']); // Light to dark

  // European countries mapping for better country name matching
  const countryNameMapping: { [key: string]: string[] } = {
    'Germany': ['Germany', 'Deutschland'],
    'France': ['France', 'Francia'],
    'Italy': ['Italy', 'Italia'],
    'Spain': ['Spain', 'España'],
    'Poland': ['Poland', 'Polonia'],
    'Romania': ['Romania', 'Rumania'],
    'Netherlands': ['Netherlands', 'Holland'],
    'Belgium': ['Belgium', 'Bélgica'],
    'Czechia': ['Czech Republic', 'Czechia'],
    'Greece': ['Greece', 'Grecia'],
    'Portugal': ['Portugal'],
    'Sweden': ['Sweden', 'Suecia'],
    'Hungary': ['Hungary', 'Hungría'],
    'Austria': ['Austria'],
    'Belarus': ['Belarus', 'Bielorrusia'],
    'Switzerland': ['Switzerland', 'Suiza'],
    'Bulgaria': ['Bulgaria'],
    'Serbia': ['Serbia'],
    'Denmark': ['Denmark', 'Dinamarca'],
    'Finland': ['Finland', 'Finlandia'],
    'Slovakia': ['Slovakia', 'Eslovaquia'],
    'Norway': ['Norway', 'Noruega'],
    'Ireland': ['Ireland', 'Irlanda'],
    'Croatia': ['Croatia', 'Croacia'],
    'Bosnia and Herzegovina': ['Bosnia and Herzegovina', 'Bosnia and Herz.'],
    'Albania': ['Albania'],
    'Lithuania': ['Lithuania', 'Lituania'],
    'Slovenia': ['Slovenia', 'Eslovenia'],
    'Latvia': ['Latvia', 'Letonia'],
    'Estonia': ['Estonia'],
    'North Macedonia': ['Macedonia', 'North Macedonia'],
    'Moldova': ['Moldova'],
    'Luxembourg': ['Luxembourg', 'Luxemburgo'],
    'Malta': ['Malta'],
    'Iceland': ['Iceland', 'Islandia'],
    'Montenegro': ['Montenegro'],
    'Cyprus': ['Cyprus', 'Chipre'],
    'United Kingdom': ['United Kingdom', 'UK']
  };

  const getCountryColor = (geoProperties: any) => {
    const geoName = geoProperties.NAME || geoProperties.name || '';
    
    // Find matching country data
    let countryData = null;
    
    // First try direct match
    countryData = currentData.find(d => d.geo === geoName);
    
    // If no direct match, try the mapping
    if (!countryData) {
      for (const [standardName, variants] of Object.entries(countryNameMapping)) {
        if (variants.some(variant => 
          variant.toLowerCase() === geoName.toLowerCase() ||
          geoName.toLowerCase().includes(variant.toLowerCase()) ||
          variant.toLowerCase().includes(geoName.toLowerCase())
        )) {
          countryData = currentData.find(d => d.geo === standardName);
          break;
        }
      }
    }
    
    if (!countryData || countryData.value === 0) {
      return '#f3f4f6'; // Light gray for no data
    }
    
    return colorScale(countryData.value);
  };

  const handleYearChange = (direction: 'prev' | 'next') => {
    const currentIndex = allYears.indexOf(selectedYear);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedYear(allYears[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < allYears.length - 1) {
      setSelectedYear(allYears[currentIndex + 1]);
    }
  };

  const handleCountryHover = (geo: any) => {
    const geoName = geo.properties.NAME || geo.properties.name || '';
    
    // Find country data using the same logic as getCountryColor
    let countryData = currentData.find(d => d.geo === geoName);
    
    if (!countryData) {
      for (const [standardName, variants] of Object.entries(countryNameMapping)) {
        if (variants.some(variant => 
          variant.toLowerCase() === geoName.toLowerCase() ||
          geoName.toLowerCase().includes(variant.toLowerCase()) ||
          variant.toLowerCase().includes(geoName.toLowerCase())
        )) {
          countryData = currentData.find(d => d.geo === standardName);
          break;
        }
      }
    }
    
    if (countryData) {
      const unit = isHistoricalView ? 'K' : 'M';
      const label = isHistoricalView ? 'Fuerza Laboral' : 'Predicción';
      
      setTooltipContent(
        `${geoName}<br/>${label}: ${(countryData.value / (isHistoricalView ? 1000 : 1)).toFixed(1)}${unit}<br/>Región: ${countryData.un_region}<br/>Año: ${selectedYear}`
      );
    } else {
      setTooltipContent(`${geoName}<br/>Sin datos para ${selectedYear}`);
    }
  };

  // European countries filter
  const europeanCountries = [
    'Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina',
    'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Czech Republic', 'Denmark', 'Estonia', 'Finland',
    'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy',
    'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta',
    'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Macedonia', 'Norway',
    'Poland', 'Portugal', 'Romania', 'San Marino', 'Serbia', 'Slovakia',
    'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Ukraine', 'United Kingdom'
  ];

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
          Mapa de Europa - Fuerza Laboral
        </CardTitle>
        <CardDescription>
          Visualización por color de países - tonos más oscuros indican mayor fuerza laboral
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
                  <span className="text-sm font-medium text-green-600">Predicciones (2025-2049)</span>
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
              <span className="text-xs text-gray-400">Predicciones: 2025-2049</span>
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

        {/* Europe Map with Country Coloring */}
        <div className="relative bg-gradient-to-b from-slate-50 to-slate-100 rounded-lg h-[600px] overflow-hidden border shadow-lg">
          <ComposableMap
            projectionConfig={{ 
              scale: 800,
              center: [10, 54] // Centered on Europe
            }}
            projection="geoMercator"
            width={800}
            height={600}
            data-tooltip-id="europe-map-tooltip"
            className="w-full h-full"
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies
                  .filter(geo => {
                    const countryName = geo.properties?.NAME || geo.properties?.name || '';
                    return europeanCountries.some(country => 
                      countryName.toLowerCase().includes(country.toLowerCase()) ||
                      country.toLowerCase().includes(countryName.toLowerCase())
                    );
                  })
                  .map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getCountryColor(geo.properties)}
                      stroke="#ffffff"
                      strokeWidth={1}
                      onMouseEnter={() => handleCountryHover(geo)}
                      onMouseLeave={() => setTooltipContent("")}
                      onClick={() => {
                        const geoName = geo.properties.NAME || geo.properties.name || '';
                        setSelectedCountry(selectedCountry === geoName ? null : geoName);
                      }}
                      style={{
                        default: { 
                          outline: "none",
                          transition: 'all 0.3s ease',
                          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
                        },
                        hover: { 
                          outline: "none",
                          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2)) brightness(1.1)',
                          transform: 'scale(1.02)'
                        },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
              }
            </Geographies>
          </ComposableMap>

          <ReactTooltip 
            id="europe-map-tooltip" 
            html={tooltipContent}
            className="bg-white shadow-xl border rounded-lg p-3 text-sm"
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              borderColor: '#E8EAED'
            }}
          />

          {/* Enhanced Legend */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-gray-200">
            <div className="text-sm font-semibold mb-3 text-gray-800">
              {isHistoricalView ? 'Fuerza Laboral Histórica' : 'Predicciones de Fuerza Laboral'}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 ${isHistoricalView ? 'bg-blue-100' : 'bg-green-100'}`}></div>
                <span>Menor fuerza laboral</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 ${isHistoricalView ? 'bg-blue-400' : 'bg-green-400'}`}></div>
                <span>Fuerza laboral media</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 ${isHistoricalView ? 'bg-blue-700' : 'bg-green-700'}`}></div>
                <span>Mayor fuerza laboral</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 bg-gray-200"></div>
                <span>Sin datos</span>
              </div>
            </div>
          </div>

          {/* Map Title */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md border border-gray-200">
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
              // Find country data using the same logic
              let countryData = currentData.find(d => d.geo === selectedCountry);
              
              if (!countryData) {
                for (const [standardName, variants] of Object.entries(countryNameMapping)) {
                  if (variants.some(variant => 
                    variant.toLowerCase() === selectedCountry.toLowerCase() ||
                    selectedCountry.toLowerCase().includes(variant.toLowerCase()) ||
                    variant.toLowerCase().includes(selectedCountry.toLowerCase())
                  )) {
                    countryData = currentData.find(d => d.geo === standardName);
                    break;
                  }
                }
              }
              
              if (!countryData) {
                return (
                  <div className="text-sm text-red-600">
                    Sin datos disponibles para este país en {selectedYear}
                  </div>
                );
              }
              
              const unit = isHistoricalView ? 'K' : 'M';
              const label = isHistoricalView ? 'Fuerza Laboral Histórica' : 'Fuerza Laboral Predicha';
              
              return (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">{label}:</span>
                    <div className="font-semibold text-lg text-blue-700">
                      {(countryData.value / (isHistoricalView ? 1000 : 1)).toFixed(1)}{unit}
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
              <div className="text-2xl font-bold text-blue-600">{currentData.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">
                Total {isHistoricalView ? 'Histórico' : 'Predicho'}
              </div>
              <div className="text-2xl font-bold text-green-600">
                {(currentData.reduce((sum, d) => sum + d.value, 0) / (isHistoricalView ? 1000 : 1)).toFixed(1)}{isHistoricalView ? 'K' : 'M'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Promedio</div>
              <div className="text-2xl font-bold text-amber-600">
                {currentData.length > 0 ? 
                  ((currentData.reduce((sum, d) => sum + d.value, 0) / currentData.length) / (isHistoricalView ? 1000 : 1)).toFixed(1) : 
                  '0'
                }{isHistoricalView ? 'K' : 'M'}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
