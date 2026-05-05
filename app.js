import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class BioLabProApp {
    constructor() {
        this.difficulty = 'beginner';
        this.currentModule = 'cell-structure';
        this.currentMode = 'visualize';
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.selectedObject = null;
        this.models = {};
        this.components = [];
        this.modelComponents = [];
        this.controls = null;
        this.idleRotationEnabled = true;
        this.controlsInteracting = false;
        this.hoverMarker = null;
        this.hoveredObject = null;
        this.pointer = new THREE.Vector2();
        this.pointerClient = { x: 0, y: 0 };
        this.pointerValid = false;
        this.simulation = {
            running: false,
            temperature: 37,
            pH: 7.4,
            concentration: 50,
            time: 0,
            animationFrameId: null
        };
        this.completedModules = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.init();
    }

    init() {
        this.setupThreeJS();
        this.loadAllModules();
        this.setupEventListeners();
        this.loadModule('cell-structure');
        this.animate();
    }

    setupThreeJS() {
        const canvas = document.getElementById('canvas3d');
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e27);
        
        this.camera = new THREE.PerspectiveCamera(
            75,
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            2000
        );
        this.camera.position.z = 60;

        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.screenSpacePanning = true;
        this.controls.minDistance = 20;
        this.controls.maxDistance = 250;
        this.controls.target.set(0, 0, 0);
        this.controls.update();
        this.controls.addEventListener('start', () => {
            this.controlsInteracting = true;
        });
        this.controls.addEventListener('end', () => {
            this.controlsInteracting = false;
        });

        const hoverGeometry = new THREE.SphereGeometry(1.2, 24, 24);
        const hoverMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.35,
            depthWrite: false
        });
        this.hoverMarker = new THREE.Mesh(hoverGeometry, hoverMaterial);
        this.hoverMarker.visible = false;
        this.scene.add(this.hoverMarker);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        const accentLight = new THREE.DirectionalLight(0x00d4ff, 0.5);
        accentLight.position.set(-50, 30, 40);
        this.scene.add(accentLight);

        const greenLight = new THREE.DirectionalLight(0x00ff88, 0.3);
        greenLight.position.set(30, -50, -40);
        this.scene.add(greenLight);

        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        canvas.addEventListener('click', (e) => this.onCanvasClick(e));
        canvas.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
    }

    loadAllModules() {
        this.models = {
            'cell-structure': {
                title: 'Cell Structure & Organelles',
                description: 'Explore fundamental components of eukaryotic cells',
                components: [
                    { name: 'Nucleus', type: 'sphere', size: 15, color: 0xb366ff, x: 0, y: 0, z: 0, info: 'Controls cellular activities and protein synthesis. Houses DNA.' },
                    { name: 'Mitochondria', type: 'sphere', size: 8, color: 0xff6b3d, x: 25, y: 15, z: 0, info: 'Powerhouse of cell. Produces 30-38 ATP per glucose via OXPHOS.' },
                    { name: 'Ribosome', type: 'ribosome-model', size: 4, color: 0x00ff88, x: -20, y: 20, z: 0, info: 'Catalyzes peptide bond formation. Reads mRNA codons at 20 aa/sec.' },
                    { name: 'Endoplasmic Reticulum', type: 'box', size: 12, color: 0x00d4ff, x: -25, y: -15, z: 0, info: 'Network membrane system. Rough ER: protein synthesis. Smooth ER: lipid synthesis.' },
                    { name: 'Golgi Apparatus', type: 'box', size: 10, color: 0xffd700, x: 20, y: -20, z: 0, info: 'Modifies proteins. Stacks 4-8 cisternae. Ships via vesicles.' }
                ]
            },
            'dna-rna': {
                title: 'DNA & RNA Structures',
                description: '3D visualization of nucleic acid architecture',
                components: [
                    { name: 'DNA Double Helix', type: 'dna-helix', size: 10, color: 0xb366ff, x: 0, y: 0, z: 0, info: 'B-form: 10.5 bp/turn, 3.4 Å pitch. Complementary strands: A-T (2 bonds), G-C (3 bonds).' },
                    { name: 'Purine (Adenine/Guanine)', type: 'octahedron', size: 3, color: 0xff6b3d, x: -15, y: 15, z: 0, info: 'Two-ring structure. In both DNA and RNA.' },
                    { name: 'Pyrimidine (Cytosine/Thymine)', type: 'octahedron', size: 2.5, color: 0x00d4ff, x: 15, y: 15, z: 0, info: 'Single-ring structure. Thymine in DNA, Uracil in RNA.' },
                    { name: 'mRNA', type: 'rna-chain', size: 8, color: 0xff9933, x: 0, y: -25, z: 0, info: 'Carries genetic code from nucleus. Single-stranded. Lifetime: minutes.' }
                ]
            },
            'protein-folding': {
                title: 'Protein Structure & Folding',
                description: 'Hierarchical protein folding and secondary structures',
                components: [
                    { name: 'Alpha Helix', type: 'cylinder', size: 8, color: 0x3d7aff, x: -20, y: 0, z: 0, info: 'Right-handed coil. 3.6 aa/turn. Stabilized by backbone H-bonds.' },
                    { name: 'Beta Sheet', type: 'box', size: 12, color: 0xff6b3d, x: 20, y: 0, z: 0, info: 'Extended conformation. Parallel or antiparallel. Strand-to-strand H-bonds.' },
                    { name: 'Loop Region', type: 'sphere', size: 10, color: 0x00ff88, x: 0, y: 0, z: 0, info: 'Unstructured connector between secondary structures. Often functional.' },
                    { name: 'Disulfide Bond', type: 'sphere', size: 4, color: 0xffd700, x: 0, y: 20, z: 0, info: 'Covalent bond between Cys residues. Provides stability. Intramolecular/intermolecular.' }
                ]
            },
            'viral-particles': {
                title: 'Viral Particles & Virion Structure',
                description: 'Molecular architecture of infectious viruses',
                components: [
                    { name: 'Capsid', type: 'sphere', size: 20, color: 0xff6b3d, x: 0, y: 0, z: 0, info: 'Protein shell protecting genome. Icosahedral or helical symmetry. 20-1000 nm diameter.' },
                    { name: 'Spike Protein', type: 'cone', size: 6, color: 0x00d4ff, x: 20, y: 15, z: 0, info: 'Glycoprotein. Mediates cell entry. Targets for vaccines and antivirals.' },
                    { name: 'Lipid Envelope', type: 'sphere', size: 22, color: 0xb366ff, x: 0, y: 0, z: 5, info: 'Derived from host cell membrane. Contains viral glycoproteins. Lipid bilayer.' },
                    { name: 'Viral Genome', type: 'torus', size: 8, color: 0x00ff88, x: 0, y: 0, z: 0, info: 'DNA or RNA. Positive/negative sense RNA. 5 kb to 2.5 Mb genome size.' }
                ]
            },
            'enzyme-kinetics': {
                title: 'Enzyme Kinetics & Catalysis',
                description: 'Enzyme-substrate interactions and reaction mechanisms',
                components: [
                    { name: 'Enzyme (Active Site)', type: 'sphere', size: 12, color: 0x3d7aff, x: 0, y: 0, z: 0, info: 'Protein catalyst. Lowers Ea by 50-90 kJ/mol. Turnover rate: 10^2 to 10^6 per sec.' },
                    { name: 'Substrate', type: 'sphere', size: 6, color: 0xff6b3d, x: -20, y: 0, z: 0, info: 'Molecule undergoing catalysis. Binds with Km typically 10^-3 to 10^-6 M.' },
                    { name: 'Product', type: 'sphere', size: 6, color: 0x00ff88, x: 20, y: 0, z: 0, info: 'Result of enzyme catalysis. Released after reaction completion.' },
                    { name: 'ES Complex', type: 'box', size: 8, color: 0xffd700, x: 0, y: 0, z: 0, info: 'Enzyme-substrate intermediate. Transient. Critical for catalytic mechanism.' }
                ]
            },
            'cell-division': {
                title: 'Cell Division & Mitosis',
                description: 'Stages of cell cycle and chromosome dynamics',
                components: [
                    { name: 'Chromosome', type: 'torus', size: 6, color: 0xb366ff, x: -15, y: 15, z: 0, info: 'Condensed chromatin. Sister chromatids joined at centromere. 46 in human diploid.' },
                    { name: 'Centrosome (MTOC)', type: 'sphere', size: 4, color: 0x00d4ff, x: 0, y: 25, z: 0, info: 'Microtubule organizing center. Contains centrioles. Initiates spindle formation.' },
                    { name: 'Spindle Fiber (Microtubule)', type: 'cylinder', size: 5, color: 0x00ff88, x: 0, y: 12, z: 0, info: 'Polymerized alpha/beta tubulin. Dynamic instability. Pulls chromatids to poles.' },
                    { name: 'Kinetochore', type: 'sphere', size: 2, color: 0xff6b3d, x: -10, y: 15, z: 0, info: 'Protein complex at centromere. Spindle attachment site. Tension sensing.' }
                ]
            },
            'antibody-antigen': {
                title: 'Antibody-Antigen Binding',
                description: 'Molecular basis of immune recognition',
                components: [
                    { name: 'Antibody (IgG)', type: 'sphere', size: 10, color: 0x3d7aff, x: -15, y: 0, z: 0, info: 'Y-shaped immunoglobulin. Kd ~1-10 nM. Variable regions recognize epitopes.' },
                    { name: 'Antigen', type: 'sphere', size: 6, color: 0xff6b3d, x: 15, y: 0, z: 0, info: 'Foreign substance triggering immune response. Protein, polysaccharide, lipid.' },
                    { name: 'Epitope', type: 'sphere', size: 3, color: 0x00ff88, x: 15, y: 0, z: 0, info: 'Specific region recognized by antibody. 5-12 amino acids. Linear or conformational.' },
                    { name: 'CDR Region (Paratope)', type: 'box', size: 8, color: 0xffd700, x: -15, y: -10, z: 0, info: 'Complementarity-determining region. Hypervariable loops. Specific antigen binding.' }
                ]
            },
            'crispr-cas9': {
                title: 'CRISPR-Cas9 Gene Editing',
                description: 'Molecular mechanism of programmable genome editing',
                components: [
                    { name: 'Cas9 Nuclease', type: 'sphere', size: 14, color: 0xb366ff, x: 0, y: 0, z: 0, info: '160 kDa protein. Mg2+ dependent. Cuts 3-4 bp upstream of PAM sequence.' },
                    { name: 'Guide RNA', type: 'torus', size: 6, color: 0x00d4ff, x: -18, y: 0, z: 0, info: 'crRNA + tracrRNA hybrid. 20 bp target specificity. 1 in 10^12 precision.' },
                    { name: 'Target DNA', type: 'cylinder', size: 10, color: 0xff6b3d, x: 20, y: 0, z: 0, info: 'Genomic DNA sequence. Double-strand break at cut site. Repair via NHEJ or HDR.' },
                    { name: 'PAM Sequence', type: 'sphere', size: 4, color: 0x00ff88, x: 25, y: 0, z: 0, info: 'Protospacer adjacent motif. NGG for SpCas9. Required for cutting.' }
                ]
            }
        };
    }

    loadModule(moduleName) {
        this.currentModule = moduleName;
        this.clearScene();
        
        const moduleData = this.models[moduleName];
        if (!moduleData) return;

        document.getElementById('overlayTitle').textContent = moduleData.title;
        document.getElementById('overlayInfo').textContent = moduleData.description;
        document.getElementById('modelTitle').textContent = moduleData.title;
        document.getElementById('modelDescription').textContent = moduleData.description;
        document.getElementById('componentCount').textContent = moduleData.components.length;
        
        this.renderComponents(moduleData.components);
        this.updateProgress();
    }

    createRibosomeMesh(comp) {
        const group = new THREE.Group();
        const mainSize = comp.size;
        
        // Grainy, rough material for ribosomal proteins
        const ribosomeMaterial = new THREE.MeshStandardMaterial({
            color: comp.color,
            metalness: 0.1,
            roughness: 1.0,
            emissive: 0x1a3a2a,
            emissiveIntensity: 0.08,
            flatShading: true
        });

        const grainMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(comp.color).offsetHSL(-0.02, 0.04, 0.08),
            metalness: 0.05,
            roughness: 1.0,
            emissive: 0x102016,
            emissiveIntensity: 0.05,
            flatShading: true
        });
        
        // Create main lumpy body from aggregated spheres
        const sphereCount = 52;
        const spheres = [];
        
        for (let i = 0; i < sphereCount; i++) {
            // Distribute spheres in a vaguely ellipsoidal cloud with random jitter
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = mainSize * (0.45 + Math.random() * 0.75);
            
            const squash = 0.75 + Math.random() * 0.5;
            const x = Math.sin(phi) * Math.cos(theta) * r * (1 + Math.random() * 0.35);
            const y = Math.cos(phi) * r * squash * (1 + Math.random() * 0.35);
            const z = Math.sin(phi) * Math.sin(theta) * r * (1 + Math.random() * 0.35);
            
            const sphereRadius = mainSize * (0.28 + Math.random() * 0.38);
            const geometry = new THREE.SphereGeometry(sphereRadius, 12, 12);
            const sphere = new THREE.Mesh(geometry, i % 5 === 0 ? grainMaterial : ribosomeMaterial);
            
            sphere.position.set(x, y, z);
            sphere.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            sphere.scale.setScalar(0.8 + Math.random() * 0.55);
            sphere.castShadow = true;
            sphere.receiveShadow = true;
            group.add(sphere);
            spheres.push(sphere);
        }
        
        // Add large central mass for cohesion
        const coreGeometry = new THREE.SphereGeometry(mainSize * 1.2, 16, 16);
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: comp.color,
            metalness: 0.05,
            roughness: 0.9,
            emissive: 0x0a2a1a,
            emissiveIntensity: 0.05,
            transparent: true,
            opacity: 0.3
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.castShadow = true;
        core.receiveShadow = true;
        group.add(core);
        
        // Add tunnel structures (torus knots as active sites)
        const tunnelMaterial = new THREE.MeshStandardMaterial({
            color: 0x00aa44,
            metalness: 0.4,
            roughness: 0.85,
            emissive: 0x00ff88,
            emissiveIntensity: 0.12,
            flatShading: true
        });
        
        // Tunnel 1 - entry tunnel (vertical)
        const tunnel1Geometry = new THREE.TorusKnotGeometry(mainSize * 0.42, mainSize * 0.12, 128, 16, 2, 3);
        const tunnel1 = new THREE.Mesh(tunnel1Geometry, tunnelMaterial);
        tunnel1.rotation.x = Math.PI / 2;
        tunnel1.position.y = mainSize * 0.55;
        tunnel1.castShadow = true;
        tunnel1.receiveShadow = true;
        group.add(tunnel1);
        
        // Tunnel 2 - exit tunnel (angled)
        const tunnel2Geometry = new THREE.TorusKnotGeometry(mainSize * 0.36, mainSize * 0.1, 128, 14, 3, 4);
        const tunnel2 = new THREE.Mesh(tunnel2Geometry, tunnelMaterial);
        tunnel2.rotation.x = Math.PI / 3;
        tunnel2.rotation.z = Math.PI / 4;
        tunnel2.position.set(mainSize * 0.45, -mainSize * 0.22, mainSize * 0.46);
        tunnel2.castShadow = true;
        tunnel2.receiveShadow = true;
        group.add(tunnel2);
        
        // Tunnel 3 - peptide transferase center (small, central)
        const tunnel3Geometry = new THREE.TorusKnotGeometry(mainSize * 0.26, mainSize * 0.08, 96, 12, 2, 5);
        const tunnel3Material = new THREE.MeshStandardMaterial({
            color: 0xff6b9d,
            metalness: 0.5,
            roughness: 0.7,
            emissive: 0xff3388,
            emissiveIntensity: 0.16,
            flatShading: true
        });
        const tunnel3 = new THREE.Mesh(tunnel3Geometry, tunnel3Material);
        tunnel3.rotation.y = Math.PI / 6;
        tunnel3.position.set(-mainSize * 0.2, 0, -mainSize * 0.3);
        tunnel3.castShadow = true;
        tunnel3.receiveShadow = true;
        group.add(tunnel3);

        // Small outer grains to make the surface feel more particulate.
        for (let i = 0; i < 18; i++) {
            const grainGeometry = new THREE.SphereGeometry(mainSize * (0.08 + Math.random() * 0.06), 8, 8);
            const grain = new THREE.Mesh(grainGeometry, grainMaterial);
            const angle = Math.random() * Math.PI * 2;
            const height = (Math.random() - 0.5) * mainSize * 1.7;
            const radius = mainSize * (0.65 + Math.random() * 0.35);
            grain.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            grain.scale.setScalar(0.7 + Math.random() * 0.8);
            grain.castShadow = true;
            grain.receiveShadow = true;
            group.add(grain);
        }
        
        group.position.set(comp.x, comp.y, comp.z);
        group.userData = {
            name: comp.name,
            info: comp.info,
            color: comp.color,
            originalColor: comp.color,
            isRibosome: true
        };
        
        return group;
    }

    createRNAMolecule(comp) {
        const group = new THREE.Group();
        const baseCount = 40;
        const baseSpacing = 1.5;
        
        // Generate a curve with secondary structure loops and kinks
        const curvePoints = [];
        let y = -baseCount * baseSpacing / 2;
        
        for (let i = 0; i < baseCount; i++) {
            // Random kinks using sine/cosine waves at different frequencies
            const wave1 = Math.sin(i * 0.15) * 3;
            const wave2 = Math.cos(i * 0.08) * 2;
            const wave3 = Math.sin(i * 0.25) * 2.5;
            
            const x = wave1 + Math.sin(i * 0.3) * 1.5;
            const z = wave2 + Math.cos(i * 0.2) * 1.8 + wave3;
            
            curvePoints.push(new THREE.Vector3(x, y, z));
            y += baseSpacing;
        }
        
        const curve = new THREE.CatmullRomCurve3(curvePoints);
        curve.curveType = 'catmullrom';
        
        // Backbone material - orange with emission
        const backboneMaterial = new THREE.MeshStandardMaterial({
            color: 0xff9933,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3,
            metalness: 0.2,
            roughness: 0.6
        });
        
        // Create backbone as TubeGeometry
        const backboneGeometry = new THREE.TubeGeometry(curve, 60, 0.5, 12);
        const backbone = new THREE.Mesh(backboneGeometry, backboneMaterial);
        backbone.castShadow = true;
        backbone.receiveShadow = true;
        group.add(backbone);
        
        // Base colors: A=red, U=cyan, G=green, C=yellow
        const baseColors = {
            'A': 0xff3333,
            'U': 0x00ddff,
            'G': 0x33ff33,
            'C': 0xffdd00
        };
        const baseSequence = ['A', 'U', 'G', 'C', 'A', 'U', 'G', 'U', 'A', 'C'];
        
        // Add bases at regular intervals
        const baseMaterial = new THREE.MeshStandardMaterial({
            metalness: 0.3,
            roughness: 0.4
        });
        
        for (let i = 0; i < baseCount; i += 3) {
            const t = i / baseCount;
            const point = curve.getPoint(t);
            const tangent = curve.getTangent(t).normalize();
            
            // Offset base perpendicular to tangent
            const perpendicular = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
            const basePosition = point.clone().addScaledVector(perpendicular, 2.5);
            
            const baseType = baseSequence[i % baseSequence.length];
            const baseColor = baseColors[baseType];
            
            const baseGeometry = new THREE.SphereGeometry(0.8, 16, 16);
            const baseMat = new THREE.MeshStandardMaterial({
                color: baseColor,
                metalness: 0.3,
                roughness: 0.5,
                emissive: baseColor,
                emissiveIntensity: 0.1
            });
            
            const base = new THREE.Mesh(baseGeometry, baseMat);
            base.position.copy(basePosition);
            base.castShadow = true;
            base.receiveShadow = true;
            base.userData = {
                name: `Base ${baseType}`,
                info: `RNA base: ${baseType}`,
                color: baseColor
            };
            
            group.add(base);
        }
        
        group.position.set(comp.x, comp.y, comp.z);
        group.userData = {
            name: comp.name,
            info: comp.info,
            color: comp.color,
            originalColor: comp.color,
            isRNA: true
        };
        
        return group;
    }

    createDNAHelix(comp) {
        const group = new THREE.Group();
        const loader = new GLTFLoader();
        
        // Try to load external glTF model
        loader.load(
            './models/dna.glb',
            (gltf) => {
                const model = gltf.scene;
                model.scale.set(comp.size / 10, comp.size / 10, comp.size / 10);
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (child.material) {
                            child.material.metalness = 0.4;
                            child.material.roughness = 0.5;
                        }
                    }
                });
                group.clear();
                group.add(model);
            },
            undefined,
            () => {
                // Fallback: create procedural DNA if model load fails
                this.createProceduralDNA(group, comp);
            }
        );

        // Create procedural DNA immediately as fallback
        this.createProceduralDNA(group, comp);

        group.position.set(comp.x, comp.y, comp.z);
        group.userData = {
            name: comp.name,
            info: comp.info,
            color: comp.color,
            originalColor: comp.color,
            isDNAHelix: true
        };

        return group;
    }

    createProceduralDNA(group, comp) {
        const radius = comp.size / 5;
        const pitch = comp.size / 2;
        const turns = 3;
        const segments = 200;
        const basePairSpacing = 0.2;

        const curve1Points = [];
        const curve2Points = [];

        for (let i = 0; i <= segments; i++) {
            const t = (i / segments) * Math.PI * 2 * turns;
            const y = (i / segments) * pitch - pitch * turns / 2;
            const x1 = Math.cos(t) * radius;
            const z1 = Math.sin(t) * radius;
            const x2 = Math.cos(t + Math.PI) * radius;
            const z2 = Math.sin(t + Math.PI) * radius;

            curve1Points.push(new THREE.Vector3(x1, y, z1));
            curve2Points.push(new THREE.Vector3(x2, y, z2));
        }

        const curve1 = new THREE.CatmullRomCurve3(curve1Points);
        const curve2 = new THREE.CatmullRomCurve3(curve2Points);

        const backboneMaterial1 = new THREE.MeshStandardMaterial({
            color: 0x0088ff,
            metalness: 0.3,
            roughness: 0.5,
            emissive: 0x000000
        });
        const backboneMaterial2 = new THREE.MeshStandardMaterial({
            color: 0xff4444,
            metalness: 0.3,
            roughness: 0.5,
            emissive: 0x000000
        });
        const basePairMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7,
            metalness: 0.2,
            roughness: 0.6,
            emissive: 0x000000
        });

        const tube1 = new THREE.TubeGeometry(curve1, 40, 0.4, 12);
        const tube2 = new THREE.TubeGeometry(curve2, 40, 0.4, 12);

        const backbone1 = new THREE.Mesh(tube1, backboneMaterial1);
        const backbone2 = new THREE.Mesh(tube2, backboneMaterial2);

        backbone1.castShadow = true;
        backbone1.receiveShadow = true;
        backbone2.castShadow = true;
        backbone2.receiveShadow = true;

        group.add(backbone1);
        group.add(backbone2);

        for (let i = 0; i <= segments; i += Math.ceil(segments * basePairSpacing)) {
            const t1 = (i / segments);
            const point1 = curve1.getPoint(t1);
            const point2 = curve2.getPoint(t1);

            const basePairGeometry = new THREE.CylinderGeometry(0.15, 0.15, radius * 2, 8);
            const basePair = new THREE.Mesh(basePairGeometry, basePairMaterial);

            const midpoint = new THREE.Vector3().addVectors(point1, point2).multiplyScalar(0.5);
            basePair.position.copy(midpoint);
            basePair.lookAt(point1);
            basePair.rotateZ(Math.PI / 2);

            basePair.castShadow = true;
            basePair.receiveShadow = true;

            group.add(basePair);
        }
    }

    renderComponents(components) {
        components.forEach(comp => {
            let geometry;
            
            if (comp.type === 'dna-helix') {
                const group = this.createDNAHelix(comp);
                this.scene.add(group);
                this.components.push(group);
                return;
            }
            
            if (comp.type === 'ribosome-model') {
                const group = this.createRibosomeMesh(comp);
                this.scene.add(group);
                this.components.push(group);
                return;
            }
            
            if (comp.type === 'rna-chain') {
                const group = this.createRNAMolecule(comp);
                this.scene.add(group);
                this.components.push(group);
                return;
            }
            
            switch (comp.type) {
                case 'sphere':
                    geometry = new THREE.SphereGeometry(comp.size, 64, 64);
                    break;
                case 'box':
                    geometry = new THREE.BoxGeometry(comp.size * 1.5, comp.size, comp.size);
                    break;
                case 'torus':
                    geometry = new THREE.TorusGeometry(comp.size, comp.size * 0.4, 16, 64);
                    break;
                case 'cylinder':
                    geometry = new THREE.CylinderGeometry(comp.size * 0.3, comp.size * 0.3, comp.size * 2, 32);
                    break;
                case 'cone':
                    geometry = new THREE.ConeGeometry(comp.size * 0.4, comp.size * 2, 32);
                    break;
                case 'octahedron':
                    geometry = new THREE.OctahedronGeometry(comp.size);
                    break;
                default:
                    geometry = new THREE.SphereGeometry(comp.size, 32, 32);
            }

            const material = new THREE.MeshPhongMaterial({
                color: comp.color,
                emissive: 0x000000,
                shininess: 100,
                wireframe: false
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(comp.x, comp.y, comp.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = {
                name: comp.name,
                info: comp.info,
                color: comp.color,
                originalColor: comp.color
            };
            mesh.name = comp.name;

            this.scene.add(mesh);
            this.components.push(mesh);
        });

        this.resetCamera();
    }

    onCanvasClick(event) {
        const canvas = document.getElementById('canvas3d');
        const rect = canvas.getBoundingClientRect();

        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        // Use recursive flag to detect children of Groups (ribosome, DNA, RNA)
        const intersects = this.raycaster.intersectObjects(this.components, true);

        if (intersects.length > 0) {
            let targetObject = intersects[0].object;
            
            // Traverse up to find the parent Group if clicking on a child
            while (targetObject.parent && targetObject.parent !== this.scene) {
                if (targetObject.userData?.name || targetObject.parent.userData?.name) {
                    // Found a proper object with userData
                    if (targetObject.userData?.name) {
                        break;
                    }
                    targetObject = targetObject.parent;
                    break;
                }
                targetObject = targetObject.parent;
            }
            
            this.selectObject(targetObject);
        }
    }

    onCanvasMouseMove(event) {
        const canvas = document.getElementById('canvas3d');
        const rect = canvas.getBoundingClientRect();

        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.pointerClient.x = event.clientX;
        this.pointerClient.y = event.clientY;
        this.pointerValid = true;
    }

    updateHoverTarget() {
        if (!this.hoverMarker || !this.pointerValid) return;

        const targets = [...this.components, ...this.modelComponents];
        let closestHit = null;

        this.raycaster.setFromCamera(this.pointer, this.camera);

        targets.forEach((mesh) => {
            const hits = this.raycaster.intersectObject(mesh, true);
            if (hits.length > 0 && (!closestHit || hits[0].distance < closestHit.distance)) {
                closestHit = hits[0];
            }
        });

        const tooltip = document.getElementById('hoverTooltip');

        if (closestHit) {
            const hitObject = closestHit.object;
            let dataSource = hitObject;
            
            // For compound objects (Groups), traverse up to find userData
            if (!hitObject.userData?.name && hitObject.parent) {
                dataSource = hitObject.parent;
                while (!dataSource.userData?.name && dataSource.parent && dataSource.parent.type === 'Group') {
                    dataSource = dataSource.parent;
                }
            }
            
            const surfacePoint = closestHit.point.clone();
            const surfaceNormal = closestHit.face
                ? closestHit.face.normal.clone().transformDirection(hitObject.matrixWorld)
                : new THREE.Vector3(0, 1, 0);

            surfacePoint.addScaledVector(surfaceNormal, 0.8);
            this.hoverMarker.position.copy(surfacePoint);
            this.hoverMarker.visible = true;

            if (this.hoveredObject !== dataSource) {
                this.hoveredObject = dataSource;
                tooltip.textContent = dataSource.userData?.name || dataSource.name || 'Biological part';
                tooltip.classList.add('visible');
            }

            tooltip.style.left = `${this.pointerClient.x + 14}px`;
            tooltip.style.top = `${this.pointerClient.y + 14}px`;
        } else {
            this.hoverMarker.visible = false;
            this.hoveredObject = null;
            tooltip.classList.remove('visible');
        }
    }

    selectObject(obj) {
        // Deselect previous
        if (this.selectedObject) {
            if (this.selectedObject.material) {
                this.selectedObject.material.emissive.setHex(0x000000);
            } else if (this.selectedObject.children) {
                // For Groups, reset all children
                this.selectedObject.traverse(child => {
                    if (child.material && child.material.emissive) {
                        child.material.emissive.setHex(0x000000);
                    }
                });
            }
        }

        // Select new
        this.selectedObject = obj;
        
        if (obj.material) {
            // Single mesh
            obj.material.emissive.setHex(obj.userData.color);
            obj.material.emissive.multiplyScalar(0.4);
        } else if (obj.children) {
            // Group - highlight all children
            obj.traverse(child => {
                if (child.material && child.material.emissive && child !== obj) {
                    const highlightColor = obj.userData.color || 0xffffff;
                    child.material.emissive.setHex(highlightColor);
                    child.material.emissive.multiplyScalar(0.2);
                }
            });
        }

        this.updateInfoPanel(obj.userData);
    }

    updateInfoPanel(data) {
        document.getElementById('infoContent').innerHTML = `
            <strong>${data.name}</strong>
            <p style="margin-top: 8px; font-size: 11px; line-height: 1.5;">${data.info}</p>
        `;
    }

    setDifficulty(level, btn) {
        this.difficulty = level;
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        if (btn) {
            btn.classList.add('active');
        } else {
            // Fallback: find and activate the button with matching text
            document.querySelectorAll('.difficulty-btn').forEach(b => {
                if (b.textContent.includes(level.charAt(0).toUpperCase() + level.slice(1))) {
                    b.classList.add('active');
                }
            });
        }

        const difficultyContent = {
            beginner: 'Basic structure and fundamental concepts',
            intermediate: 'Advanced mechanisms and detailed properties',
            expert: 'Research-level with kinetic rates and thermodynamics'
        };
        document.getElementById('overlayInfo').textContent = difficultyContent[level];
    }

    setMode(mode, btn) {
        this.currentMode = mode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        if (btn) {
            btn.classList.add('active');
        } else {
            // Fallback: find and activate the button with matching mode
            document.querySelectorAll('.mode-btn').forEach(b => {
                if (b.textContent.toLowerCase().includes(mode.toLowerCase())) {
                    b.classList.add('active');
                }
            });
        }

        document.getElementById('builderSection').style.display = 'none';
        document.getElementById('simulationSection').style.display = 'none';
        document.getElementById('experimentSection').style.display = 'none';

        switch (mode) {
            case 'build':
                document.getElementById('builderSection').style.display = 'block';
                break;
            case 'simulate':
                document.getElementById('simulationSection').style.display = 'block';
                break;
            case 'experiment':
                document.getElementById('experimentSection').style.display = 'block';
                break;
        }
    }

    addComponent(componentName) {
        const colors = {
            nucleus: 0xb366ff,
            mitochondria: 0xff6b3d,
            protein: 0x00d4ff,
            dna: 0xb366ff,
            ribosome: 0x00ff88,
            enzyme: 0x3d7aff
        };

        const geometry = new THREE.SphereGeometry(8, 32, 32);
        const material = new THREE.MeshPhongMaterial({ color: colors[componentName] || 0x00d4ff });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(
            Math.random() * 40 - 20,
            Math.random() * 40 - 20,
            Math.random() * 20 - 10
        );

        mesh.userData = {
            name: componentName,
            info: `Custom ${componentName} component`,
            color: colors[componentName]
        };

        this.scene.add(mesh);
        this.modelComponents.push(mesh);
        this.showStatus(`Added ${componentName} to model`, 'success');
    }

    clearScene() {
        this.components.forEach(comp => this.scene.remove(comp));
        this.modelComponents.forEach(comp => this.scene.remove(comp));
        this.components = [];
        this.modelComponents = [];
        this.selectedObject = null;
        this.hoveredObject = null;
        if (this.hoverMarker) {
            this.hoverMarker.visible = false;
        }
        this.showStatus('Scene cleared', 'success');
    }

    saveModel() {
        const modelData = {
            timestamp: new Date().toISOString(),
            module: this.currentModule,
            components: this.modelComponents.map(comp => ({
                name: comp.userData.name,
                position: [comp.position.x, comp.position.y, comp.position.z],
                color: comp.userData.color
            }))
        };

        localStorage.setItem('biolab_model_' + Date.now(), JSON.stringify(modelData));
        this.showStatus('Model saved successfully to browser storage', 'success');
    }

    updateSimParameter(param, value) {
        this.simulation[param] = parseFloat(value);
        document.getElementById(param === 'temperature' ? 'tempValue' : param === 'pH' ? 'phValue' : 'concValue').textContent = value;
    }

    startSimulation() {
        this.simulation.running = true;
        this.simulation.time = 0;
        this.showStatus(`Simulation started: Temp ${this.simulation.temperature}°C, pH ${this.simulation.pH}, Conc ${this.simulation.concentration}%`, 'success');
        this.animateSimulation();
    }

    pauseSimulation() {
        this.simulation.running = false;
        if (this.simulation.animationFrameId) {
            cancelAnimationFrame(this.simulation.animationFrameId);
        }
        this.showStatus('Simulation paused', 'warning');
    }

    animateSimulation() {
        if (!this.simulation.running) return;

        this.simulation.time += 0.05;

        const tempEffect = (this.simulation.temperature - 37) * 0.02;
        const phEffect = Math.abs(this.simulation.pH - 7.4) * -0.05;
        const behavior = tempEffect + phEffect;

        this.components.forEach(comp => {
            comp.rotation.x += 0.01 * (1 + behavior);
            comp.rotation.y += 0.015 * (1 + behavior);
            comp.position.y += Math.sin(this.simulation.time * 0.1 + comp.position.x * 0.05) * 0.05;
        });

        this.simulation.animationFrameId = requestAnimationFrame(() => this.animateSimulation());
    }

    generateAISuggestion(type) {
        const suggestions = {
            hypothesis: `Based on ${this.models[this.currentModule].title}, here's a testable hypothesis for ${this.difficulty} level: "The interaction rate increases proportionally with concentration until saturation occurs, following Michaelis-Menten kinetics."`,
            protocol: `Experimental Protocol (${this.difficulty}):\n1. Prepare reagents according to specifications\n2. Establish baseline measurements\n3. Systematically vary key parameters\n4. Collect quantitative data at time intervals\n5. Perform statistical analysis`,
            analysis: `Data Analysis (${this.difficulty}):\nUse non-linear regression to fit your experimental data. Calculate kinetic parameters. Generate publication-quality figures with proper statistical reporting.`
        };

        const output = document.getElementById('aiOutput');
        output.innerHTML = `<div class="info-card" style="margin-top: 10px;"><strong>AI Suggestion</strong><p style="margin-top: 6px; white-space: pre-wrap;">${suggestions[type]}</p></div>`;
    }

    generateExperiment(type) {
        fetch('/api/ai/experiment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                module: this.currentModule,
                difficulty: this.difficulty
            })
        })
        .then(res => res.json())
        .then(data => {
            const output = document.getElementById('aiOutput');
            if (type === 'hypothesis') {
                output.innerHTML = `<div class="info-card" style="margin-top: 10px;"><strong>Generated Hypothesis</strong><p style="margin-top: 6px; white-space: pre-wrap;">${data.hypothesis}</p></div>`;
            } else if (type === 'protocol') {
                output.innerHTML = `<div class="info-card" style="margin-top: 10px;"><strong>Experimental Protocol</strong><p style="margin-top: 6px; white-space: pre-wrap;">${data.protocol}</p></div>`;
            } else if (type === 'analysis') {
                output.innerHTML = `<div class="info-card" style="margin-top: 10px;"><strong>Data Analysis Framework</strong><p style="margin-top: 6px; white-space: pre-wrap;">Analysis approach for ${this.difficulty} level...</p></div>`;
            }
            this.showStatus('AI generated suggestion', 'success');
        })
        .catch(err => {
            console.error('API Error:', err);
            this.generateAISuggestion(type === 'hypothesis' ? 'hypothesis' : type === 'protocol' ? 'protocol' : 'analysis');
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        event.target.classList.add('active');
        document.getElementById(tabName + '-tab').classList.add('active');
    }

    showStatus(message, type = 'success') {
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message ${type}`;
        statusDiv.textContent = message;
        
        const rightSidebar = document.querySelector('.sidebar-right');
        rightSidebar.appendChild(statusDiv);
        
        setTimeout(() => statusDiv.remove(), 3000);
    }

    updateProgress() {
        if (!this.completedModules.includes(this.currentModule)) {
            this.completedModules.push(this.currentModule);
        }
        const progress = (this.completedModules.length / 8) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('progressText').textContent = `${this.completedModules.length} / 8`;
    }

    resetCamera() {
        this.camera.position.z = 60;
        this.camera.lookAt(0, 0, 0);
    }

    onWindowResize() {
        const canvas = document.getElementById('canvas3d');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.controls) {
            this.controls.update();
        }

        this.updateHoverTarget();

        if (this.idleRotationEnabled && !this.simulation.running && !this.controlsInteracting) {
            this.components.forEach(comp => {
                if (comp !== this.selectedObject) {
                    if (comp.userData?.isDNAHelix) {
                        comp.rotation.y += 0.004;
                        comp.rotation.x += 0.0005;
                    } else if (comp.userData?.isRNA) {
                        comp.rotation.x += 0.002;
                        comp.rotation.z += 0.003;
                    } else if (comp.userData?.isRibosome) {
                        comp.rotation.y += 0.002;
                        comp.rotation.x += 0.0015;
                        comp.rotation.z += 0.001;
                    } else {
                        comp.rotation.x += 0.001;
                        comp.rotation.y += 0.002;
                    }
                }
            });
        }

        this.renderer.render(this.scene, this.camera);
    }

    setupEventListeners() {
        const canvas = document.getElementById('canvas3d');

        canvas.addEventListener('mouseleave', () => {
            this.hoverMarker.visible = false;
            this.hoveredObject = null;
            this.pointerValid = false;
            document.getElementById('hoverTooltip').classList.remove('visible');
        });

        document.querySelectorAll('.module-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.module-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }
}

// Initialize application when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new BioLabProApp();
    window.app = app;
    console.log('BioLab Studio Pro initialized successfully');
});
