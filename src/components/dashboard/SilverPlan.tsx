
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Users, Globe } from 'lucide-react';

export const SilverPlan = () => {
  const [laborData, setLaborData] = useState([]);
  const [populationData, setPopulationData] = useState([]);
  const [fertilityData, setFertilityData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch labor force data
      const { data: labor } = await supabase
        .from('labor')
        .select('*')
        .order('year');

      // Fetch population data
      const { data: population } = await supabase
        .from('population')
        .select('*')
        .order('year');

      // Fetch fertility data
      const { data: fertility } = await supabase
        .from('fertility')
        .select('*')
        .order('year');

      setLaborData(labor || []);
      setPopulationData(population || []);
      setFertilityData(fertility || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Process data for charts
  const laborByYear = laborData.reduce((acc: any, item: any) => {
    const year = item.year;
    if (!acc[year]) {
      acc[year] = { year, total: 0, male: 0, female: 0 };
    }
    acc[year].total += item.labour_force || 0;
    if (item.sex === 'Male') acc[year].male += item.labour_force || 0;
    if (item.sex === 'Female') acc[year].female += item.labour_force || 0;
    return acc;
  }, {});

  const laborChartData = Object.values(laborByYear);

  const fertilityByYear = fertilityData.reduce((acc: any, item: any) => {
    const year = item.year;
    if (!acc[year]) {
      acc[year] = { year, avgFertility: 0, count: 0 };
    }
    acc[year].avgFertility += item.fertility_rate || 0;
    acc[year].count += 1;
    return acc;
  }, {});

  const fertilityChartData = Object.values(fertilityByYear).map((item: any) => ({
    year: item.year,
    fertility: (item.avgFertility / item.count).toFixed(2)
  }));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Labor Analytics Dashboard</h1>
        <p className="text-lg text-gray-600">Silver Plan - Comprehensive Labor Market Insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(laborData.map((item: any) => item.geo)).size}</div>
            <p className="text-xs text-muted-foreground">Across all regions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{laborData.length}</div>
            <p className="text-xs text-muted-foreground">Labor force records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Years Covered</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...laborData.map((item: any) => item.year)) - Math.min(...laborData.map((item: any) => item.year)) + 1}
            </div>
            <p className="text-xs text-muted-foreground">Historical data span</p>
          </CardContent>
        </Card>
      </div>

      {/* Labor Force Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Labor Force Trends by Gender</CardTitle>
          <CardDescription>Global labor force participation over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={laborChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="male" stroke="#3B82F6" name="Male" />
              <Line type="monotone" dataKey="female" stroke="#EC4899" name="Female" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Fertility Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Global Fertility Rate Trends</CardTitle>
          <CardDescription>Average fertility rates across countries</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fertilityChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="fertility" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Regional Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Countries by Labor Force</CardTitle>
            <CardDescription>Latest available data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {laborData
                .reduce((acc: any, item: any) => {
                  if (!acc[item.geo]) {
                    acc[item.geo] = 0;
                  }
                  acc[item.geo] += item.labour_force || 0;
                  return acc;
                }, {})
                && Object.entries(laborData
                  .reduce((acc: any, item: any) => {
                    if (!acc[item.geo]) {
                      acc[item.geo] = 0;
                    }
                    acc[item.geo] += item.labour_force || 0;
                    return acc;
                  }, {}))
                  .sort(([,a]: any, [,b]: any) => b - a)
                  .slice(0, 5)
                  .map(([country, value]: any, index) => (
                    <div key={country} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{country}</span>
                      <span className="text-sm text-gray-600">{(value / 1000000).toFixed(1)}M</span>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Coverage</CardTitle>
            <CardDescription>Available metrics overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Labor Force Data</span>
                <span className="text-sm font-medium text-green-600">✓ Available</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Population Data</span>
                <span className="text-sm font-medium text-green-600">✓ Available</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Fertility Rates</span>
                <span className="text-sm font-medium text-green-600">✓ Available</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Predictions</span>
                <span className="text-sm font-medium text-orange-600">Gold Plan Only</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
