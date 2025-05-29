'use client';

import PredictionTable from '@/components/PredictionTable';
import MoleculeOptimizationTabs from '@/components/MoleculeOptimizationTabs';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Prediction {
  SMILES: string;
  Prediction: string;
  Confidence: string;
  Applicability: string;
  ChemicalStructure: string;
}

interface HomeProps {
  predictions: Prediction[];
  modelChoice: string;
}

export default function Home({ predictions, modelChoice }: HomeProps) {
  const [isApiSuccess, setIsApiSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (predictions.length > 0) {
      setIsApiSuccess(true);
    } else {
      setIsApiSuccess(false);
    }
  }, [predictions]);

  const handleDownloadCsv = () => {
    const headers = ['SMILES', 'Prediction', 'Confidence', 'Applicability'];
    const rows = predictions.map((row) => [
      `"${row.SMILES.replace(/"/g, '""')}"`,
      `"${row.Prediction.replace(/"/g, '""')}"`,
      row.Confidence,
      `"${row.Applicability.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'predictions.csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-4 px-1 border border-gray-200 rounded-lg shadow-sm">
      {isApiSuccess ? (
        <div className=''>
          <div className="flex items-center justify-between mb-4 px-2 width-400">
            <h2 className="text-xl font-semibold text-gray-700">
              {modelChoice} predictions:
            </h2>
            <div className="flex space-x-2 ">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCsv}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                disabled={predictions.length === 0}
              >
                <Download className="w-4 h-4" />
                
              </Button>
              <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    <Search className="w-4 h-4" />
                    
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2">
                  <Input
                    placeholder="Search predictions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <PredictionTable
            data={predictions}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <MoleculeOptimizationTabs predictions={predictions} modelChoice={modelChoice} />
        </div>
      ) : (
        <Card className="border-gray-200 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              About ADMET
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              ADMET stands for Absorption, Distribution, Metabolism, Excretion, and Toxicity. These properties are critical in evaluating the pharmacokinetics and safety of potential drug candidates. 
            </p>
            <br />
            <p>
              Our platform leverages advanced machine learning models to predict ADMET properties for chemical compounds, enabling researchers to optimize molecules for drug development. Upload a SMILES file and select a model to generate predictions and explore counterfactuals or chemical space.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}