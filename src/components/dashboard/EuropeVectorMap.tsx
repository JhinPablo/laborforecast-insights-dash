
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useCSVData } from '@/hooks/useCSVData';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Play, Pause, ChevronLeft, ChevronRight, TrendingUp, History } from 'lucide-react';

interface CountryData {
  geo: string;
  value: number;
  un_region: string;
  isHistorical: boolean;
}

export const EuropeVectorMap = () => {
  const { data: predictionsData, loading: predictionsLoading } = useCSVData('predictions.csv');
  const { data: geoData, loading: geoLoading } = useCSVData('geo_data.csv');
  
  const [laborData, setLaborData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2025);
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

  // Get available years - prioritize predictions data since historical data might be empty
  const predictionYears = [...new Set(predictionsData.map(item => item.time_period))].sort();
  const historicalYears = [...new Set(laborData.map((item: any) => item.year))].sort();
  
  // If no historical data, use only prediction years
  const allYears = historicalYears.length > 0 
    ? [...new Set([...historicalYears, ...predictionYears])].sort()
    : predictionYears;
  
  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears);
  const transitionYear = historicalYears.length > 0 ? Math.max(...historicalYears) + 1 : Math.min(...predictionYears);

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
    const isHistorical = historicalYears.length > 0 && year < transitionYear;
    
    if (isHistorical) {
      const yearData = laborData.filter((item: any) => item.year === year);
      
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
      // Use predictions data
      const yearData = predictionsData.filter(item => item.time_period === year);
      console.log(`Prediction data for year ${year}:`, yearData.length, 'countries');
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
  const isHistoricalView = historicalYears.length > 0 && selectedYear < transitionYear;
  
  console.log(`Current data for year ${selectedYear}:`, currentData.length, 'countries');
  console.log('Countries with data:', currentData.map(d => d.geo));

  const values = currentData.map(d => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  const getCountryColor = (countryCode: string) => {
    const countryData = currentData.find(d => d.geo === countryCode);
    if (!countryData) return '#e5e7eb'; // Gray for no data
    
    const normalized = maxValue === minValue ? 0.5 : (countryData.value - minValue) / (maxValue - minValue);
    
    if (isHistoricalView) {
      // Blue gradient for historical data
      if (normalized > 0.8) return '#1e3a8a'; // blue-900
      if (normalized > 0.6) return '#1e40af'; // blue-800
      if (normalized > 0.4) return '#3b82f6'; // blue-600
      if (normalized > 0.2) return '#60a5fa'; // blue-400
      return '#dbeafe'; // blue-100
    } else {
      // Green gradient for predictions
      if (normalized > 0.8) return '#14532d'; // green-900
      if (normalized > 0.6) return '#166534'; // green-800
      if (normalized > 0.4) return '#16a34a'; // green-600
      if (normalized > 0.2) return '#4ade80'; // green-400
      return '#dcfce7'; // green-100
    }
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mapa de Fuerza Laboral Europea</h1>
        <p className="text-lg text-gray-600">Visualización geográfica con datos históricos y predicciones</p>
      </div>

      {/* Interactive Europe Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Participación de Fuerza Laboral por País
          </CardTitle>
          <CardDescription>
            {historicalYears.length > 0 
              ? `Datos históricos (${Math.min(...historicalYears)}-${Math.max(...historicalYears)}) y predicciones (${Math.min(...predictionYears)}-${Math.max(...predictionYears)})`
              : `Predicciones (${Math.min(...predictionYears)}-${Math.max(...predictionYears)})`
            }
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
                {historicalYears.length > 0 ? `Transición en ${transitionYear}` : 'Solo predicciones disponibles'}
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
                {historicalYears.length > 0 && (
                  <span className="text-xs text-gray-400">Transición: {transitionYear}</span>
                )}
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

          {/* Europe Vector Map */}
          <div className="relative bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-lg overflow-hidden border-2 border-blue-200">
            <svg viewBox="0 0 1000 600" className="w-full h-96">
              {/* Germany */}
              <path
                d="M520 280 L540 270 L560 280 L565 300 L555 320 L535 325 L515 315 L510 295 Z"
                fill={getCountryColor('Germany')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Germany' ? null : 'Germany')}
              />
              
              {/* France */}
              <path
                d="M480 320 L500 310 L515 315 L510 340 L495 350 L475 345 L465 330 Z"
                fill={getCountryColor('France')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'France' ? null : 'France')}
              />
              
              {/* Spain */}
              <path
                d="M450 370 L490 365 L495 385 L480 400 L440 405 L430 385 Z"
                fill={getCountryColor('Spain')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Spain' ? null : 'Spain')}
              />
              
              {/* Italy */}
              <path
                d="M540 350 L560 340 L565 380 L555 420 L545 430 L535 410 L530 375 Z"
                fill={getCountryColor('Italy')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Italy' ? null : 'Italy')}
              />
              
              {/* United Kingdom */}
              <path
                d="M460 240 L480 235 L485 255 L475 270 L455 275 L445 260 Z"
                fill={getCountryColor('United Kingdom')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'United Kingdom' ? null : 'United Kingdom')}
              />
              
              {/* Poland */}
              <path
                d="M580 260 L610 255 L620 275 L615 295 L595 300 L575 285 Z"
                fill={getCountryColor('Poland')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Poland' ? null : 'Poland')}
              />
              
              {/* Netherlands */}
              <path
                d="M505 260 L520 255 L525 270 L515 275 L500 270 Z"
                fill={getCountryColor('Netherlands')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Netherlands' ? null : 'Netherlands')}
              />
              
              {/* Belgium */}
              <path
                d="M495 275 L510 270 L515 285 L505 290 L490 285 Z"
                fill={getCountryColor('Belgium')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Belgium' ? null : 'Belgium')}
              />
              
              {/* Sweden */}
              <path
                d="M560 180 L580 175 L590 210 L585 240 L570 245 L555 220 Z"
                fill={getCountryColor('Sweden')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Sweden' ? null : 'Sweden')}
              />
              
              {/* Norway */}
              <path
                d="M540 160 L560 155 L570 190 L560 210 L545 205 L535 175 Z"
                fill={getCountryColor('Norway')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Norway' ? null : 'Norway')}
              />
              
              {/* Finland */}
              <path
                d="M590 150 L620 145 L630 180 L625 200 L605 205 L590 185 Z"
                fill={getCountryColor('Finland')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Finland' ? null : 'Finland')}
              />
              
              {/* Austria */}
              <path
                d="M540 310 L565 305 L570 320 L555 325 L535 320 Z"
                fill={getCountryColor('Austria')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Austria' ? null : 'Austria')}
              />
              
              {/* Switzerland */}
              <path
                d="M520 325 L535 320 L540 335 L525 340 L515 335 Z"
                fill={getCountryColor('Switzerland')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Switzerland' ? null : 'Switzerland')}
              />
              
              {/* Czechia */}
              <path
                d="M565 285 L585 280 L590 295 L575 300 L560 295 Z"
                fill={getCountryColor('Czechia')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Czechia' ? null : 'Czechia')}
              />
              
              {/* Hungary */}
              <path
                d="M590 310 L610 305 L615 320 L600 325 L585 320 Z"
                fill={getCountryColor('Hungary')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Hungary' ? null : 'Hungary')}
              />
              
              {/* Romania */}
              <path
                d="M620 320 L650 315 L660 340 L645 350 L625 345 L615 335 Z"
                fill={getCountryColor('Romania')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Romania' ? null : 'Romania')}
              />
              
              {/* Bulgaria */}
              <path
                d="M630 350 L655 345 L665 365 L650 370 L635 365 Z"
                fill={getCountryColor('Bulgaria')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Bulgaria' ? null : 'Bulgaria')}
              />
              
              {/* Greece */}
              <path
                d="M620 380 L645 375 L655 395 L640 405 L625 400 Z"
                fill={getCountryColor('Greece')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Greece' ? null : 'Greece')}
              />
              
              {/* Portugal */}
              <path
                d="M420 370 L440 365 L445 390 L430 395 L415 390 Z"
                fill={getCountryColor('Portugal')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Portugal' ? null : 'Portugal')}
              />
              
              {/* Denmark */}
              <path
                d="M540 235 L555 230 L560 245 L545 250 L535 245 Z"
                fill={getCountryColor('Denmark')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Denmark' ? null : 'Denmark')}
              />
              
              {/* Ireland */}
              <path
                d="M430 260 L445 255 L450 275 L435 280 L425 275 Z"
                fill={getCountryColor('Ireland')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Ireland' ? null : 'Ireland')}
              />

              {/* Cyprus */}
              <path
                d="M690 370 L710 365 L715 380 L705 385 L695 380 Z"
                fill={getCountryColor('Cyprus')}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Cyprus' ? null : 'Cyprus')}
              />

              {/* Country labels */}
              <text x="530" y="295" textAnchor="middle" className="text-xs font-medium fill-gray-700 pointer-events-none">DE</text>
              <text x="490" y="335" textAnchor="middle" className="text-xs font-medium fill-gray-700 pointer-events-none">FR</text>
              <text x="470" y="385" textAnchor="middle" className="text-xs font-medium fill-gray-700 pointer-events-none">ES</text>
              <text x="550" y="385" textAnchor="middle" className="text-xs font-medium fill-gray-700 pointer-events-none">IT</text>
              <text x="470" y="255" textAnchor="middle" className="text-xs font-medium fill-gray-700 pointer-events-none">UK</text>
              <text x="595" y="280" textAnchor="middle" className="text-xs font-medium fill-gray-700 pointer-events-none">PL</text>
              <text x="575" y="305" textAnchor="middle" className="text-xs font-medium fill-gray-700 pointer-events-none">CZ</text>
              <text x="600" y="315" textAnchor="middle" className="text-xs font-medium fill-gray-700 pointer-events-none">HU</text>
              <text x="645" y="335" textAnchor="middle" className="text-xs font-medium fill-gray-700 pointer-events-none">RO</text>
              <text x="650" y="360" textAnchor="middle" className="text-xs font-medium fill-gray-700 pointer-events-none">BG</text>
              <text x="555" y="315" textAnchor="middle" className="text-xs font-medium fill-gray-700 pointer-events-none">AT</text>
              <text x="512" y="265" textAnchor="middle" className="text-xs font-medium fill-gray-700 pointer-events-none">NL</text>
              <text x="502" y="282" textAnchor="middle" className="text-xs font-medium fill-gray-700 pointer-events-none">BE</text>
              <text x="705" y="375" textAnchor="middle" className="text-xs font-medium fill-gray-700 pointer-events-none">CY</text>
            </svg>

            {/* Enhanced Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-gray-200">
              <div className="text-sm font-semibold mb-3 text-gray-800">
                Fuerza laboral predicha
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-4 h-4 ${isHistoricalView ? 'bg-blue-100' : 'bg-green-100'}`}></div>
                  <span>Baja</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-4 h-4 ${isHistoricalView ? 'bg-blue-400' : 'bg-green-400'}`}></div>
                  <span>Media</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-4 h-4 ${isHistoricalView ? 'bg-blue-600' : 'bg-green-600'}`}></div>
                  <span>Alta</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-4 h-4 ${isHistoricalView ? 'bg-blue-900' : 'bg-green-900'}`}></div>
                  <span>Muy Alta</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 bg-gray-200"></div>
                  <span>Sin datos</span>
                </div>
              </div>
            </div>

            {/* Map Title */}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200">
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
                const countryData = currentData.find(d => d.geo === selectedCountry);
                if (!countryData) {
                  return (
                    <div className="text-sm text-gray-600">
                      <div className="text-red-600 font-medium">Sin datos disponibles para este año</div>
                    </div>
                  );
                }
                
                const label = isHistoricalView ? 'Fuerza Laboral Histórica' : 'Fuerza Laboral Predicha';
                
                return (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">{label}:</span>
                      <div className="font-semibold text-lg text-blue-700">
                        {(countryData.value / 1000000).toFixed(1)}M
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
                <div className="text-sm text-gray-600">Países con Datos</div>
                <div className="text-2xl font-bold text-blue-600">{currentData.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">
                  Total {isHistoricalView ? 'Histórico' : 'Predicho'}
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {(currentData.reduce((sum, d) => sum + d.value, 0) / 1000000).toFixed(0)}M
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">Promedio</div>
                <div className="text-2xl font-bold text-amber-600">
                  {currentData.length > 0 ? (currentData.reduce((sum, d) => sum + d.value, 0) / currentData.length / 1000000).toFixed(1) : '0'}M
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
