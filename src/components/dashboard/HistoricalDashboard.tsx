import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCSVData } from '@/hooks/useCSVData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, Globe, Calendar } from 'lucide-react';

export const HistoricalDashboard = () => {
  const { data: laborData, loading: laborLoading, error: laborError } = useCSVData('labor.csv');
  const { data: populationData, loading: populationLoading, error: populationError } = useCSVData('population.csv');

  const loading = laborLoading || populationLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (laborError || populationError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error cargando datos:</p>
          {laborError && <p className="text-sm text-gray-600">Labor: {laborError}</p>}
          {populationError && <p className="text-sm text-gray-600">Population: {populationError}</p>}
        </div>
      </div>
    );
  }

  console.log('Labor data loaded:', laborData.length);
  console.log('Population data loaded:', populationData.length);

  // Process data for distribution by countries (using labor data)
  const getCountryDistribution = () => {
    const countryData = laborData.reduce((acc: any, item: any) => {
      const country = item.geo;
      if (!acc[country]) {
        acc[country] = { country, totalLabor: 0, records: 0 };
      }
      acc[country].totalLabor += Number(item.labour_force) || 0;
      acc[country].records += 1;
      return acc;
    }, {});

    return Object.values(countryData)
      .map((item: any) => ({
        ...item,
        avgLabor: (item.totalLabor / item.records).toFixed(1)
      }))
      .sort((a: any, b: any) => Number(b.totalLabor) - Number(a.totalLabor))
      .slice(0, 10);
  };

  // Process data for population vs labor comparison
  const getPopulationLaborComparison = () => {
    const yearData = laborData.reduce((acc: any, item: any) => {
      const year = item.year;
      if (!acc[year]) {
        acc[year] = { year, labor: 0, laborCount: 0 };
      }
      acc[year].labor += Number(item.labour_force) || 0;
      acc[year].laborCount += 1;
      return acc;
    }, {});

    const populationByYear = populationData.reduce((acc: any, item: any) => {
      const year = item.year;
      if (!acc[year]) {
        acc[year] = { population: 0, popCount: 0 };
      }
      acc[year].population += Number(item.population) || 0;
      acc[year].popCount += 1;
      return acc;
    }, {});

    return Object.keys(yearData)
      .map(year => {
        const laborInfo = yearData[year];
        const popInfo = populationByYear[year] || { population: 0, popCount: 1 };
        
        return {
          year: parseInt(year),
          avgLabor: (laborInfo.labor / laborInfo.laborCount / 1000).toFixed(1),
          avgPopulation: (popInfo.population / popInfo.popCount / 1000000).toFixed(1),
          ratio: ((laborInfo.labor / laborInfo.laborCount) / (popInfo.population / popInfo.popCount) * 100).toFixed(1)
        };
      })
      .filter(item => Number(item.avgPopulation) > 0)
      .sort((a, b) => a.year - b.year)
      .slice(0, 15);
  };

  // Gender distribution data from labor
  const getGenderDistribution = () => {
    const genderData = laborData.reduce((acc: any, item: any) => {
      const sex = item.sex;
      if (!acc[sex]) {
        acc[sex] = 0;
      }
      acc[sex] += Number(item.labour_force) || 0;
      return acc;
    }, {});

    return Object.entries(genderData).map(([sex, total]: any) => ({
      sex: sex === 'Males' ? 'Hombres' : sex === 'Females' ? 'Mujeres' : 'Total',
      total: (Number(total) / 1000000).toFixed(1),
      value: Number(total)
    })).filter(item => item.sex !== 'Total');
  };

  // Age distribution from population data - UPDATED to exclude unknown/total and order properly
  const getAgeDistribution = () => {
    console.log('Processing age distribution...');
    console.log('Sample population data:', populationData.slice(0, 5));
    
    const ageData = populationData.reduce((acc: any, item: any) => {
      const age = item.age;
      if (!acc[age]) {
        acc[age] = 0;
      }
      acc[age] += Number(item.population) || 0;
      return acc;
    }, {});

    console.log('Age data aggregated:', Object.keys(ageData));

    // Define valid age groups in the correct order, excluding TOTAL and Unknown
    const validAgeGroups = [
      'Less than 5 years',        // <5 años (first)
      'From 5 to 9 years',        // 5-9 años
      'From 10 to 14 years',      // 10-14 años
      'From 15 to 19 years',      // 15-19 años
      'From 20 to 24 years',      // 20-24 años
      'From 25 to 29 years',      // 25-29 años
      'From 30 to 34 years',      // 30-34 años
      'From 35 to 39 years',      // 35-39 años
      'From 40 to 44 years',      // 40-44 años
      'From 45 to 49 years',      // 45-49 años
      'From 50 to 54 years',      // 50-54 años
      'From 55 to 59 years',      // 55-59 años
      'From 60 to 64 years',      // 60-64 años
      'From 65 to 69 years',      // 65-69 años
      'From 70 to 74 years',      // 70-74 años
      'From 75 to 79 years',      // 75-79 años
      'From 80 to 84 years',      // 80-84 años
      '85 years or over'          // 85+ años
    ];
    
    const result = validAgeGroups
      .filter(age => ageData[age] && Number(ageData[age]) > 0) // Only include ages with data
      .map(age => ({
        age,
        population: (Number(ageData[age]) / 1000000).toFixed(1),
        ageLabel: getAgeLabel(age),
        value: Number(ageData[age])
      }))
      .slice(0, 10); // Limit to top 10 for better visualization

    console.log('Processed age distribution:', result);
    return result;
  };

  // Helper function for age labels - updated for actual age values
  const getAgeLabel = (age: string): string => {
    const labels: {[key: string]: string} = {
      'Less than 5 years': '<5 años',
      'From 5 to 9 years': '5-9 años',
      'From 10 to 14 years': '10-14 años',
      'From 15 to 19 years': '15-19 años',
      'From 20 to 24 years': '20-24 años',
      'From 25 to 29 years': '25-29 años',
      'From 30 to 34 years': '30-34 años',
      'From 35 to 39 years': '35-39 años',
      'From 40 to 44 years': '40-44 años',
      'From 45 to 49 years': '45-49 años',
      'From 50 to 54 years': '50-54 años',
      'From 55 to 59 years': '55-59 años',
      'From 60 to 64 years': '60-64 años',
      'From 65 to 69 years': '65-69 años',
      'From 70 to 74 years': '70-74 años',
      'From 75 to 79 years': '75-79 años',
      'From 80 to 84 years': '80-84 años',
      '85 years or over': '85+ años'
    };
    return labels[age] || age;
  };

  // Gender distribution from population data
  const getPopulationGenderDistribution = () => {
    const genderData = populationData.reduce((acc: any, item: any) => {
      const sex = item.sex;
      if (!acc[sex]) {
        acc[sex] = 0;
      }
      acc[sex] += Number(item.population) || 0;
      return acc;
    }, {});

    return Object.entries(genderData).map(([sex, total]: any) => ({
      sex: sex === 'Males' ? 'Hombres' : sex === 'Females' ? 'Mujeres' : 'Total',
      total: (Number(total) / 1000000).toFixed(1),
      value: Number(total)
    })).filter(item => item.sex !== 'Total');
  };

  const countryDistribution = getCountryDistribution();
  const populationLaborData = getPopulationLaborComparison();
  const genderDistribution = getGenderDistribution();
  const populationGenderDistribution = getPopulationGenderDistribution();
  const ageDistribution = getAgeDistribution();

  const COLORS = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'];
  
  // Gender-specific colors: Blue for men, Pink for women
  const getGenderColor = (sex: string, index: number) => {
    if (sex === 'Hombres') return '#3B82F6'; // Blue for men
    if (sex === 'Mujeres') return '#EC4899'; // Pink for women
    return COLORS[index % COLORS.length];
  };

  // Calculate key statistics
  const totalCountries = new Set(laborData.map((item: any) => item.geo)).size;
  const totalYears = new Set(laborData.map((item: any) => item.year)).size;
  const totalLaborRecords = laborData.length;
  const totalPopulationRecords = populationData.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Datos Históricos</h1>
        <p className="text-lg text-gray-600">Análisis y distribución de datos demográficos y laborales</p>
      </div>

      {/* Key Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Países Analizados</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCountries}</div>
            <p className="text-xs text-muted-foreground">Total de países</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Años de Datos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalYears}</div>
            <p className="text-xs text-muted-foreground">Período cubierto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datos Laborales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLaborRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registros totales</p>
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
      </div>

      {/* Main Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Country Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Países</CardTitle>
            <CardDescription>Top 10 países por fuerza laboral total acumulada</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countryDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}`, 'Fuerza Laboral']} />
                <Bar dataKey="totalLabor" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Population Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución Poblacional por Género</CardTitle>
            <CardDescription>Población total por género (millones)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={populationGenderDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ sex, total }) => `${sex}: ${total}M`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {populationGenderDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getGenderColor(entry.sex, index)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [(Number(value) / 1000000).toFixed(1) + 'M', 'Población']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Labor Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución Laboral por Género</CardTitle>
            <CardDescription>Fuerza laboral total por género (millones)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ sex, total }) => `${sex}: ${total}M`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getGenderColor(entry.sex, index)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [(Number(value) / 1000000).toFixed(1) + 'M', 'Fuerza Laboral']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Age Distribution - UPDATED */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Edad</CardTitle>
            <CardDescription>Población por grupos etarios (millones)</CardDescription>
          </CardHeader>
          <CardContent>
            {ageDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="ageLabel"
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.ageLabel;
                      }
                      return value;
                    }}
                    formatter={(value) => [`${value}M`, 'Población']}
                  />
                  <Bar dataKey="population" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40">
                <p className="text-gray-500">No hay datos de distribución por edad disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Population vs Labor Comparison */}
      {populationLaborData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Población vs Fuerza Laboral</CardTitle>
            <CardDescription>Comparación temporal (promedios por año)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={populationLaborData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="avgPopulation" 
                  stackId="1" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.6}
                  name="Población Promedio (M)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="avgLabor" 
                  stackId="2" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.8}
                  name="Fuerza Laboral Promedio (K)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
