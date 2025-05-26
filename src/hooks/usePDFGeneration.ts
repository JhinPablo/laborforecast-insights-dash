
import { useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const usePDFGeneration = () => {
  const generateExecutiveReport = useCallback(async (
    laborData: any[],
    populationData: any[],
    predictionsData: any[],
    geoData: any[]
  ) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Reporte Ejecutivo - Fuerza Laboral Europea', 20, 30);
    
    pdf.setFontSize(12);
    pdf.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 40);
    
    // Summary statistics
    pdf.setFontSize(14);
    pdf.text('Resumen Estadístico', 20, 60);
    
    pdf.setFontSize(10);
    const totalCountries = new Set(laborData.map((item: any) => item.geo)).size;
    const totalYears = new Set(laborData.map((item: any) => item.year)).size;
    
    pdf.text(`• Total de países analizados: ${totalCountries}`, 25, 70);
    pdf.text(`• Años de datos disponibles: ${totalYears}`, 25, 80);
    pdf.text(`• Registros de fuerza laboral: ${laborData.length.toLocaleString()}`, 25, 90);
    pdf.text(`• Registros demográficos: ${populationData.length.toLocaleString()}`, 25, 100);
    pdf.text(`• Predicciones futuras: ${predictionsData.length.toLocaleString()}`, 25, 110);
    
    // Country analysis
    pdf.setFontSize(14);
    pdf.text('Análisis por Países (Top 10)', 20, 130);
    
    const countryStats = laborData.reduce((acc: any, item: any) => {
      const country = item.geo;
      if (!acc[country]) {
        acc[country] = { country, totalLabor: 0, records: 0 };
      }
      acc[country].totalLabor += Number(item.labour_force) || 0;
      acc[country].records += 1;
      return acc;
    }, {});

    const topCountries = Object.values(countryStats)
      .sort((a: any, b: any) => b.totalLabor - a.totalLabor)
      .slice(0, 10);

    pdf.setFontSize(10);
    let yPosition = 140;
    topCountries.forEach((country: any, index) => {
      const avgLabor = (country.totalLabor / country.records / 1000).toFixed(0);
      pdf.text(`${index + 1}. ${country.country}: ${avgLabor}K promedio`, 25, yPosition);
      yPosition += 10;
    });

    // Predictions analysis
    pdf.addPage();
    pdf.setFontSize(14);
    pdf.text('Análisis de Predicciones (2025-2049)', 20, 30);
    
    const merged = predictionsData.map((pred: any) => {
      const geo = geoData.find((g: any) => g.geo === pred.geo);
      return { ...pred, un_region: geo?.un_region || 'Unknown' };
    });

    const predictionStats = merged.reduce((acc: any, item: any) => {
      if (!acc[item.geo]) {
        acc[item.geo] = { country: item.geo, region: item.un_region, predictions: [] };
      }
      acc[item.geo].predictions.push(item.predicted_labour_force);
      return acc;
    }, {});

    const topPredictions = Object.values(predictionStats)
      .map((country: any) => {
        const avg = country.predictions.reduce((sum: number, val: number) => sum + val, 0) / country.predictions.length;
        return { ...country, average: avg };
      })
      .sort((a: any, b: any) => b.average - a.average)
      .slice(0, 10);

    pdf.setFontSize(10);
    yPosition = 50;
    topPredictions.forEach((country: any, index) => {
      pdf.text(`${index + 1}. ${country.country}: ${country.average.toFixed(1)}M promedio futuro`, 25, yPosition);
      yPosition += 10;
    });

    pdf.save('reporte_ejecutivo.pdf');
  }, []);

  const generateTrendsReport = useCallback(async (
    laborData: any[],
    populationData: any[]
  ) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    pdf.setFontSize(20);
    pdf.text('Análisis de Tendencias Demográficas', 20, 30);
    
    pdf.setFontSize(12);
    pdf.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 40);
    
    // Gender analysis
    pdf.setFontSize(14);
    pdf.text('Distribución por Género - Fuerza Laboral', 20, 60);
    
    const genderLabor = laborData.reduce((acc: any, item: any) => {
      const sex = item.sex;
      if (!acc[sex]) acc[sex] = 0;
      acc[sex] += Number(item.labour_force) || 0;
      return acc;
    }, {});

    pdf.setFontSize(10);
    Object.entries(genderLabor).forEach(([sex, total]: any, index) => {
      const totalSum = Object.values(genderLabor).reduce((sum: number, val: number) => sum + val, 0);
      const percentage = ((total / totalSum) * 100).toFixed(1);
      pdf.text(`• ${sex === 'Males' ? 'Hombres' : 'Mujeres'}: ${(total / 1000000).toFixed(1)}M (${percentage}%)`, 25, 80 + (index * 10));
    });

    // Age analysis
    pdf.setFontSize(14);
    pdf.text('Distribución por Edad - Población', 20, 120);
    
    const ageData = populationData.reduce((acc: any, item: any) => {
      const age = item.age;
      if (!acc[age]) acc[age] = 0;
      acc[age] += Number(item.population) || 0;
      return acc;
    }, {});

    pdf.setFontSize(10);
    let yPos = 140;
    Object.entries(ageData).forEach(([age, total]: any) => {
      if (age !== 'TOTAL') {
        const label = age === 'Y_LT15' ? 'Menores de 15 años' : 
                     age === 'Y15-64' ? '15-64 años' : 
                     age === 'Y_GE65' ? '65+ años' : age;
        pdf.text(`• ${label}: ${(total / 1000000).toFixed(1)}M`, 25, yPos);
        yPos += 10;
      }
    });

    pdf.save('analisis_tendencias.pdf');
  }, []);

  const generateRegionalReport = useCallback(async (
    predictionsData: any[],
    geoData: any[]
  ) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    pdf.setFontSize(20);
    pdf.text('Comparativa Regional Europea', 20, 30);
    
    pdf.setFontSize(12);
    pdf.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 40);
    
    // Regional analysis
    const merged = predictionsData.map((pred: any) => {
      const geo = geoData.find((g: any) => g.geo === pred.geo);
      return { ...pred, un_region: geo?.un_region || 'Unknown' };
    });

    const regionalStats = merged.reduce((acc: any, item: any) => {
      const region = item.un_region;
      if (!acc[region]) {
        acc[region] = { region, predictions: [], countries: new Set() };
      }
      acc[region].predictions.push(item.predicted_labour_force);
      acc[region].countries.add(item.geo);
      return acc;
    }, {});

    pdf.setFontSize(14);
    pdf.text('Análisis por Regiones', 20, 60);
    
    pdf.setFontSize(10);
    let yPosition = 80;
    Object.values(regionalStats).forEach((region: any) => {
      const avg = region.predictions.reduce((sum: number, val: number) => sum + val, 0) / region.predictions.length;
      pdf.text(`• ${region.region}:`, 25, yPosition);
      pdf.text(`  - Promedio futuro: ${avg.toFixed(1)}M`, 30, yPosition + 8);
      pdf.text(`  - Países incluidos: ${region.countries.size}`, 30, yPosition + 16);
      yPosition += 30;
    });

    pdf.save('comparativa_regional.pdf');
  }, []);

  return {
    generateExecutiveReport,
    generateTrendsReport,
    generateRegionalReport
  };
};
