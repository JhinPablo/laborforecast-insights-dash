
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
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  console.log('Predictions data:', predictionsData?.length || 0, 'records');
  console.log('Geo data:', geoData?.length || 0, 'records');

  if (predictionsLoading || geoLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  // Ensure we have data before processing
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

  // Get unique years and countries from predictions data
  const years = [...new Set(predictionsData
    .map(item => item.time_period)
    .filter(year => year && !isNaN(Number(year)))
  )].sort((a, b) => Number(a) - Number(b));

  const countries = [...new Set(predictionsData
    .map(item => item.geo)
    .filter(geo => geo)
  )].sort();

  console.log('Available years:', years);
  console.log('Available countries:', countries.length);

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
      }, 1500); // Slower animation for better visibility
    }
    return () => clearInterval(interval);
  }, [isPlaying, years]);

  // Get data for specific year
  const getDataForYear = (year: number) => {
    return predictionsData
      .filter(item => item.time_period === year && item.predicted_labour_force)
      .map(item => ({
        ...item,
        predicted_labour_force: Number(item.predicted_labour_force)
      }))
      .filter(item => !isNaN(item.predicted_labour_force))
      .sort((a, b) => b.predicted_labour_force - a.predicted_labour_force);
  };

  // Get country timeline
  const getCountryTimeline = (country: string) => {
    return predictionsData
      .filter(item => item.geo === country && item.predicted_labour_force)
      .map(item => ({
        ...item,
        time_period: Number(item.time_period),
        predicted_labour_force: Number(item.predicted_labour_force)
      }))
      .filter(item => !isNaN(item.time_period) && !isNaN(item.predicted_labour_force))
      .sort((a, b) => a.time_period - b.time_period);
  };

  // Get regional analysis
  const getRegionalAnalysis = () => {
    const merged = predictionsData
      .filter(item => item.predicted_labour_force && item.geo)
      .map(pred => {
        const geo = geoData.find(g => g.geo === pred.geo);
        return {
          ...pred,
          predicted_labour_force: Number(pred.predicted_labour_force),
          un_region: geo?.un_region || 'Unknown'
        };
      })
      .filter(item => !isNaN(item.predicted_labour_force));

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

    return Object.values(groupedByRegion).map((item: any) => ({
      region: item.region,
      average: (item.total / item.count).toFixed(1),
      total: item.total.toFixed(1),
      countries: item.countries.size
    })).filter(item => item.region !== 'Unknown');
  };

  // Get yearly trends
  const getYearlyTrends = () => {
    const yearlyData = years.map(year => {
      const yearData = getDataForYear(year);
      const total = yearData.reduce((sum, item) => sum + item.predicted_labour_force, 0);
      const average = yearData.length > 0 ? total / yearData.length : 0;
      
      return {
        year,
        total: (total / 1000000).toFixed(1), // in millions
        average: (average / 1000000).toFixed(1), // in millions
        countries: yearData.length
      };
    });

    return yearlyData;
  };

  const currentYearData = getDataForYear(selectedYear);
  const regionalAnalysis = getRegionalAnalysis();
  const yearlyTrends = getYearlyTrends();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Análisis de Predicciones de Fuerza Laboral ({years[0]}-{years[years.length-1]})
          </CardTitle>
          <CardDescription>
            Exploración interactiva de predicciones laborales por país y tiempo
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

          {/* Current Year Data */}
          {currentYearData.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {currentYearData.slice(0, 9).map((item, index) => {
                const geoInfo = geoData.find(geo => geo.geo === item.geo);
                return (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedCountry === item.geo ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedCountry(
                      selectedCountry === item.geo ? null : item.geo
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{item.geo}</h3>
                        <div className="text-xs text-gray-500">
                          {geoInfo?.un_region}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {(item.predicted_labour_force / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-sm text-gray-600">Fuerza Laboral Predicha</div>
                      {geoInfo && (
                        <div className="text-xs text-gray-500 mt-2">
                          #{index + 1} en {selectedYear}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Timeline Chart for Selected Country */}
          {selectedCountry && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Evolución Temporal - {selectedCountry}</CardTitle>
                <CardDescription>Predicción de fuerza laboral a lo largo del tiempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getCountryTimeline(selectedCountry)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time_period" />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [
                        `${(value / 1000000).toFixed(1)}M`,
                        'Fuerza Laboral Predicha'
                      ]}
                      labelFormatter={(label) => `Año: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="predicted_labour_force" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      name="Fuerza Laboral Predicha"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Analysis Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Yearly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencias por Año</CardTitle>
            <CardDescription>Evolución total y promedio de la fuerza laboral</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={yearlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
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
          </CardContent>
        </Card>

        {/* Regional Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis Regional</CardTitle>
            <CardDescription>Distribución por regiones de la UE</CardDescription>
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
                  <YAxis />
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
            <div className="text-sm text-gray-600">Año Actual Total</div>
            <div className="text-2xl font-bold">
              {(currentYearData.reduce((sum, item) => sum + (item.predicted_labour_force || 0), 0) / 1000000).toFixed(1)}M
            </div>
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
