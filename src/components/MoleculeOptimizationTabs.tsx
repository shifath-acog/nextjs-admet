'use client';

import { useState, useMemo, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CounterfactualTable from './CounterfactualTable';
import { toast } from 'react-toastify';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FixedSizeList as List } from 'react-window';

interface Prediction {
  SMILES: string;
  Prediction: string;
  Confidence: string;
  Applicability: string;
  ChemicalStructure: string;
}

interface CounterfactualPrediction {
  SMILES: string;
  Confidence: string;
  Prediction: string;
}

interface MoleculeOptimizationTabsProps {
  predictions: Prediction[];
  modelChoice: string;
}

const ITEMS_PER_PAGE = 50;

export default function MoleculeOptimizationTabs({ predictions, modelChoice }: MoleculeOptimizationTabsProps) {
  const [counterfactualResults, setCounterfactualResults] = useState<CounterfactualPrediction[]>([]);
  const [chemicalSpaceResults, setChemicalSpaceResults] = useState<CounterfactualPrediction[]>([]);
  const [selectedSensitizer, setSelectedSensitizer] = useState<string>('');
  const [selectedNonSensitizer, setSelectedNonSensitizer] = useState<string>('');
  const [isCounterfactualLoading, setIsCounterfactualLoading] = useState(false);
  const [isChemicalSpaceLoading, setIsChemicalSpaceLoading] = useState(false);
  const [sensitizerSearch, setSensitizerSearch] = useState('');
  const [nonSensitizerSearch, setNonSensitizerSearch] = useState('');
  const [sensitizerOpen, setSensitizerOpen] = useState(false);
  const [nonSensitizerOpen, setNonSensitizerOpen] = useState(false);

  // Transform API response to CounterfactualPrediction array
  const transformApiResponse = (apiResponse: any): CounterfactualPrediction[] => {
    const { CounterfactualPrediction: predictions } = apiResponse;
    if (!predictions || !predictions.SMILES) return [];

    const result: CounterfactualPrediction[] = [];
    const keys = Object.keys(predictions.SMILES);

    for (const key of keys) {
      result.push({
        SMILES: predictions.SMILES[key] || '',
        Confidence: predictions.Confidence?.[key] || 'N/A',
        Prediction: predictions.Prediction?.[key] || 'N/A',
      });
    }

    return result;
  };

  const handleGenerateCounterfactuals = async () => {
    if (!selectedSensitizer) {
      toast.error('Please select a sensitizer SMILES');
      return;
    }
    setIsCounterfactualLoading(true);
    try {
      const response = await fetch('/api/generate-counterfactuals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_smiles: selectedSensitizer, model_choice: modelChoice }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const transformedResults = transformApiResponse(data);
      setCounterfactualResults(transformedResults);
      toast.success('Counterfactuals generated successfully');
    } catch (error) {
      toast.error('Failed to generate counterfactuals');
      console.error(error);
    } finally {
      setIsCounterfactualLoading(false);
    }
  };

  const handleExploreChemicalSpace = async () => {
    if (!selectedNonSensitizer) {
      toast.error('Please select a non-sensitizer SMILES');
      return;
    }
    setIsChemicalSpaceLoading(true);
    try {
      const response = await fetch('/api/explore-chemical-space', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_smiles: selectedNonSensitizer, model_choice: modelChoice }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const transformedResults = transformApiResponse(data);
      setChemicalSpaceResults(transformedResults);
      toast.success('Chemical space explored successfully');
    } catch (error) {
      toast.error('Failed to explore chemical space');
      console.error(error);
    } finally {
      setIsChemicalSpaceLoading(false);
    }
  };

  // Filter sensitizer and non-sensitizer SMILES
  const sensitizerSmiles = useMemo(
    () =>
      predictions
        .filter((p) => p.Prediction === 'Sensitizer' || p.Prediction === '1')
        .map((p) => p.SMILES)
        .filter((smiles) => smiles.toLowerCase().includes(sensitizerSearch.toLowerCase())),
    [predictions, sensitizerSearch]
  );

  const nonSensitizerSmiles = useMemo(
    () =>
      predictions
        .filter((p) => p.Prediction === 'Non-sensitizer' || p.Prediction === '0')
        .map((p) => p.SMILES)
        .filter((smiles) => smiles.toLowerCase().includes(nonSensitizerSearch.toLowerCase())),
    [predictions, nonSensitizerSearch]
  );

  // Lazy loading state
  const [sensitizerVisibleCount, setSensitizerVisibleCount] = useState(ITEMS_PER_PAGE);
  const [nonSensitizerVisibleCount, setNonSensitizerVisibleCount] = useState(ITEMS_PER_PAGE);

  const sensitizerListRef = useRef<List>(null);
  const nonSensitizerListRef = useRef<List>(null);

  const loadMoreSensitizerItems = () => {
    setSensitizerVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, sensitizerSmiles.length));
  };

  const loadMoreNonSensitizerItems = () => {
    setNonSensitizerVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, nonSensitizerSmiles.length));
  };

  const SmilesItem = ({ index, style, data }: { index: number; style: React.CSSProperties; data: string[] }) => {
    const smiles = data[index];
    return (
      <CommandItem
        key={smiles}
        value={smiles}
        onSelect={() => {
          if (data === sensitizerSmiles) {
            setSelectedSensitizer(smiles);
            setSensitizerOpen(false);
          } else {
            setSelectedNonSensitizer(smiles);
            setNonSensitizerOpen(false);
          }
        }}
        style={style}
        className="cursor-pointer"
      >
        <Check
          className={cn(
            'mr-2 h-4 w-4',
            (data === sensitizerSmiles ? selectedSensitizer : selectedNonSensitizer) === smiles ? 'opacity-100' : 'opacity-0'
          )}
        />
        {smiles}
      </CommandItem>
    );
  };

  return (
    <Card className="p-6 mt-6 border-gray-200">
      <Tabs defaultValue="counterfactuals" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
          <TabsTrigger value="counterfactuals" className="text-gray-700">
            Generate counterfactuals for sensitizers
          </TabsTrigger>
          <TabsTrigger value="chemical-space" className="text-gray-700">
            Explore chemical space for non-sensitizers
          </TabsTrigger>
        </TabsList>
        <TabsContent value="counterfactuals">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Select a sensitizer SMILES for counterfactual generation
              </h3>
              <Popover open={sensitizerOpen} onOpenChange={setSensitizerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={sensitizerOpen}
                    className="w-full max-w-md justify-between text-gray-700"
                  >
                    {selectedSensitizer || 'Select SMILES'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search SMILES..."
                      value={sensitizerSearch}
                      onValueChange={setSensitizerSearch}
                    />
                    <CommandList>
                      {sensitizerSmiles.length > 0 ? (
                        <CommandGroup>
                          <List
                            height={200}
                            itemCount={Math.min(sensitizerVisibleCount, sensitizerSmiles.length)}
                            itemSize={35}
                            width="100%"
                            ref={sensitizerListRef}
                            onItemsRendered={({ visibleStopIndex }) => {
                              if (visibleStopIndex >= sensitizerVisibleCount - 5) {
                                loadMoreSensitizerItems();
                              }
                            }}
                            itemData={sensitizerSmiles}
                          >
                            {SmilesItem}
                          </List>
                        </CommandGroup>
                      ) : (
                        <CommandEmpty>No sensitizer SMILES found</CommandEmpty>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <Button
              onClick={handleGenerateCounterfactuals}
              disabled={isCounterfactualLoading || !selectedSensitizer}
              className="bg-[#8e5572] hover:bg-[#7a4761] text-white"
            >
              {isCounterfactualLoading ? 'Generating...' : 'Generate Counterfactuals'}
            </Button>
            {counterfactualResults.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-medium text-gray-700">Counterfactual Results</h4>
                <CounterfactualTable data={counterfactualResults} />
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="chemical-space">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Select a non-sensitizer SMILES for generating similar SMILES
              </h3>
              <Popover open={nonSensitizerOpen} onOpenChange={setNonSensitizerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={nonSensitizerOpen}
                    className="w-full max-w-md justify-between text-gray-700"
                  >
                    {selectedNonSensitizer || 'Select SMILES'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search SMILES..."
                      value={nonSensitizerSearch}
                      onValueChange={setNonSensitizerSearch}
                    />
                    <CommandList>
                      {nonSensitizerSmiles.length > 0 ? (
                        <CommandGroup>
                          <List
                            height={200}
                            itemCount={Math.min(nonSensitizerVisibleCount, nonSensitizerSmiles.length)}
                            itemSize={35}
                            width="100%"
                            ref={nonSensitizerListRef}
                            onItemsRendered={({ visibleStopIndex }) => {
                              if (visibleStopIndex >= nonSensitizerVisibleCount - 5) {
                                loadMoreNonSensitizerItems();
                              }
                            }}
                            itemData={nonSensitizerSmiles}
                          >
                            {SmilesItem}
                          </List>
                        </CommandGroup>
                      ) : (
                        <CommandEmpty>No non-sensitizer SMILES found</CommandEmpty>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <Button
              onClick={handleExploreChemicalSpace}
              disabled={isChemicalSpaceLoading || !selectedNonSensitizer}
              className="bg-[#8e5572] hover:bg-[#7a4761] text-white"
            >
              {isChemicalSpaceLoading ? 'Exploring...' : 'Explore Chemical Space'}
            </Button>
            {chemicalSpaceResults.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-medium text-gray-700">Chemical Space Results</h4>
                <CounterfactualTable data={chemicalSpaceResults} />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}