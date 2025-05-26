
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useCSVData } from '@/hooks/useCSVData';
import { useCSVExport } from '@/hooks/useCSVExport';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, Globe, BarChart3, Activity, Download, MapPin } from 'lucide-react';
import { InteractiveMap } from './InteractiveMap';
import { BasicReport } from './BasicReport';

export const AnalyticsDashboard = () => {
  const { data: predictionsData, loading: predictionsLoading } = useCSVData('predictions.csv');
  const { data: geoData, loading: geoLoading } = useCSVData('geo_data.csv');
  const { exportToCSV } = useCSVExport();
  
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  const loading = predictionsLoading || geoLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log('Predictions data loaded:', predictionsData.length);
  console.log('Sample prediction data:', predictionsData[0]);

  // FIXED: Process time series data with proper validation
  const processTimeSeriesData = () => {
    if (!predictionsData || predictionsData.length === 0) {
      console.log('No predictions data available');
      return [];
    }

    const groupedByYear = predictionsData.reduce((acc: any, item: any) => {
      const year = item.time_period;
      const laborForce = Number(item.predicted_labour_force);
      
      if (!year || isNaN(laborForce)) {
        return acc;
      }
      
      if (!acc[year]) {
        acc[year] = { year, total: 0, count: 0, values: [] };
      }
      acc[year].total += laborForce;
      acc[year].count += 1;
      acc[year].values.push(laborForce);
      return acc;
    }, {});

    const result = Object.values(groupedByYear).map((item: any) => ({
      year: item.year,
      average: (item.total / item.count).toFixed(2),
      total: item.total.toFixed(2),
      count: item.count
    })).sort((a: any, b: any) => a.year - b.year);

    console.log('Processed time series data:', result);
    return result;
  };

  // FIXED: Process regional data with better error handling
  const processRegionalData = () => {
    if (!predictionsData || !geoData || predictionsData.length === 0 || geoData.length === 0) {
      console.log('Missing data for regional processing');
      return [];
    }

    const merged = predictionsData.map((pred: any) => {
      const geo = geoData.find((g: any) => g.geo === pred.geo);
      return {
        ...pred,
        un_region: geo?.un_region || 'Unknown'
      };
    });

    const groupedByRegion = merged.reduce((acc: any, item: any) => {
      const region = item.un_region;
      const laborForce = Number(item.predicted_labour_force);
      
      if (!region || isNaN(laborForce)) {
        return acc;
      }
      
      if (!acc[region]) {
        acc[region] = { region, total: 0, count: 0, countries: new Set() };
      }
      acc[region].total += laborForce;
      acc[region].count += 1;
      acc[region].countries.add(item.geo);
      return acc;
    }, {});

    return Object.values(groupedByRegion).map((item: any) => ({
      region: item.region,
      average: (item.total / item.count).toFixed(2),
      total: item.total.toFixed(2),
      countries: item.countries.size
    }));
  };

  // FIXED: Process country trends with validation
  const processCountryTrends = () => {
    if (!predictionsData || predictionsData.length === 0) {
      console.log('No predictions data for country trends');
      return [];
    }

    const countries = [...new Set(predictionsData.map((item: any) => item.geo))].filter(Boolean);
    console.log('Countries with prediction data:', countries.length, countries);
    
    return countries.map(country => {
      const countryData = predictionsData
        .filter((item: any) => item.geo === country)
        .map((item: any) => ({
          ...item,
          predicted_labour_force: Number(item.predicted_labour_force)
        }))
        .filter((item: any) => !isNaN(item.predicted_labour_force))
        .sort((a: any, b: any) => a.time_period - b.time_period);
      
      if (countryData.length === 0) {
        return null;
      }
      
      const trend = countryData.length > 1 
        ? countryData[countryData.length - 1].predicted_labour_force - countryData[0].predicted_labour_force
        : 0;

      const latest = countryData[countryData.length - 1]?.predicted_labour_force || 0;

      return {
        country,
        trend: trend.toFixed(2),
        latest: latest.toFixed(2),
        dataPoints: countryData.length,
        trendColor: trend > 0 ? "#10B981" : "#EF4444"
      };
    })
    .filter(Boolean) // Remove null entries
    .sort((a: any, b: any) => Number(b.latest) - Number(a.latest));
  };

  const timeSeriesData = processTimeSeriesData();
  const regionalData = processRegionalData();
  const countryTrends = processCountryTrends();

  console.log('Time series processed:', timeSeriesData.length, 'data points');
  console.log('Country trends processed:', countryTrends.length, 'countries');

  const handleExportTimeSeriesData = () => {
    exportToCSV(timeSeriesData, 'time_series_analysis');
  };

  const handleExportCountryTrends = () => {
    exportToCSV(countryTrends, 'country_trends_analysis');
  };

  const totalCountries = new Set(predictionsData.map((item: any) => item.geo)).size;
  const totalDataPoints = predictionsData.length;
  const yearRange = predictionsData.length > 0 ? 
    Math.max(...predictionsData.map((item: any) => item.time_period)) - 
    Math.min(...predictionsData.map((item: any) => item.time_period)) + 1 : 0;
  const avgPrediction = predictionsData.length > 0 ? 
    (predictionsData.reduce((sum: number, item: any) => sum + (Number(item.predicted_labour_force) || 0), 0) / totalDataPoints).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Labor Force Analytics Dashboard</h1>
        <p className="text-lg text-gray-600">Comprehensive analysis of European labor market predictions</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCountries}</div>
            <p className="text-xs text-muted-foreground">European countries tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDataPoints}</div>
            <p className="text-xs text-muted-foreground">Prediction records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Span</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yearRange}</div>
            <p className="text-xs text-muted-foreground">Years of predictions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Prediction</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPrediction}M</div>
            <p className="text-xs text-muted-foreground">Labor force average</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Time Trends</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="countries">Country Comparison</TabsTrigger>
          <TabsTrigger value="map">Interactive Map</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Labor Force Predictions Over Time</CardTitle>
                  <CardDescription>Average and total predicted labor force across all countries</CardDescription>
                </div>
                <Button onClick={handleExportTimeSeriesData} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {timeSeriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="average" 
                      stackId="1" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.6}
                      name="Average per Country"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <p className="text-gray-500">No hay datos de predicciones disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <BasicReport predictionsData={predictionsData} geoData={geoData} />
        </TabsContent>

        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Country Trends Analysis</CardTitle>
                  <CardDescription>Labor force trend comparison across all countries</CardDescription>
                </div>
                <Button onClick={handleExportCountryTrends} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {countryTrends.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Trend Direction (Top 20)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={countryTrends.slice(0, 20)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="country" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar 
                          dataKey="trend" 
                          fill="#3B82F6"
                          name="Trend"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Todas las predicciones por país ({countryTrends.length} países)</h3>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {countryTrends.map((country: any, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{country.country}</div>
                            <div className="text-sm text-gray-600">
                              {country.dataPoints} data points
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{country.latest}M</div>
                            <div className={`text-sm ${
                              Number(country.trend) > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {Number(country.trend) > 0 ? '+' : ''}{country.trend}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <p className="text-gray-500">No hay datos de tendencias de países disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map">
          <InteractiveMap />
        </TabsContent>
      </Tabs>
    </div>
  );
};
