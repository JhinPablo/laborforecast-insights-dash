
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
          avgLabor: (laborInfo.labor / laborInfo.laborCount / 1000).toFixed(1), // in thousands
          avgPopulation: (popInfo.population / popInfo.popCount / 1000000).toFixed(1), // in millions
          ratio: ((laborInfo.labor / laborInfo.laborCount) / (popInfo.population / popInfo.popCount) * 100).toFixed(1)
        };
      })
      .filter(item => Number(item.avgPopulation) > 0)
      .sort((a, b) => a.year - b.year)
      .slice(0, 15); // Last 15 years with data
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

  // Age distribution from population data
  const getAgeDistribution = () => {
    const ageData = populationData.reduce((acc: any, item: any) => {
      const age = item.age;
      if (!acc[age]) {
        acc[age] = 0;
      }
      acc[age] += Number(item.population) || 0;
      return acc;
    }, {});

    return Object.entries(ageData)
      .map(([age, total]: any) => ({
        age,
        population: (Number(total) / 1000000).toFixed(1) // in millions
      }))
      .sort((a: any, b: any) => {
        // Sort age groups logically
        const ageOrder = ['Y_LT15', 'Y15-64', 'Y_GE65', 'TOTAL'];
        return ageOrder.indexOf(a.age) - ageOrder.indexOf(b.age);
      })
      .filter(item => item.age !== 'TOTAL');
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

  const COLORS = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'];

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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [(Number(value) / 1000000).toFixed(1) + 'M', 'Fuerza Laboral']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Edad</CardTitle>
            <CardDescription>Población por grupos etarios (millones)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="age" 
                  tickFormatter={(value) => {
                    const labels: {[key: string]: string} = {
                      'Y_LT15': '<15 años',
                      'Y15-64': '15-64 años',
                      'Y_GE65': '65+ años',
                      'Total': 'Total'
                    };
                    return labels[value] || value;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => {
                    const labels: {[key: string]: string} = {
                      'Y_LT15': 'Menores de 15 años',
                      'Y15-64': '15 a 64 años',
                      'Y_GE65': '65 años o más',
                      'Total': 'Total'
                    };
                    return labels[value] || value;
                  }}
                  formatter={(value) => [`${value}M`, 'Población']}
                />
                <Bar dataKey="population" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
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
