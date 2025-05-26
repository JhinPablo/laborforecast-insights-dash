
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCSVData } from '@/hooks/useCSVData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Globe, Play, Pause, SkipForward, SkipBack } from 'lucide-react';

export const PredictionMap = () => {
  const { data: predictionsData, loading: predictionsLoading } = useCSVData('predictions.csv');
  const { data: geoData, loading: geoLoading } = useCSVData('geo_data.csv');
  
  const [selectedYear, setSelectedYear] = useState(2025);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const years = [...new Set(predictionsData.map(item => item.time_period))].sort();
  const countries = [...new Set(predictionsData.map(item => item.geo))];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && years.length > 0) {
      interval = setInterval(() => {
        setSelectedYear(prev => {
          const currentIndex = years.indexOf(prev);
          const nextIndex = (currentIndex + 1) % years.length;
          return years[nextIndex];
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, years]);

  const getDataForYear = (year: number) => {
    return predictionsData.filter(item => item.time_period === year);
  };

  const getCountryTimeline = (country: string) => {
    return predictionsData
      .filter(item => item.geo === country)
      .sort((a, b) => a.time_period - b.time_period);
  };

  const currentYearData = getDataForYear(selectedYear);

  if (predictionsLoading || geoLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Labor Force Predictions by Country & Time
          </CardTitle>
          <CardDescription>
            Interactive visualization of predicted labor force across countries and time periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Time Controls */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const currentIndex = years.indexOf(selectedYear);
                  if (currentIndex > 0) {
                    setSelectedYear(years[currentIndex - 1]);
                  }
                }}
                disabled={years.indexOf(selectedYear) === 0}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const currentIndex = years.indexOf(selectedYear);
                  if (currentIndex < years.length - 1) {
                    setSelectedYear(years[currentIndex + 1]);
                  }
                }}
                disabled={years.indexOf(selectedYear) === years.length - 1}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{selectedYear}</div>
              <div className="text-sm text-gray-600">Current Year</div>
            </div>
            
            <div className="flex gap-2">
              {years.map(year => (
                <Button
                  key={year}
                  variant={year === selectedYear ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedYear(year)}
                >
                  {year}
                </Button>
              ))}
            </div>
          </div>

          {/* Country Cards for Current Year */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {currentYearData.map((item, index) => {
              const geoInfo = geoData.find(geo => geo.geo === item.geo);
              return (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedCountry === item.geo ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedCountry(
                    selectedCountry === item.geo ? null : item.geo
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{item.geo}</h3>
                      <div className="text-xs text-gray-500">
                        {geoInfo?.un_region}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {(item.predicted_labour_force / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-sm text-gray-600">Predicted Labor Force</div>
                    {geoInfo && (
                      <div className="text-xs text-gray-500 mt-2">
                        Lat: {geoInfo.latitude?.toFixed(2)}, Lng: {geoInfo.longitude?.toFixed(2)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Timeline Chart for Selected Country */}
          {selectedCountry && (
            <Card>
              <CardHeader>
                <CardTitle>Labor Force Prediction Timeline - {selectedCountry}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getCountryTimeline(selectedCountry)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time_period" />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [
                        `${(value / 1000000).toFixed(1)}M`,
                        'Predicted Labor Force'
                      ]}
                      labelFormatter={(label) => `Year: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="predicted_labour_force" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      name="Predicted Labor Force"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Countries</div>
            <div className="text-2xl font-bold">{countries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Years Predicted</div>
            <div className="text-2xl font-bold">{years.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Current Year Total</div>
            <div className="text-2xl font-bold">
              {(currentYearData.reduce((sum, item) => sum + (item.predicted_labour_force || 0), 0) / 1000000).toFixed(1)}M
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
