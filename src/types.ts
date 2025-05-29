export interface Prediction {
    SMILES: string;
    Prediction: string;
    Confidence: string;
    Applicability: string;
    ChemicalStructure: string;
  }
  
  export interface CounterfactualPrediction {
    SMILES: string;
    Prediction: string;
    Confidence: string;
  }