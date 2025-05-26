import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCSVData } from '@/hooks/useCSVData';
import { useCSVExport } from '@/hooks/useCSVExport';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import { Download, FileText, BarChart3, Users, TrendingUp, Calendar } from 'lucide-react';

export const ReportsSection = () => {
  const { data: laborData, loading: laborLoading } = useCSVData('labor.csv');
  const { data: populationData, loading: populationLoading } = useCSVData('population.csv');
  const { data: predictionsData, loading: predictionsLoading } = useCSVData('predictions.csv');
  const { data: geoData, loading: geoLoading } = useCSVData('geo_data.csv');
  const { exportToCSV } = useCSVExport();
  const { generateExecutiveReport, generateTrendsReport, generateRegionalReport } = usePDFGeneration();

  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);

  const loading = laborLoading || populationLoading || predictionsLoading || geoLoading;

  const generateLaborReport = () => {
    const countryStats = laborData.reduce((acc: any, item: any) => {
      const country = item.geo;
      if (!acc[country]) {
        acc[country] = {
          country,
          totalLabor: 0,
          records: 0,
          years: []
        };
      }
      acc[country].totalLabor += Number(item.labour_force) || 0;
      acc[country].records += 1;
      acc[country].years.push(item.year);
      return acc;
    }, {});

    return Object.values(countryStats).map((country: any) => ({
      country: country.country,
      totalLabor: country.totalLabor,
      averageLabor: (country.totalLabor / country.records).toFixed(2),
      dataPoints: country.records,
      yearRange: `${Math.min(...country.years)}-${Math.max(...country.years)}`
    })).sort((a: any, b: any) => b.totalLabor - a.totalLabor);
  };

  const generatePopulationReport = () => {
    const countryStats = populationData.reduce((acc: any, item: any) => {
      const country = item.geo;
      if (!acc[country]) {
        acc[country] = {
          country,
          totalPopulation: 0,
          records: 0,
          genders: new Set(),
          ageGroups: new Set()
        };
      }
      acc[country].totalPopulation += Number(item.population) || 0;
      acc[country].records += 1;
      acc[country].genders.add(item.sex);
      acc[country].ageGroups.add(item.age);
      return acc;
    }, {});

    return Object.values(countryStats).map((country: any) => ({
      country: country.country,
      totalPopulation: country.totalPopulation,
      averagePopulation: (country.totalPopulation / country.records).toFixed(2),
      dataPoints: country.records,
      genderCategories: country.genders.size,
      ageCategories: country.ageGroups.size
    })).sort((a: any, b: any) => b.totalPopulation - a.totalPopulation);
  };

  const generatePredictionsReport = () => {
    const merged = predictionsData.map((pred: any) => {
      const geo = geoData.find((g: any) => g.geo === pred.geo);
      return {
        ...pred,
        un_region: geo?.un_region || 'Unknown'
      };
    });

    const countryStats = merged.reduce((acc: any, item: any) => {
      if (!acc[item.geo]) {
        acc[item.geo] = {
          country: item.geo,
          region: item.un_region,
          predictions: [],
          years: []
        };
      }
      acc[item.geo].predictions.push(item.predicted_labour_force);
      acc[item.geo].years.push(item.time_period);
      return acc;
    }, {});

    return Object.values(countryStats).map((country: any) => {
      const predictions = country.predictions.sort((a: number, b: number) => a - b);
      const average = country.predictions.reduce((sum: number, val: number) => sum + val, 0) / country.predictions.length;
      
      return {
        country: country.country,
        region: country.region,
        averagePrediction: Number(average.toFixed(2)),
        minPrediction: Number(Math.min(...predictions).toFixed(2)),
        maxPrediction: Number(Math.max(...predictions).toFixed(2)),
        yearRange: `${Math.min(...country.years)}-${Math.max(...country.years)}`,
        dataPoints: country.predictions.length
      };
    }).sort((a: any, b: any) => b.averagePrediction - a.averagePrediction);
  };

  const handleExportLaborReport = () => {
    const report = generateLaborReport();
    exportToCSV(report, 'reporte_fuerza_laboral');
  };

  const handleExportPopulationReport = () => {
    const report = generatePopulationReport();
    exportToCSV(report, 'reporte_poblacion');
  };

  const handleExportPredictionsReport = () => {
    const report = generatePredictionsReport();
    exportToCSV(report, 'reporte_predicciones');
  };

  const handleExportRawData = (dataset: string) => {
    switch (dataset) {
      case 'labor':
        exportToCSV(laborData, 'datos_fuerza_laboral');
        break;
      case 'population':
        exportToCSV(populationData, 'datos_poblacion');
        break;
      case 'predictions':
        exportToCSV(predictionsData, 'datos_predicciones');
        break;
      case 'geo':
        exportToCSV(geoData, 'datos_geograficos');
        break;
    }
  };

  const handleGeneratePDF = async (type: string) => {
    setGeneratingPDF(type);
    try {
      switch (type) {
        case 'ejecutivo':
          await generateExecutiveReport(laborData, populationData, predictionsData, geoData);
          break;
        case 'tendencias':
          await generateTrendsReport(laborData, populationData);
          break;
        case 'regional':
          await generateRegionalReport(predictionsData, geoData);
          break;
      }
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      setGeneratingPDF(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Centro de Reportes</h1>
        <p className="text-lg text-gray-600">Genera y descarga reportes personalizados de los datos</p>
      </div>

      {/* Summary Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datos Laborales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{laborData.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">registros disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datos Población</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{populationData.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">registros disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicciones</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{predictionsData.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">predicciones disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Países</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{geoData.length}</div>
            <p className="text-xs text-muted-foreground">países con datos</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Generation Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* CSV Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Reportes CSV
            </CardTitle>
            <CardDescription>
              Descarga reportes procesados en formato CSV
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Reporte de Fuerza Laboral</h3>
                  <p className="text-sm text-gray-600">Estadísticas por país y año</p>
                </div>
                <Button onClick={handleExportLaborReport} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>

              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Reporte de Población</h3>
                  <p className="text-sm text-gray-600">Demografía por país y categorías</p>
                </div>
                <Button onClick={handleExportPopulationReport} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>

              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Reporte de Predicciones</h3>
                  <p className="text-sm text-gray-600">Pronósticos laborales futuros</p>
                </div>
                <Button onClick={handleExportPredictionsReport} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PDF Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Reportes PDF
            </CardTitle>
            <CardDescription>
              Genera reportes ejecutivos en formato PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Reporte Ejecutivo</h3>
                  <p className="text-sm text-gray-600">Resumen completo con estadísticas clave</p>
                </div>
                <Button 
                  onClick={() => handleGeneratePDF('ejecutivo')} 
                  size="sm" 
                  variant="outline"
                  disabled={generatingPDF === 'ejecutivo'}
                >
                  {generatingPDF === 'ejecutivo' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  {generatingPDF === 'ejecutivo' ? 'Generando...' : 'Generar PDF'}
                </Button>
              </div>

              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Análisis de Tendencias</h3>
                  <p className="text-sm text-gray-600">Evolución temporal y análisis demográfico</p>
                </div>
                <Button 
                  onClick={() => handleGeneratePDF('tendencias')} 
                  size="sm" 
                  variant="outline"
                  disabled={generatingPDF === 'tendencias'}
                >
                  {generatingPDF === 'tendencias' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  {generatingPDF === 'tendencias' ? 'Generando...' : 'Generar PDF'}
                </Button>
              </div>

              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Comparativa Regional</h3>
                  <p className="text-sm text-gray-600">Análisis por regiones europeas</p>
                </div>
                <Button 
                  onClick={() => handleGeneratePDF('regional')} 
                  size="sm" 
                  variant="outline"
                  disabled={generatingPDF === 'regional'}
                >
                  {generatingPDF === 'regional' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  {generatingPDF === 'regional' ? 'Generando...' : 'Generar PDF'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Raw Data Downloads */}
      <Card>
        <CardHeader>
          <CardTitle>Descargar Datos Sin Procesar</CardTitle>
          <CardDescription>
            Accede a los conjuntos de datos originales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={() => handleExportRawData('labor')} 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Datos Laborales</span>
            </Button>

            <Button 
              onClick={() => handleExportRawData('population')} 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Datos Población</span>
            </Button>

            <Button 
              onClick={() => handleExportRawData('predictions')} 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
            >
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Predicciones</span>
            </Button>

            <Button 
              onClick={() => handleExportRawData('geo')} 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
            >
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Datos Geográficos</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
