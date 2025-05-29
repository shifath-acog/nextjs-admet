import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { selected_smiles, model_choice } = await request.json();

    if (!selected_smiles) {
      return NextResponse.json({ error: 'SMILES string must be provided' }, { status: 400 });
    }

    const formData = new FormData();
    formData.append('smiles', selected_smiles);
    formData.append('model_choice', model_choice || 'in vitro (H-CLAT)');

    const response = await fetch('http://molecular-property-prediction:8000/generate-counterfactuals/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`FastAPI error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Counterfactuals error:', error);
    return NextResponse.json({ error: 'Failed to generate counterfactuals' }, { status: 500 });
  }
}