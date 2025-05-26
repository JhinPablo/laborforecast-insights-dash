
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
        console.log(`Processing ${prediction.geo}: ${prediction.predicted_labour_force}`);
        return {
          geo: prediction.geo,
          value: Number(prediction.predicted_labour_force) || 0,
          un_region: geoInfo?.un_region || 'Unknown',
          isHistorical: false
        };
      });
    }
  };

  const currentData = getCountryDataForYear(selectedYear);
  const isHistoricalView = historicalYears.length > 0 && selectedYear < transitionYear;
  
  console.log(`Current data for year ${selectedYear}:`, currentData.length, 'countries');

  const values = currentData.map(d => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  const getCountryColor = (countryCode: string) => {
    const countryData = currentData.find(d => d.geo === countryCode);
    if (!countryData || countryData.value === 0) return '#e5e7eb'; // Gray for no data
    
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

  // Helper function to format the labor force value
  const formatLaborForce = (value: number): string => {
    if (value === 0) return 'Sin datos';
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
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
        <p className="text-lg text-gray-600">Visualización geográfica realista con datos históricos y predicciones</p>
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

          {/* Realistic Europe Map */}
          <div className="relative bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-lg overflow-hidden border-2 border-blue-200">
            <svg viewBox="0 0 1200 800" className="w-full h-[700px]">
              <defs>
                <linearGradient id="seaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:"#e0f7ff", stopOpacity:1}} />
                  <stop offset="100%" style={{stopColor:"#a7f3d0", stopOpacity:1}} />
                </linearGradient>
              </defs>
              
              {/* Sea background */}
              <rect width="1200" height="800" fill="url(#seaGradient)" />
              
              {/* Norway - realistic shape */}
              <path
                d="M500 50 L520 45 L540 55 L560 70 L570 90 L580 120 L575 150 L570 180 L560 200 L550 220 L535 230 L520 225 L505 215 L495 195 L490 175 L485 155 L480 135 L475 115 L470 95 L475 75 L485 60 Z"
                fill={getCountryColor('Norway')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Norway' ? null : 'Norway')}
              />
              
              {/* Sweden - realistic shape */}
              <path
                d="M550 60 L570 55 L590 65 L605 80 L615 100 L620 125 L625 150 L630 175 L625 200 L620 225 L610 245 L595 260 L580 270 L565 275 L550 270 L540 255 L535 235 L540 215 L545 195 L550 175 L555 155 L560 135 L565 115 L570 95 L565 80 Z"
                fill={getCountryColor('Sweden')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Sweden' ? null : 'Sweden')}
              />
              
              {/* Finland */}
              <path
                d="M630 70 L660 65 L685 75 L705 90 L720 110 L730 135 L735 160 L730 185 L720 210 L705 230 L690 245 L675 255 L660 260 L645 255 L630 245 L625 225 L630 205 L635 185 L640 165 L645 145 L650 125 L655 105 L660 85 Z"
                fill={getCountryColor('Finland')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Finland' ? null : 'Finland')}
              />
              
              {/* Estonia */}
              <path
                d="M620 260 L645 255 L665 265 L680 275 L685 290 L680 305 L665 315 L645 320 L625 315 L615 300 L610 285 L615 270 Z"
                fill={getCountryColor('Estonia')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Estonia' ? null : 'Estonia')}
              />
              
              {/* Latvia */}
              <path
                d="M615 320 L640 315 L660 325 L675 335 L680 350 L675 365 L660 375 L640 380 L620 375 L610 360 L605 345 L610 330 Z"
                fill={getCountryColor('Latvia')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Latvia' ? null : 'Latvia')}
              />
              
              {/* Lithuania */}
              <path
                d="M605 380 L630 375 L650 385 L665 395 L670 410 L665 425 L650 435 L630 440 L610 435 L595 425 L590 410 L595 395 Z"
                fill={getCountryColor('Lithuania')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Lithuania' ? null : 'Lithuania')}
              />
              
              {/* Poland - larger, more realistic */}
              <path
                d="M590 440 L630 435 L670 445 L705 455 L735 465 L760 475 L785 485 L800 500 L795 525 L785 545 L770 560 L750 570 L725 575 L700 570 L675 560 L650 545 L625 530 L600 515 L580 500 L570 485 L575 470 L585 455 Z"
                fill={getCountryColor('Poland')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Poland' ? null : 'Poland')}
              />
              
              {/* Germany - central position, realistic shape */}
              <path
                d="M480 380 L520 375 L560 385 L590 395 L610 410 L620 430 L615 450 L605 470 L590 485 L570 495 L545 500 L520 495 L495 485 L475 470 L460 450 L455 430 L460 410 L470 395 Z"
                fill={getCountryColor('Germany')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Germany' ? null : 'Germany')}
              />
              
              {/* Denmark */}
              <path
                d="M500 340 L520 335 L535 345 L545 360 L540 375 L525 385 L505 390 L485 385 L475 370 L480 355 L490 345 Z"
                fill={getCountryColor('Denmark')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Denmark' ? null : 'Denmark')}
              />
              
              {/* Netherlands */}
              <path
                d="M440 380 L465 375 L480 385 L485 400 L480 415 L465 425 L445 430 L425 425 L415 410 L420 395 L430 385 Z"
                fill={getCountryColor('Netherlands')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Netherlands' ? null : 'Netherlands')}
              />
              
              {/* Belgium */}
              <path
                d="M420 430 L445 425 L465 435 L475 450 L470 465 L455 475 L435 480 L415 475 L405 460 L410 445 Z"
                fill={getCountryColor('Belgium')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Belgium' ? null : 'Belgium')}
              />
              
              {/* United Kingdom - island */}
              <path
                d="M300 350 L330 345 L355 355 L375 370 L385 390 L380 415 L370 435 L355 450 L335 460 L315 465 L295 460 L275 450 L260 435 L255 415 L260 395 L270 375 L285 360 Z"
                fill={getCountryColor('United Kingdom')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'United Kingdom' ? null : 'United Kingdom')}
              />
              
              {/* Ireland - island */}
              <path
                d="M220 380 L245 375 L265 385 L275 400 L270 420 L260 435 L245 445 L225 450 L205 445 L190 435 L185 420 L190 405 L200 390 Z"
                fill={getCountryColor('Ireland')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Ireland' ? null : 'Ireland')}
              />
              
              {/* France - larger, hexagonal shape */}
              <path
                d="M360 480 L400 475 L440 485 L470 500 L490 520 L500 545 L495 570 L485 590 L470 605 L450 615 L425 620 L400 615 L375 605 L355 590 L340 570 L335 545 L340 520 L350 500 Z"
                fill={getCountryColor('France')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'France' ? null : 'France')}
              />
              
              {/* Spain - Iberian Peninsula */}
              <path
                d="M260 580 L320 575 L375 585 L415 600 L445 620 L465 645 L475 670 L470 695 L455 715 L435 730 L410 740 L380 745 L350 740 L320 730 L290 715 L265 695 L250 670 L245 645 L250 620 L255 600 Z"
                fill={getCountryColor('Spain')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Spain' ? null : 'Spain')}
              />
              
              {/* Portugal */}
              <path
                d="M200 600 L240 595 L255 610 L265 630 L260 650 L250 670 L235 685 L220 695 L200 700 L180 695 L165 680 L160 660 L165 640 L175 620 L190 605 Z"
                fill={getCountryColor('Portugal')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Portugal' ? null : 'Portugal')}
              />
              
              {/* Italy - boot shape */}
              <path
                d="M520 520 L545 515 L570 525 L590 540 L605 560 L610 585 L605 610 L595 635 L580 655 L565 670 L550 680 L535 685 L525 695 L520 710 L525 725 L535 735 L545 745 L535 755 L520 760 L505 755 L495 745 L500 730 L505 715 L510 700 L515 685 L510 670 L505 655 L510 640 L515 625 L520 610 L525 595 L530 580 L535 565 L540 550 L535 535 Z"
                fill={getCountryColor('Italy')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Italy' ? null : 'Italy')}
              />
              
              {/* Switzerland */}
              <path
                d="M480 500 L505 495 L525 505 L535 520 L530 535 L515 545 L495 550 L475 545 L465 530 L470 515 Z"
                fill={getCountryColor('Switzerland')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Switzerland' ? null : 'Switzerland')}
              />
              
              {/* Austria */}
              <path
                d="M545 480 L580 475 L610 485 L635 495 L650 510 L645 525 L630 535 L605 540 L580 535 L555 525 L540 510 L535 495 Z"
                fill={getCountryColor('Austria')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Austria' ? null : 'Austria')}
              />
              
              {/* Czech Republic */}
              <path
                d="M580 440 L615 435 L645 445 L665 460 L670 480 L665 500 L645 515 L615 520 L585 515 L565 500 L560 480 L565 460 Z"
                fill={getCountryColor('Czechia')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Czechia' ? null : 'Czechia')}
              />
              
              {/* Slovakia */}
              <path
                d="M670 480 L705 475 L730 485 L745 500 L740 515 L725 525 L700 530 L675 525 L655 510 L650 495 L655 480 Z"
                fill={getCountryColor('Slovakia')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Slovakia' ? null : 'Slovakia')}
              />
              
              {/* Hungary */}
              <path
                d="M680 530 L715 525 L745 535 L765 550 L770 570 L765 590 L745 605 L715 610 L685 605 L660 590 L655 570 L660 550 Z"
                fill={getCountryColor('Hungary')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Hungary' ? null : 'Hungary')}
              />
              
              {/* Romania */}
              <path
                d="M770 570 L805 565 L835 575 L860 590 L875 610 L870 635 L855 655 L830 670 L800 675 L770 670 L745 655 L730 635 L735 610 L750 590 Z"
                fill={getCountryColor('Romania')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Romania' ? null : 'Romania')}
              />
              
              {/* Bulgaria */}
              <path
                d="M760 680 L795 675 L825 685 L845 700 L850 720 L845 740 L825 755 L795 760 L765 755 L740 740 L735 720 L740 700 Z"
                fill={getCountryColor('Bulgaria')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Bulgaria' ? null : 'Bulgaria')}
              />
              
              {/* Greece */}
              <path
                d="M680 720 L715 715 L745 725 L770 740 L785 760 L780 785 L765 805 L740 820 L710 825 L680 820 L655 805 L640 785 L645 760 L660 740 Z"
                fill={getCountryColor('Greece')}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCountry(selectedCountry === 'Greece' ? null : 'Greece')}
              />

              {/* Add more countries as needed... */}
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
                console.log(`Selected country ${selectedCountry} data:`, countryData);
                
                if (!countryData) {
                  return (
                    <div className="text-sm text-gray-600">
                      <div className="text-red-600 font-medium">Sin datos disponibles para este país en {selectedYear}</div>
                    </div>
                  );
                }
                
                const label = isHistoricalView ? 'Fuerza Laboral Histórica' : 'Fuerza Laboral Predicha';
                const formattedValue = formatLaborForce(countryData.value);
                
                return (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">{label}:</span>
                      <div className="font-semibold text-lg text-blue-700">
                        {formattedValue}
                      </div>
                      {countryData.value > 0 && (
                        <div className="text-xs text-gray-500">
                          Valor exacto: {countryData.value.toLocaleString()}
                        </div>
                      )}
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
                <div className="text-2xl font-bold text-blue-600">{currentData.filter(d => d.value > 0).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">
                  Total {isHistoricalView ? 'Histórico' : 'Predicho'}
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatLaborForce(currentData.reduce((sum, d) => sum + d.value, 0))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">Promedio</div>
                <div className="text-2xl font-bold text-amber-600">
                  {currentData.length > 0 ? formatLaborForce(currentData.reduce((sum, d) => sum + d.value, 0) / currentData.filter(d => d.value > 0).length) : '0'}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
