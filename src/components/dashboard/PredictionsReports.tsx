
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RealisticEuropeMap } from './RealisticEuropeMap';
import { FileDown, TrendingUp, Map } from 'lucide-react';

export const PredictionsReports = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Predicciones de Fuerza Laboral</h1>
        <p className="text-lg text-gray-600">Visualización geográfica para Europa (2025-2049)</p>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <span className="text-lg font-semibold text-gray-900">Mapa Interactivo</span>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          Exportar Predicciones
        </Button>
      </div>

      {/* Geographic Map */}
      <RealisticEuropeMap />

      {/* Key Features Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Período de Predicción</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2025-2049</div>
            <p className="text-xs text-muted-foreground">25 años de proyecciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Países Cubiertos</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">27</div>
            <p className="text-xs text-muted-foreground">Países europeos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualización</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Mapa</div>
            <p className="text-xs text-muted-foreground">Interactivo</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
