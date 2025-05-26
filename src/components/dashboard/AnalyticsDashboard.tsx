
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCSVData } from '@/hooks/useCSVData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ScatterPlot, Scatter } from 'recharts';
import { TrendingUp, Users, Globe, BarChart3, Activity, MapPin } from 'lucide-react';
import { InteractiveMap } from './InteractiveMap';

export const AnalyticsDashboard = () => {
  const { data: predictionsData, loading: predictionsLoading } = useCSVData('predictions.csv');
  const { data: geoData, loading: geoLoading } = useCSVData('geo_data.csv');
  
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  const loading = predictionsLoading || geoLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Process data for different visualizations
  const processTimeSeriesData = () => {
    const groupedByYear = predictionsData.reduce((acc: any, item: any) => {
      if (!acc[item.time_period]) {
        acc[item.time_period] = { year: item.time_period, total: 0, count: 0 };
      }
      acc[item.time_period].total += item.predicted_labour_force;
      acc[item.time_period].count += 1;
      return acc;
    }, {});

    return Object.values(groupedByYear).map((item: any) => ({
      year: item.year,
      average: (item.total / item.count).toFixed(2),
      total: item.total.toFixed(2)
    }));
  };

  const processRegionalData = () => {
    const merged = predictionsData.map((pred: any) => {
      const geo = geoData.find((g: any) => g.geo === pred.geo);
      return {
        ...pred,
        un_region: geo?.un_region || 'Unknown'
      };
    });

    const groupedByRegion = merged.reduce((acc: any, item: any) => {
      if (!acc[item.un_region]) {
        acc[item.un_region] = { region: item.un_region, total: 0, count: 0, countries: new Set() };
      }
      acc[item.un_region].total += item.predicted_labour_force;
      acc[item.un_region].count += 1;
      acc[item.un_region].countries.add(item.geo);
      return acc;
    }, {});

    return Object.values(groupedByRegion).map((item: any) => ({
      region: item.region,
      average: (item.total / item.count).toFixed(2),
      total: item.total.toFixed(2),
      countries: item.countries.size
    }));
  };

  const processCountryTrends = () => {
    const countries = [...new Set(predictionsData.map((item: any) => item.geo))];
    return countries.slice(0, 10).map(country => {
      const countryData = predictionsData
        .filter((item: any) => item.geo === country)
        .sort((a: any, b: any) => a.time_period - b.time_period);
      
      const trend = countryData.length > 1 
        ? countryData[countryData.length - 1].predicted_labour_force - countryData[0].predicted_labour_force
        : 0;

      return {
        country,
        trend: trend.toFixed(2),
        latest: countryData[countryData.length - 1]?.predicted_labour_force.toFixed(2) || 0,
        dataPoints: countryData.length
      };
    });
  };

  const timeSeriesData = processTimeSeriesData();
  const regionalData = processRegionalData();
  const countryTrends = processCountryTrends();

  const totalCountries = new Set(predictionsData.map((item: any) => item.geo)).size;
  const totalDataPoints = predictionsData.length;
  const yearRange = Math.max(...predictionsData.map((item: any) => item.time_period)) - 
                   Math.min(...predictionsData.map((item: any) => item.time_period)) + 1;
  const avgPrediction = (predictionsData.reduce((sum: number, item: any) => sum + item.predicted_labour_force, 0) / totalDataPoints).toFixed(2);

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
          <TabsTrigger value="regions">Regional Analysis</TabsTrigger>
          <TabsTrigger value="countries">Country Comparison</TabsTrigger>
          <TabsTrigger value="map">Interactive Map</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Labor Force Predictions Over Time</CardTitle>
              <CardDescription>Average and total predicted labor force across all countries</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regional Distribution</CardTitle>
              <CardDescription>Labor force predictions by UN regions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={regionalData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="region" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="average" fill="#10B981" name="Average Labor Force" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Regional Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {regionalData.map((region: any, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{region.region}</div>
                        <div className="text-sm text-gray-600">{region.countries} countries</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{region.average}M</div>
                        <div className="text-sm text-gray-600">avg/country</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Regions</span>
                    <span className="font-medium">{regionalData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Most Represented</span>
                    <span className="font-medium">
                      {regionalData.sort((a: any, b: any) => b.countries - a.countries)[0]?.region}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Highest Average</span>
                    <span className="font-medium">
                      {regionalData.sort((a: any, b: any) => b.average - a.average)[0]?.region}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Country Trends Analysis</CardTitle>
              <CardDescription>Labor force trend comparison across top countries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Trend Direction</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={countryTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="country" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar 
                        dataKey="trend" 
                        fill={(entry: any) => entry.trend > 0 ? "#10B981" : "#EF4444"}
                        name="Trend"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Latest Predictions</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {countryTrends
                      .sort((a: any, b: any) => b.latest - a.latest)
                      .map((country: any, index) => (
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
