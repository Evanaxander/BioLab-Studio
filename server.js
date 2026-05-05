import express from 'express';
import compression from 'compression';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// API endpoints for AI suggestions and data
app.get('/api/modules', (req, res) => {
  res.json({
    modules: [
      { id: 'cell-structure', name: 'Cell Structure & Organelles', completed: false },
      { id: 'dna-rna', name: 'DNA & RNA Structures', completed: false },
      { id: 'protein-folding', name: 'Protein Folding & Structure', completed: false },
      { id: 'viral-particles', name: 'Viral Particles & Dynamics', completed: false },
      { id: 'enzyme-kinetics', name: 'Enzyme Kinetics', completed: false },
      { id: 'cell-division', name: 'Cell Division & Mitosis', completed: false },
      { id: 'antibody-antigen', name: 'Antibody-Antigen Binding', completed: false },
      { id: 'crispr-cas9', name: 'CRISPR-Cas9 System', completed: false }
    ]
  });
});

app.post('/api/ai/hypothesis', (req, res) => {
  const { module, difficulty } = req.body;
  
  const hypotheses = {
    'cell-structure': {
      beginner: 'Mitochondria are specialized organelles that produce ATP to power cellular activities.',
      intermediate: 'Mitochondrial membrane potential (ΔΨ) drives ATP synthesis through chemiosmotic coupling, generating ~30 ATP per glucose.',
      expert: 'Proton gradient across inner mitochondrial membrane creates electrochemical gradient; F1F0-ATP synthase converts gradient to phosphoryl transfer at rates of 100-200 ATP/sec per complex.'
    },
    'dna-rna': {
      beginner: 'DNA stores genetic information through base pairing between adenine-thymine and guanine-cytosine.',
      intermediate: 'DNA double helix maintains B-form geometry with 10.5 base pairs per turn, separated by 3.4 Å, generating major and minor grooves.',
      expert: 'DNA base stacking energy (ΔG ≈ -4 to -12 kJ/mol per base pair) and hydrogen bonding (A-T: 2 bonds, G-C: 3 bonds) drive double helix stability in physiological conditions.'
    }
  };

  const hypothesis = hypotheses[module]?.[difficulty] || 'Generate a testable hypothesis based on your model.';
  
  res.json({
    hypothesis: hypothesis,
    testable: true,
    difficulty: difficulty,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/ai/experiment', (req, res) => {
  const { module, difficulty } = req.body;
  
  const protocols = {
    'enzyme-kinetics': {
      beginner: `1. Prepare enzyme solution (purified, 1 μM)
2. Prepare substrate solutions (0.1-10 mM range)
3. Mix enzyme + substrate at 37°C
4. Measure product formation every 10 seconds for 60 seconds
5. Plot substrate concentration vs. reaction rate
6. Identify substrate concentration where rate plateaus (Vmax)`,
      intermediate: `1. Perform pre-steady-state kinetics at 25°C, 37°C, 50°C
2. Measure initial velocity at 8-10 substrate concentrations
3. Generate Lineweaver-Burk plot (1/v vs. 1/[S])
4. Calculate Km and Vmax using non-linear regression
5. Determine kcat = Vmax/[E]
6. Compare catalytic efficiency (kcat/Km) across conditions`,
      expert: `1. Establish isothermal titration calorimetry (ITC) to measure ΔH of binding
2. Use steady-state kinetics to determine Km, kcat, kcat/Km
3. Perform pre-steady-state burst kinetics to identify rate-limiting step
4. Temperature-jump fluorescence spectroscopy to measure conformational dynamics
5. Use molecular dynamics simulation to correlate enzyme mechanics with kinetics
6. Validate mechanism through structural studies (X-ray crystallography/cryo-EM)`
    }
  };

  const protocol = protocols[module]?.[difficulty] || 'Design an experiment to test your hypothesis.';
  
  res.json({
    protocol: protocol,
    materials: ['Equipment specifications available'],
    controls: ['Positive and negative controls required'],
    dataAnalysis: 'Use non-linear regression fitting',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/ai/analysis', (req, res) => {
  const { data, difficulty } = req.body;
  
  const analyses = {
    beginner: 'Visual inspection: Look for patterns in your data. Does product increase over time? Does changing substrate affect product formation?',
    intermediate: 'Statistical analysis: Calculate mean and standard deviation. Use ANOVA to test differences between conditions. Generate publication-ready graphs.',
    expert: 'Non-linear regression fitting: Apply Michaelis-Menten equation. Calculate 95% confidence intervals. Perform sensitivity analysis. Use RMSE to assess goodness of fit.'
  };

  res.json({
    analysis: analyses[difficulty] || 'Analyze your experimental data systematically.',
    suggestedTools: ['GraphPad Prism', 'Python (SciPy)', 'R (stats package)'],
    timestamp: new Date().toISOString()
  });
});

app.post('/api/simulation', (req, res) => {
  const { temperature, pH, concentration, steps } = req.body;
  
  // Simulate molecular behavior based on parameters
  const simulationData = [];
  for (let i = 0; i < steps; i++) {
    const timePoint = i * 0.1;
    const tempEffect = (temperature - 37) * 0.01;
    const phEffect = Math.abs(pH - 7.4) * -0.02;
    const activityMultiplier = 1 + tempEffect + phEffect;
    
    simulationData.push({
      time: timePoint,
      activity: Math.max(0, Math.sin(timePoint * 0.5) * activityMultiplier + 0.5),
      moleculeCount: Math.round(concentration * (1 + activityMultiplier) * 100),
      temperature: temperature,
      pH: pH
    });
  }

  res.json({
    simulationData: simulationData,
    completed: true,
    parameters: { temperature, pH, concentration },
    timestamp: new Date().toISOString()
  });
});

app.post('/api/model/save', (req, res) => {
  const { components, metadata } = req.body;
  
  res.json({
    success: true,
    modelId: `model_${Date.now()}`,
    componentCount: components.length,
    saved: true,
    message: 'Model saved successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/model/:modelId', (req, res) => {
  const { modelId } = req.params;
  
  res.json({
    modelId: modelId,
    components: [],
    metadata: {},
    retrieved: true,
    timestamp: new Date().toISOString()
  });
});

// Serve main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════════════════════╗`);
  console.log(`║   BioLab Studio Pro - Advanced Learning Platform       ║`);
  console.log(`╚════════════════════════════════════════════════════════╝\n`);
  console.log(`✓ Server running at: http://localhost:${PORT}`);
  console.log(`✓ Open your browser and navigate to: http://localhost:${PORT}`);
  console.log(`✓ Press Ctrl+C to stop the server\n`);
});
