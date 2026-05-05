// Create a simple DNA glTF model programmatically
// This generates a minimal GLB file with a DNA double helix structure

import fs from 'fs';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// Create scene with DNA geometry
const scene = new THREE.Scene();

// Create DNA double helix
const radius = 2;
const pitch = 4;
const turns = 3;
const segments = 100;

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

// Materials
const mat1 = new THREE.MeshStandardMaterial({ color: 0x0088ff, metalness: 0.4, roughness: 0.5 });
const mat2 = new THREE.MeshStandardMaterial({ color: 0xff4444, metalness: 0.4, roughness: 0.5 });
const matBases = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.6 });

// Tubes
const tube1 = new THREE.TubeGeometry(curve1, 30, 0.3, 8);
const tube2 = new THREE.TubeGeometry(curve2, 30, 0.3, 8);

const backbone1 = new THREE.Mesh(tube1, mat1);
const backbone2 = new THREE.Mesh(tube2, mat2);

scene.add(backbone1);
scene.add(backbone2);

// Add base pairs
for (let i = 0; i <= segments; i += Math.ceil(segments * 0.2)) {
    const t1 = i / segments;
    const point1 = curve1.getPoint(t1);
    const point2 = curve2.getPoint(t1);

    const basePairGeometry = new THREE.CylinderGeometry(0.1, 0.1, radius * 2, 6);
    const basePair = new THREE.Mesh(basePairGeometry, matBases);

    const midpoint = new THREE.Vector3().addVectors(point1, point2).multiplyScalar(0.5);
    basePair.position.copy(midpoint);
    basePair.lookAt(point1);
    basePair.rotateZ(Math.PI / 2);

    scene.add(basePair);
}

// Export to GLB
const exporter = new GLTFExporter();

exporter.parse(
    scene,
    (gltf) => {
        if (gltf instanceof ArrayBuffer) {
            fs.writeFileSync('public/models/dna.glb', Buffer.from(gltf), (err) => {
                if (err) console.error('Write error:', err);
                else console.log('DNA model created: public/models/dna.glb');
            });
        }
    },
    (error) => {
        console.error('Export error:', error);
    },
    { binary: true }
);
