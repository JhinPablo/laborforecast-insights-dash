
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCSVData } from '@/hooks/useCSVData';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Globe, Play, Pause, SkipForward, SkipBack } from 'lucide-react';

export const PredictionMap = () => {
  const { data: predictionsData, loading: predictionsLoading } = useCSVData('predictions.csv');
  const { data: geoData, loading: geoLoading } = useCSVData('geo_data.csv');
  
  const [selectedYear, setSelectedYear] = useState(2025);
  const [isPlaying, setIsPlaying] = useState(false);

  // Move all hooks to the top before any early returns
  const years = predictionsData?.length ? [...new Set(predictionsData
    .map(item => Number(item.time_period))
    .filter(year => !isNaN(year))
  )].sort((a, b) => a - b) : [];

  const countries = predictionsData?.length ? [...new Set(predictionsData
    .map(item => item.geo)
    .filter(geo => geo && typeof geo === 'string')
  )].sort() : [];

  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && years.length > 0) {
      interval = setInterval(() => {
        setSelectedYear(prev => {
          const currentIndex = years.indexOf(prev);
          const nextIndex = (currentIndex + 1) % years.length;
          return years[nextIndex];
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, years]);

  console.log('Predictions data:', predictionsData?.length || 0, 'records');
  console.log('Geo data:', geoData?.length || 0, 'records');
  console.log('Available years:', years);
  console.log('Available countries:', countries.length);

  // Early returns after all hooks
  if (predictionsLoading || geoLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (!predictionsData?.length || !geoData?.length) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600">No hay datos de predicciones disponibles</p>
            <p className="text-sm text-gray-500 mt-2">
              Predicciones: {predictionsData?.length || 0} | Geodatos: {geoData?.length || 0}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get regional analysis for selected year
  const getRegionalAnalysis = () => {
    if (!predictionsData?.length || !geoData?.length) return [];

    const yearData = predictionsData.filter(item => {
      const itemYear = Number(item.time_period);
      const laborForce = parseFloat(String(item.predicted_labour_force));
      return itemYear === selectedYear && !isNaN(laborForce) && laborForce > 0 && item.geo;
    });

    const merged = yearData.map(pred => {
      const geo = geoData.find(g => g.geo === pred.geo);
      const laborForce = parseFloat(String(pred.predicted_labour_force));
      return {
        geo: String(pred.geo),
        predicted_labour_force: laborForce,
        un_region: geo?.un_region || 'Unknown'
      };
    });

    const groupedByRegion = merged.reduce((acc: any, item) => {
      const region = item.un_region;
      if (!acc[region]) {
        acc[region] = { region, total: 0, count: 0, countries: new Set() };
      }
      acc[region].total += item.predicted_labour_force;
      acc[region].count += 1;
      acc[region].countries.add(item.geo);
      return acc;
    }, {});

    const result = Object.values(groupedByRegion).map((item: any) => ({
      region: item.region,
      average: parseFloat((item.total / item.count / 1000000).toFixed(1)), // Convert to millions for display
      total: parseFloat((item.total / 1000000).toFixed(1)), // Convert to millions
      countries: item.countries.size
    })).filter(item => item.region !== 'Unknown');

    console.log('Regional analysis for year', selectedYear, ':', result);
    return result;
  };

  const regionalAnalysis = getRegionalAnalysis();

  console.log('Regional analysis length:', regionalAnalysis.length);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Análisis Regional ({selectedYear})
          </CardTitle>
          <CardDescription>
            Análisis regional de predicciones laborales por año seleccionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Time Controls */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const currentIndex = years.indexOf(selectedYear);
                  if (currentIndex > 0) {
                    setSelectedYear(years[currentIndex - 1]);
                  }
                }}
                disabled={years.indexOf(selectedYear) === 0}
              >
                <SkipBack className="h-4 w-4" />
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
                onClick={() => {
                  const currentIndex = years.indexOf(selectedYear);
                  if (currentIndex < years.length - 1) {
                    setSelectedYear(years[currentIndex + 1]);
                  }
                }}
                disabled={years.indexOf(selectedYear) === years.length - 1}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{selectedYear}</div>
              <div className="text-sm text-gray-600">Año Seleccionado</div>
            </div>
            
            <div className="flex flex-wrap gap-2 max-w-md">
              {years.slice(0, 8).map(year => (
                <Button
                  key={year}
                  variant={year === selectedYear ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedYear(year)}
                  className="text-xs"
                >
                  {year}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Analysis Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis Regional - {selectedYear}</CardTitle>
          <CardDescription>Distribución promedio por regiones (en millones)</CardDescription>
        </CardHeader>
        <CardContent>
          {regionalAnalysis.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={regionalAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="region" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                  fontSize={10}
                />
                <YAxis tickFormatter={(value) => `${value}M`} />
                <Tooltip 
                  formatter={(value) => [`${value}M`, 'Promedio Regional']}
                />
                <Bar dataKey="average" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-500">No hay datos regionales disponibles para {selectedYear}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Países</div>
            <div className="text-2xl font-bold">{countries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Años Disponibles</div>
            <div className="text-2xl font-bold">{years.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Regiones Analizadas</div>
            <div className="text-2xl font-bold">{regionalAnalysis.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Año Actual</div>
            <div className="text-2xl font-bold">{selectedYear}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
