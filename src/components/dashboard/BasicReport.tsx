
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { useCSVExport } from '@/hooks/useCSVExport';

interface BasicReportProps {
  predictionsData: any[];
  geoData: any[];
}

export const BasicReport = ({ predictionsData, geoData }: BasicReportProps) => {
  const { exportToCSV } = useCSVExport();

  // Process data for the basic report
  const generateReportData = () => {
    const merged = predictionsData.map((pred: any) => {
      const geo = geoData.find((g: any) => g.geo === pred.geo);
      return {
        ...pred,
        un_region: geo?.un_region || 'Unknown'
      };
    });

    // Group by country and calculate statistics
    const countryStats = merged.reduce((acc: any, item: any) => {
      if (!acc[item.geo]) {
        acc[item.geo] = {
          country: item.geo,
          region: item.un_region,
          predictions: [],
          total: 0,
          count: 0
        };
      }
      acc[item.geo].predictions.push(item.predicted_labour_force);
      acc[item.geo].total += item.predicted_labour_force;
      acc[item.geo].count += 1;
      return acc;
    }, {});

    return Object.values(countryStats).map((country: any) => {
      const predictions = country.predictions.sort((a: number, b: number) => a - b);
      const average = country.total / country.count;
      const trend = predictions[predictions.length - 1] - predictions[0];
      
      return {
        country: country.country,
        region: country.region,
        average: Number(average.toFixed(2)),
        min: Number(Math.min(...predictions).toFixed(2)),
        max: Number(Math.max(...predictions).toFixed(2)),
        trend: Number(trend.toFixed(2)),
        dataPoints: country.count
      };
    }).sort((a: any, b: any) => b.average - a.average);
  };

  const reportData = generateReportData();

  const handleExportReport = () => {
    exportToCSV(reportData, 'labor_force_basic_report');
  };

  const handleExportRawData = () => {
    exportToCSV(predictionsData, 'labor_force_predictions');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reporte Básico de Fuerza Laboral
              </CardTitle>
              <CardDescription>
                Estadísticas resumidas por país con datos de exportación
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportReport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar Reporte
              </Button>
              <Button onClick={handleExportRawData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar Datos Completos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>País</TableHead>
                  <TableHead>Región</TableHead>
                  <TableHead className="text-right">Promedio</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead className="text-right">Máximo</TableHead>
                  <TableHead className="text-right">Tendencia</TableHead>
                  <TableHead className="text-right">Puntos de Datos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.slice(0, 15).map((row: any, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.country}</TableCell>
                    <TableCell className="text-sm text-gray-600">{row.region}</TableCell>
                    <TableCell className="text-right font-semibold">{row.average}M</TableCell>
                    <TableCell className="text-right">{row.min}M</TableCell>
                    <TableCell className="text-right">{row.max}M</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {row.trend > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={row.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                          {row.trend > 0 ? '+' : ''}{row.trend}M
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{row.dataPoints}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {reportData.length > 15 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Mostrando 15 de {reportData.length} países. Exporta el reporte completo para ver todos los datos.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total de Países</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Mayor Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData[0]?.average}M</div>
            <div className="text-xs text-gray-600">{reportData[0]?.country}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tendencia Positiva</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reportData.filter((item: any) => item.trend > 0).length}
            </div>
            <div className="text-xs text-gray-600">países en crecimiento</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
