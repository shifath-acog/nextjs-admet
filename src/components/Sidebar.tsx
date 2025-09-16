'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDropzone } from 'react-dropzone';

interface SidebarProps {
  onPredict: (data: any, model: string) => void;
}

export default function Sidebar({ onPredict }: SidebarProps) {
  const [inputTab, setInputTab] = useState<'smiles' | 'file'>('smiles');
  const [smiles, setSmiles] = useState('CC(=O)Nc1ccc(cc1)O');
  const [modelChoice, setModelChoice] = useState('in vitro (H-CLAT)');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'text/csv': ['.csv'] },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        setErrors((prev) => ({ ...prev, file: '' }));
      }
    },
  });

  const handleTrySample = async () => {
    if (selectedFile && selectedFile.name === 'smiles.csv') {
      setSelectedFile(null);
      toast.info('Sample file removed');
    } else {
      try {
        const response = await fetch('/smiles.csv');
        const blob = await response.blob();
        const file = new File([blob], 'smiles.csv', { type: 'text/csv' });
        setSelectedFile(file);
        setInputTab('file');
        setErrors((prev) => ({ ...prev, file: '' }));
        toast.success('Sample file loaded');
      } catch (error) {
        toast.error('Failed to load sample file');
        console.error(error);
      }
    }
  };

  const validateInputs = () => {
    const newErrors: { [key: string]: string } = {};
    if (inputTab === 'smiles' && !smiles.trim()) {
      newErrors.smiles = 'Please enter a SMILES string';
    }
    if (inputTab === 'file' && !selectedFile) {
      newErrors.file = 'Please upload a CSV file';
    }
    if (!modelChoice) {
      newErrors.modelChoice = 'Please select a dataset';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('model_choice', modelChoice);

      let groundTruthMap = new Map<string, string>();

      if (inputTab === 'smiles') {
        formData.append('smiles', smiles);
      } else if (selectedFile) {
        formData.append('file', selectedFile);

        const fileText = await selectedFile.text();
        const lines = fileText.trim().split('\n');
        const header = lines[0].split(',').map(h => h.trim());
        const smilesIndex = header.indexOf('SMILES');
        const groundTruthIndex = header.indexOf('Ground Truth');

        if (smilesIndex !== -1 && groundTruthIndex !== -1) {
          for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(',').map(cell => cell.trim());
            const smile = row[smilesIndex];
            const groundTruth = row[groundTruthIndex];
            if (smile && groundTruth) {
              groundTruthMap.set(smile, groundTruth);
            }
          }
        }
      }

      const response = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.predictions || !data.predictions.SMILES) {
        throw new Error('Invalid response format: Missing predictions.SMILES');
      }
      const transformedData = {
        ...data,
        predictions: Object.keys(data.predictions.SMILES).map((key) => {
          const smile = data.predictions.SMILES[key];
          return {
            SMILES: smile,
            Prediction: data.predictions.Prediction[key]?.replace(/<[^>]+>/g, '') || 'N/A',
            Confidence: data.predictions['Confidence (%)'][key] || 'N/A',
            Applicability: data.predictions.Applicability[key] || 'N/A',
            ChemicalStructure: data.predictions['Chemical structure'][key] || '',
            GroundTruth: groundTruthMap.get(smile),
          }
        }),
      };
      console.log('Transformed data:', transformedData);
      onPredict(transformedData, modelChoice);
      toast.success('Predictions fetched successfully');
    } catch (error: any) {
      toast.error(`Request failed: ${error.message}`);
      setErrors({ api: `Failed to fetch predictions: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="fixed left-4 w-[340px] p-6 bg-white/80 backdrop-blur-md border border-gray-200 shadow-lg overflow-auto">
      <div className="space-y-4">
        <Tabs value={inputTab} onValueChange={(value) => setInputTab(value as 'smiles' | 'file')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="smiles">Single SMILES</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="smiles">
            <div className="space-y-4">
              <div>
                <Label htmlFor="smiles" className="block text-sm font-medium text-gray-700 mb-2">
                  SMILES
                </Label>
                <Input
                  id="smiles"
                  type="text"
                  value={smiles}
                  onChange={(e) => {
                    setSmiles(e.target.value);
                    setErrors((prev) => ({ ...prev, smiles: '' }));
                  }}
                  className="w-full"
                  placeholder="Enter SMILES string"
                  disabled={isSubmitting}
                />
                {errors.smiles && <p className="text-red-600 text-sm mt-2">{errors.smiles}</p>}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="file">
            <div className="space-y-4">
              <div>
                <Label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </Label>
                <div
                  {...getRootProps()}
                  className="border-dashed border-2 border-gray-300 p-3 rounded-md text-center cursor-pointer hover:bg-gray-50 transition"
                >
                  <Input {...getInputProps()} id="file" className="hidden" />
                  <p className="text-gray-600">
                    {selectedFile ? selectedFile.name : 'Drag or click to upload (.csv)'}
                  </p>
                </div>
                {errors.file && <p className="text-red-600 text-sm mt-1">{errors.file}</p>}
              </div>
              <Button
                onClick={handleTrySample}
                className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                {selectedFile && selectedFile.name === 'smiles.csv' ? 'Remove Sample CSV' : 'Try Sample CSV'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        <div>
          <Label htmlFor="modelChoice" className="block text-sm font-medium text-gray-700 mb-2">
            Select Dataset
          </Label>
          <Select
            value={modelChoice}
            onValueChange={(value) => {
              setModelChoice(value);
              setErrors((prev) => ({ ...prev, modelChoice: '' }));
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger id="modelChoice" className="w-full">
              <SelectValue placeholder="Select dataset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in vitro (H-CLAT)">in vitro (H-CLAT)</SelectItem>
              <SelectItem value="in vitro (KeratinoSens)">in vitro (KeratinoSens)</SelectItem>
              <SelectItem value="in vivo (LLNA)">in vivo (LLNA)</SelectItem>
              <SelectItem value="in chemico (DPRA)">in chemico (DPRA)</SelectItem>
              <SelectItem value="human">human</SelectItem>
            </SelectContent>
          </Select>
          {errors.modelChoice && <p className="text-red-600 text-sm mt-1">{errors.modelChoice}</p>}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white rounded-md shadow-sm"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Predicting...
            </div>
          ) : (
            'Predict'
          )}
        </Button>
        {errors.api && <p className="text-red-600 text-sm">{errors.api}</p>}
      </div>
    </Card>
  );
}