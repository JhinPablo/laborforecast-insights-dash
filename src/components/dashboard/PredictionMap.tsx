
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCSVData } from '@/hooks/useCSVData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { Globe, Play, Pause, SkipForward, SkipBack, TrendingUp } from 'lucide-react';

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

  // FIXED: Get regional analysis with proper data processing
  const getRegionalAnalysis = () => {
    if (!predictionsData?.length || !geoData?.length) return [];

    const merged = predictionsData
      .filter(item => {
        const laborForce = parseFloat(String(item.predicted_labour_force));
        return !isNaN(laborForce) && laborForce > 0 && item.geo;
      })
      .map(pred => {
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

    console.log('Regional analysis fixed:', result);
    return result;
  };

  // FIXED: Get yearly trends with proper data processing
  const getYearlyTrends = () => {
    if (!predictionsData?.length) return [];

    const yearlyData = years.map(year => {
      const yearData = predictionsData
        .filter(item => {
          const itemYear = Number(item.time_period);
          const laborForce = parseFloat(String(item.predicted_labour_force));
          return itemYear === year && !isNaN(laborForce) && laborForce > 0;
        });
      
      const total = yearData.reduce((sum, item) => {
        const laborForce = parseFloat(String(item.predicted_labour_force));
        return sum + laborForce;
      }, 0);
      
      const average = yearData.length > 0 ? total / yearData.length : 0;
      
      console.log(`Year ${year}: total=${total}, average=${average}, countries=${yearData.length}`);
      
      return {
        year,
        total: parseFloat((total / 1000000).toFixed(1)), // Convert to millions
        average: parseFloat((average / 1000000).toFixed(1)), // Convert to millions
        countries: yearData.length,
        totalRaw: total, // Keep raw total for debugging
        averageRaw: average // Keep raw average for debugging
      };
    }).filter(item => item.countries > 0);

    console.log('Yearly trends fixed:', yearlyData);
    return yearlyData;
  };

  const regionalAnalysis = getRegionalAnalysis();
  const yearlyTrends = getYearlyTrends();

  console.log('Regional analysis length:', regionalAnalysis.length);
  console.log('Yearly trends length:', yearlyTrends.length);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Análisis Regional y Tendencias Temporales ({years[0]}-{years[years.length-1]})
          </CardTitle>
          <CardDescription>
            Análisis regional y tendencias temporales de predicciones laborales
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

      {/* Analysis Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Yearly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencias por Año</CardTitle>
            <CardDescription>Evolución total y promedio de la fuerza laboral (en millones)</CardDescription>
          </CardHeader>
          <CardContent>
            {yearlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={yearlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => `${value}M`} />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value}M`,
                      name === 'average' ? 'Promedio por País' : 'Total Regional'
                    ]}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stackId="1" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6}
                    name="Total Regional"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="average" 
                    stackId="2" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.8}
                    name="Promedio por País"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40">
                <p className="text-gray-500">No hay datos de tendencias anuales disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Regional Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis Regional</CardTitle>
            <CardDescription>Distribución promedio por regiones (en millones)</CardDescription>
          </CardHeader>
          <CardContent>
            {regionalAnalysis.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
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
                <p className="text-gray-500">No hay datos regionales disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
            <div className="text-sm text-gray-600">Años Predichos</div>
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
            <div className="text-sm text-gray-600">Registros Totales</div>
            <div className="text-2xl font-bold">{predictionsData.length.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
