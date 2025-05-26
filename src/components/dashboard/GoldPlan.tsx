
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCSVData } from '@/hooks/useCSVData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, Globe, Download, FileText, BarChart3, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PredictionMap } from './PredictionMap';

export const GoldPlan = () => {
  const { data: laborData, loading: laborLoading } = useCSVData('labor.csv');
  const { data: populationData, loading: populationLoading } = useCSVData('population.csv');
  const { data: fertilityData, loading: fertilityLoading } = useCSVData('fertility.csv');
  const { data: predictionsData, loading: predictionsLoading } = useCSVData('predictions.csv');
  const { data: geoData, loading: geoLoading } = useCSVData('geo_data.csv');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast } = useToast();

  const loading = laborLoading || populationLoading || fertilityLoading || predictionsLoading || geoLoading;

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: `${filename}.csv has been downloaded`,
    });
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

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Enhanced Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(laborData.map((item: any) => item.geo)).size}</div>
            <p className="text-xs text-muted-foreground">Global coverage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Labor Records</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{laborData.length}</div>
            <p className="text-xs text-muted-foreground">Data points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predictions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{predictionsData.length}</div>
            <p className="text-xs text-muted-foreground">Future projections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Span</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {laborData.length > 0 ? Math.max(...laborData.map((item: any) => item.year)) - Math.min(...laborData.map((item: any) => item.year)) + 1 : 0}
            </div>
            <p className="text-xs text-muted-foreground">Years covered</p>
          </CardContent>
        </Card>
      </div>

      {/* Labor Force Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Comprehensive Labor Force Analysis</CardTitle>
          <CardDescription>Historical trends and gender distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={laborChartData}>
              <defs>
                <linearGradient id="colorMale" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorFemale" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EC4899" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#EC4899" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="male" stackId="1" stroke="#3B82F6" fillOpacity={1} fill="url(#colorMale)" name="Male" />
              <Area type="monotone" dataKey="female" stackId="1" stroke="#EC4899" fillOpacity={1} fill="url(#colorFemale)" name="Female" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderPredictions = () => <PredictionMap />;

  const renderReports = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Comprehensive Analytics Report</CardTitle>
          <CardDescription>Detailed insights and data exports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Data Export Options</h3>
              <div className="space-y-2">
                <Button 
                  onClick={() => exportToCSV(laborData, 'labor_force_data')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Labor Force Data
                </Button>
                <Button 
                  onClick={() => exportToCSV(populationData, 'population_data')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Population Data
                </Button>
                <Button 
                  onClick={() => exportToCSV(fertilityData, 'fertility_data')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Fertility Data
                </Button>
                <Button 
                  onClick={() => exportToCSV(predictionsData, 'predictions_data')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Predictions Data
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Report Insights</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium">Global Trends</p>
                  <p className="text-gray-600">Comprehensive analysis of worldwide demographic shifts</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium">Regional Analysis</p>
                  <p className="text-gray-600">Country-specific labor market insights and comparisons</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-medium">Future Projections</p>
                  <p className="text-gray-600">Predictive models for workforce planning</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gold Analytics Suite</h1>
        <p className="text-lg text-gray-600">Complete labor market intelligence platform</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('dashboard')}
          className="flex-1"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
        <Button
          variant={activeTab === 'predictions' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('predictions')}
          className="flex-1"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Prediction Map
        </Button>
        <Button
          variant={activeTab === 'reports' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('reports')}
          className="flex-1"
        >
          <FileText className="h-4 w-4 mr-2" />
          Reports
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'predictions' && renderPredictions()}
      {activeTab === 'reports' && renderReports()}
    </div>
  );
};
