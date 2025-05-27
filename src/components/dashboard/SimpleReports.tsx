
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCSVData } from '@/hooks/useCSVData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, Globe, Calendar } from 'lucide-react';

export const SimpleReports = () => {
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
  console.log('Sample labor data:', laborData[0]);
  console.log('Sample population data:', populationData[0]);

  // Log unique age values to debug
  const uniqueAges = [...new Set(populationData.map((item: any) => item.age))];
  console.log('Unique age values in population data:', uniqueAges);

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

  // Process data for population vs labor comparison - FIXED to show all available years
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

    const result = Object.keys(yearData)
      .map(year => {
        const laborInfo = yearData[year];
        const popInfo = populationByYear[year] || { population: 0, popCount: 1 };
        
        return {
          year: parseInt(year),
          avgLabor: (laborInfo.labor / laborInfo.laborCount / 1000).toFixed(1), // in thousands
          avgPopulation: (popInfo.population / popInfo.popCount / 1000000).toFixed(1), // in millions
          ratio: ((laborInfo.labor / laborInfo.laborCount) / (popInfo.population / popInfo.popCount) * 100).toFixed(1)
        };
      })
      .filter(item => Number(item.avgPopulation) > 0)
      .sort((a, b) => a.year - b.year); // Show ALL years, not just 15

    console.log('Population vs Labor data years:', result.map(r => r.year));
    console.log('Population vs Labor data length:', result.length);
    return result;
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
      total: (Number(total) / 1000000).toFixed(1), // in millions
      value: Number(total)
    })).filter(item => item.sex !== 'Total');
  };

  // Age distribution from population data - IMPROVED to show only top age groups
  const getAgeDistribution = () => {
    const ageData = populationData.reduce((acc: any, item: any) => {
      const age = item.age;
      if (!acc[age]) {
        acc[age] = 0;
      }
      acc[age] += Number(item.population) || 0;
      return acc;
    }, {});

    // Exclude unwanted categories
    const excludeTerms = ['Total', 'total', 'Unknown', 'unknown', 'TOTAL', 'UNKNOWN'];
    
    // Define age order for proper sorting
    const ageOrder = {
      'Less than 5 years': 1,
      'From 5 to 9 years': 2,
      'From 10 to 14 years': 3,
      'From 15 to 19 years': 4,
      'From 20 to 24 years': 5,
      'From 25 to 29 years': 6,
      'From 30 to 34 years': 7,
      'From 35 to 39 years': 8,
      'From 40 to 44 years': 9,
      'From 45 to 49 years': 10,
      'From 50 to 54 years': 11,
      'From 55 to 59 years': 12,
      'From 60 to 64 years': 13,
      'From 65 to 69 years': 14,
      'From 70 to 74 years': 15,
      'From 75 to 79 years': 16,
      'From 80 to 84 years': 17,
      '85 years or over': 18
    };

    // Get valid age groups with significant data
    const validAgeGroups = Object.keys(ageData)
      .filter(age => {
        const hasData = Number(ageData[age]) > 0;
        const isNotExcluded = !excludeTerms.some(term => age.includes(term));
        const hasSignificantData = Number(ageData[age]) > 100000; // Only show groups with >100k population
        return hasData && isNotExcluded && hasSignificantData && ageOrder[age as keyof typeof ageOrder];
      })
      .sort((a, b) => {
        const orderA = ageOrder[a as keyof typeof ageOrder] || 999;
        const orderB = ageOrder[b as keyof typeof ageOrder] || 999;
        return orderA - orderB;
      })
      .slice(0, 10); // Limit to top 10 groups

    console.log('Valid significant age groups found:', validAgeGroups);

    return validAgeGroups.map(age => ({
      age,
      population: (Number(ageData[age]) / 1000000).toFixed(1), // in millions
      shortLabel: getAgeLabel(age)
    }));
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
      total: (Number(total) / 1000000).toFixed(1), // in millions
      value: Number(total)
    })).filter(item => item.sex !== 'Total');
  };

  const countryDistribution = getCountryDistribution();
  const populationLaborData = getPopulationLaborComparison();
  const genderDistribution = getGenderDistribution();
  const populationGenderDistribution = getPopulationGenderDistribution();
  const ageDistribution = getAgeDistribution();

  // Fixed consistent gender colors: Blue for men, Pink for women
  const getGenderColor = (sex: string) => {
    if (sex === 'Hombres') return '#3B82F6'; // Blue for men
    if (sex === 'Mujeres') return '#EC4899'; // Pink for women
    return '#6B7280'; // Gray fallback
  };

  // Helper function to get readable age labels
  const getAgeLabel = (age: string) => {
    const labels: {[key: string]: string} = {
      'Less than 5 years': '<5',
      'From 5 to 9 years': '5-9',
      'From 10 to 14 years': '10-14',
      'From 15 to 19 years': '15-19',
      'From 20 to 24 years': '20-24',
      'From 25 to 29 years': '25-29',
      'From 30 to 34 years': '30-34',
      'From 35 to 39 years': '35-39',
      'From 40 to 44 years': '40-44',
      'From 45 to 49 years': '45-49',
      'From 50 to 54 years': '50-54',
      'From 55 to 59 years': '55-59',
      'From 60 to 64 years': '60-64',
      'From 65 to 69 years': '65-69',
      'From 70 to 74 years': '70-74',
      'From 75 to 79 years': '75-79',
      'From 80 to 84 years': '80-84',
      '85 years or over': '85+'
    };
    return labels[age] || age;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportes de Datos Históricos</h1>
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
                    <Cell key={`cell-${index}`} fill={getGenderColor(entry.sex)} />
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
                    <Cell key={`cell-${index}`} fill={getGenderColor(entry.sex)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [(Number(value) / 1000000).toFixed(1) + 'M', 'Fuerza Laboral']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Age Distribution - IMPROVED */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Edad</CardTitle>
            <CardDescription>Principales grupos etarios por población (millones)</CardDescription>
          </CardHeader>
          <CardContent>
            {ageDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageDistribution} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="shortLabel" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => {
                      const item = ageDistribution.find(d => d.shortLabel === value);
                      return item ? item.age : value;
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

      {/* Population vs Labor Comparison - UPDATED to show all years */}
      {populationLaborData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Población vs Fuerza Laboral</CardTitle>
            <CardDescription>
              Comparación temporal (promedios por año) - {populationLaborData[0]?.year} a {populationLaborData[populationLaborData.length - 1]?.year}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={populationLaborData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => value.toString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => `Año ${value}`}
                  formatter={(value, name) => {
                    if (name === 'Población Promedio (M)') {
                      return [`${value}M`, name];
                    }
                    return [`${value}K`, name];
                  }}
                />
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

      {/* Detailed Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Países</CardTitle>
          <CardDescription>Datos detallados por país (fuerza laboral promedio)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {countryDistribution.map((country: any, index) => (
              <div key={country.country} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <span className="font-medium">{country.country}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{(Number(country.totalLabor) / 1000000).toFixed(1)}M total</div>
                  <div className="text-xs text-gray-500">{Number(country.avgLabor).toFixed(0)}K promedio</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
