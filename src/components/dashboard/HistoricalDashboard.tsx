
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ComposedChart } from 'recharts';
import { TrendingUp, Users, Globe, Activity, Calendar, Briefcase } from 'lucide-react';

export const HistoricalDashboard = () => {
  const [laborData, setLaborData] = useState([]);
  const [populationData, setPopulationData] = useState([]);
  const [fertilityData, setFertilityData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistoricalData();
  }, []);

  const fetchHistoricalData = async () => {
    try {
      console.log('Fetching historical data...');

      // Fetch labor force data
      const { data: labor, error: laborError } = await supabase
        .from('labor')
        .select('*')
        .order('year');

      if (laborError) {
        console.error('Labor data error:', laborError);
      }

      // Fetch population data
      const { data: population, error: populationError } = await supabase
        .from('population')
        .select('*')
        .order('year');

      if (populationError) {
        console.error('Population data error:', populationError);
      }

      // Fetch fertility data
      const { data: fertility, error: fertilityError } = await supabase
        .from('fertility')
        .select('*')
        .order('year');

      if (fertilityError) {
        console.error('Fertility data error:', fertilityError);
      }

      console.log('Labor data count:', labor?.length || 0);
      console.log('Population data count:', population?.length || 0);
      console.log('Fertility data count:', fertility?.length || 0);

      setLaborData(labor || []);
      setPopulationData(population || []);
      setFertilityData(fertility || []);
    } catch (error) {
      console.error('Error fetching historical data:', error);
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

  // Process labor data for visualization
  const processLaborData = () => {
    const groupedByYear = laborData.reduce((acc: any, item: any) => {
      const year = item.year;
      if (!acc[year]) {
        acc[year] = { year, total: 0, male: 0, female: 0, countries: new Set() };
      }
      acc[year].total += item.labour_force || 0;
      acc[year].countries.add(item.geo);
      
      if (item.sex === 'Males') acc[year].male += item.labour_force || 0;
      if (item.sex === 'Females') acc[year].female += item.labour_force || 0;
      
      return acc;
    }, {});

    return Object.values(groupedByYear)
      .map((item: any) => ({
        year: item.year,
        total: (item.total / 1000).toFixed(1), // Convert to thousands
        male: (item.male / 1000).toFixed(1),
        female: (item.female / 1000).toFixed(1),
        countries: item.countries.size
      }))
      .sort((a: any, b: any) => a.year - b.year);
  };

  // Process population data
  const processPopulationData = () => {
    const groupedByYear = populationData.reduce((acc: any, item: any) => {
      const year = item.year;
      if (!acc[year]) {
        acc[year] = { year, total: 0, countries: new Set() };
      }
      acc[year].total += item.population || 0;
      acc[year].countries.add(item.geo);
      return acc;
    }, {});

    return Object.values(groupedByYear)
      .map((item: any) => ({
        year: item.year,
        population: (item.total / 1000000).toFixed(1), // Convert to millions
        countries: item.countries.size
      }))
      .sort((a: any, b: any) => a.year - b.year);
  };

  // Process fertility data
  const processFertilityData = () => {
    const groupedByYear = fertilityData.reduce((acc: any, item: any) => {
      const year = item.year;
      if (!acc[year]) {
        acc[year] = { year, totalRate: 0, count: 0, countries: new Set() };
      }
      acc[year].totalRate += item.fertility_rate || 0;
      acc[year].count += 1;
      acc[year].countries.add(item.geo);
      return acc;
    }, {});

    return Object.values(groupedByYear)
      .map((item: any) => ({
        year: item.year,
        fertility: (item.totalRate / item.count).toFixed(2),
        countries: item.countries.size
      }))
      .sort((a: any, b: any) => a.year - b.year);
  };

  // Get top countries by labor force
  const getTopCountriesByLabor = () => {
    const countryTotals = laborData.reduce((acc: any, item: any) => {
      if (!acc[item.geo]) {
        acc[item.geo] = 0;
      }
      acc[item.geo] += item.labour_force || 0;
      return acc;
    }, {});

    return Object.entries(countryTotals)
      .map(([country, total]: any) => ({ country, total: (total / 1000).toFixed(1) }))
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10);
  };

  const laborChartData = processLaborData();
  const populationChartData = processPopulationData();
  const fertilityChartData = processFertilityData();
  const topCountries = getTopCountriesByLabor();

  // Calculate key metrics
  const totalCountries = new Set([
    ...laborData.map((item: any) => item.geo),
    ...populationData.map((item: any) => item.geo),
    ...fertilityData.map((item: any) => item.geo)
  ]).size;

  const totalLaborRecords = laborData.length;
  const totalPopulationRecords = populationData.length;
  const totalFertilityRecords = fertilityData.length;

  const yearRange = laborChartData.length > 0 
    ? `${Math.min(...laborChartData.map((d: any) => d.year))}-${Math.max(...laborChartData.map((d: any) => d.year))}`
    : 'N/A';

  const avgFertility = fertilityChartData.length > 0
    ? (fertilityChartData.reduce((sum: number, item: any) => sum + parseFloat(item.fertility), 0) / fertilityChartData.length).toFixed(2)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Histórico</h1>
        <p className="text-lg text-gray-600">Análisis de datos demográficos y laborales europeos</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Países</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCountries}</div>
            <p className="text-xs text-muted-foreground">Total de países</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Años</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yearRange}</div>
            <p className="text-xs text-muted-foreground">Período analizado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datos Laborales</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLaborRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registros históricos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datos Población</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPopulationRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registros demográficos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fertilidad</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFertilityRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registros natalidad</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fertilidad Media</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgFertility}</div>
            <p className="text-xs text-muted-foreground">Tasa promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Labor Force Evolution */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución de la Fuerza Laboral</CardTitle>
            <CardDescription>Fuerza laboral histórica por género (en miles)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={laborChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="male" stroke="#3B82F6" name="Hombres" />
                <Line type="monotone" dataKey="female" stroke="#EC4899" name="Mujeres" />
                <Line type="monotone" dataKey="total" stroke="#10B981" name="Total" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Population Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencias Poblacionales</CardTitle>
            <CardDescription>Población total por año (en millones)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={populationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="population" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.6}
                  name="Población (millones)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fertility Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Tasas de Fertilidad</CardTitle>
            <CardDescription>Evolución de las tasas de fertilidad promedio</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fertilityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="fertility" fill="#F59E0B" name="Tasa de Fertilidad" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle>Principales Países por Fuerza Laboral</CardTitle>
            <CardDescription>Total acumulado histórico (en miles)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCountries.map((country: any, index) => (
                <div key={country.country} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="text-sm font-medium">{country.country}</span>
                  </div>
                  <span className="text-sm text-gray-600 font-mono">{country.total}K</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Combined Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis Combinado: Fuerza Laboral vs Fertilidad</CardTitle>
          <CardDescription>Comparación de tendencias demográficas clave</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={laborChartData.map((labor: any) => {
              const fertility = fertilityChartData.find((f: any) => f.year === labor.year);
              return {
                ...labor,
                fertility: fertility ? parseFloat(fertility.fertility) : null
              };
            })}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="total" fill="#3B82F6" name="Fuerza Laboral Total (miles)" />
              <Line yAxisId="right" type="monotone" dataKey="fertility" stroke="#EF4444" strokeWidth={3} name="Tasa de Fertilidad" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
