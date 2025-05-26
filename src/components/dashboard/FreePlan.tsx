
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Globe, AlertTriangle } from 'lucide-react';

export const FreePlan = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to LaborForecast</h1>
        <p className="text-lg text-gray-600">Understanding Global Demographic Challenges</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              The Demographic Challenge
            </CardTitle>
            <CardDescription>
              Understanding the global workforce transformation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              The world is experiencing unprecedented demographic shifts that will reshape economies 
              and societies. Aging populations in developed countries combined with changing birth 
              rates create complex challenges for labor markets globally.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Declining birth rates in developed nations</li>
              <li>• Aging workforce populations</li>
              <li>• Skills gaps in emerging technologies</li>
              <li>• Migration patterns affecting labor supply</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Labor Market Insights
            </CardTitle>
            <CardDescription>
              Key trends shaping the future of work
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Our platform analyzes comprehensive demographic and labor force data to provide 
              insights into future workforce trends and challenges.
            </p>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-medium">Population Analytics</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Globe className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-medium">Global Coverage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Why Demographic Forecasting Matters</CardTitle>
          <CardDescription>
            Strategic planning for sustainable economic growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Economic Planning</h3>
              <p className="text-sm text-gray-600">
                Anticipate workforce needs and economic shifts to make informed policy decisions.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Social Policy</h3>
              <p className="text-sm text-gray-600">
                Design social security and healthcare systems that adapt to demographic changes.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Global Insights</h3>
              <p className="text-sm text-gray-600">
                Understand regional variations and cross-border implications of demographic trends.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Card className="inline-block">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Ready for More Insights?</h3>
            <p className="text-gray-600 mb-4">
              Upgrade to Silver or Gold plan to access interactive dashboards and detailed analytics.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Upgrade Your Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
