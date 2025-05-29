# ADMET Next.js App

A Next.js application for predicting ADMET (Absorption, Distribution, Metabolism, Excretion, Toxicity) properties of chemical compounds. Features include a predictions table, search, CSV download, counterfactual generation, and chemical space exploration, integrated with a FastAPI backend.


## Getting Started

### 1. Clone the Repository

```bash
git clone git@github.com:shifath-acog/nextjs-admet.git
cd admet-nextjs
```

### 2. Build the App

```bash
# Install dependencies (optional for local verification)
npm install

# Build Docker image
docker build -t admet-nextjs .
```

### 3. Set Up Docker Network

Create a Docker network and connect containers:

```bash
# Create network
docker network create admet_api

# Connect FastAPI container to network (if not already connected)
docker network connect admet_api molecular-property-prediction

# Connect the nextjs-admet to admet_api network
docker network connect admet_api admet-nextjs
```

### 4. Run the App

```bash
# Run Next.js container
docker run -d --name nextjs-admet --network admet_api -p 3006:3000 admet-nextjs

```

### 5. Access the App

Open your browser and visit:

- **Local:** [http://localhost:3006](http://localhost:3006)  
- **Server:** [https://nextjs-admet.own6.aganitha.ai:8643](https://nextjs-admet.own6.aganitha.ai:8643)  

## Usage

- **Upload SMILES File:** Upload a `smiles.csv` file and select a model (e.g., "in vitro (H-CLAT)").
- **View Predictions:** See results in a table with SMILES, Prediction, Applicability, and ChemicalStructure.
- **Search:** Filter rows using the search button.
- **Download CSV:** Export predictions as `predictions.csv`.
- **Generate Counterfactuals:** Use the "Generate counterfactuals" tab to explore alternatives.
- **ADMET Info:** View the ADMET card when no predictions are available.
