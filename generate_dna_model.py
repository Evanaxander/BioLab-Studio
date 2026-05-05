"""
Generate a DNA double helix glTF model
Uses pyassimp to create and export 3D geometry
"""

import struct
import json
import math
import os

def create_dna_gltf():
    """Create a minimal glTF/GLB DNA model"""
    
    # Create vertices for DNA double helix
    vertices = []
    indices = []
    
    # DNA helix parameters
    radius = 2.0
    pitch = 4.0
    turns = 3.0
    segments = 80
    tube_segments = 8
    
    # Generate backbone curves
    vertex_offset = 0
    
    # Strand 1 (blue)
    for i in range(segments + 1):
        t = (i / segments) * math.pi * 2 * turns
        y = (i / segments) * pitch - pitch * turns / 2
        
        for j in range(tube_segments):
            angle = (j / tube_segments) * math.pi * 2
            x = (radius + 0.3 * math.cos(angle)) * math.cos(t)
            z = (radius + 0.3 * math.cos(angle)) * math.sin(t)
            vertices.append([x, y, z])
    
    # Create triangles for strand 1
    for i in range(segments):
        for j in range(tube_segments):
            j_next = (j + 1) % tube_segments
            
            # First vertex of first ring
            v0 = i * tube_segments + j
            v1 = i * tube_segments + j_next
            v2 = (i + 1) * tube_segments + j_next
            v3 = (i + 1) * tube_segments + j
            
            # Two triangles per quad
            indices.extend([v0, v1, v2, v0, v2, v3])
    
    vertex_offset = len(vertices)
    
    # Strand 2 (red) - opposite side
    for i in range(segments + 1):
        t = (i / segments) * math.pi * 2 * turns + math.pi
        y = (i / segments) * pitch - pitch * turns / 2
        
        for j in range(tube_segments):
            angle = (j / tube_segments) * math.pi * 2
            x = (radius + 0.3 * math.cos(angle)) * math.cos(t)
            z = (radius + 0.3 * math.cos(angle)) * math.sin(t)
            vertices.append([x, y, z])
    
    # Create triangles for strand 2
    for i in range(segments):
        for j in range(tube_segments):
            j_next = (j + 1) % tube_segments
            
            v0 = vertex_offset + i * tube_segments + j
            v1 = vertex_offset + i * tube_segments + j_next
            v2 = vertex_offset + (i + 1) * tube_segments + j_next
            v3 = vertex_offset + (i + 1) * tube_segments + j
            
            indices.extend([v0, v1, v2, v0, v2, v3])
    
    # Normalize vertices to [-1, 1]
    flat_vertices = [v for vertex in vertices for v in vertex]
    
    # Create GLB file (binary glTF)
    # GLB header
    glb_data = bytearray()
    
    # GLB magic number
    glb_data.extend(b'glTF')
    
    # Version 2
    glb_data.extend(struct.pack('<I', 2))
    
    # We'll fill in total length later
    total_length_offset = len(glb_data)
    glb_data.extend(struct.pack('<I', 0))  # Placeholder for total length
    
    # JSON chunk header
    json_chunk_offset = len(glb_data)
    json_data = {
        "asset": {"version": "2.0"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0}],
        "meshes": [{
            "primitives": [
                {"attributes": {"POSITION": 0}, "indices": 1, "material": 0},
                {"attributes": {"POSITION": 2}, "indices": 3, "material": 1}
            ]
        }],
        "materials": [
            {"pbrMetallicRoughness": {"baseColorFactor": [0, 0.533, 1, 1]}, "metallic": 0.4, "roughness": 0.5},
            {"pbrMetallicRoughness": {"baseColorFactor": [1, 0.267, 0.267, 1]}, "metallic": 0.4, "roughness": 0.5}
        ],
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": len(vertices), "type": "VEC3", "min": [-2.5, -6, -2.5], "max": [2.5, 6, 2.5]},
            {"bufferView": 1, "componentType": 5125, "count": len(indices) // 2, "type": "SCALAR"},
            {"bufferView": 2, "componentType": 5126, "count": len(vertices), "type": "VEC3", "min": [-2.5, -6, -2.5], "max": [2.5, 6, 2.5]},
            {"bufferView": 3, "componentType": 5125, "count": len(indices) // 2, "type": "SCALAR"}
        ],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": len(flat_vertices) * 4, "target": 34962},
            {"buffer": 0, "byteOffset": len(flat_vertices) * 4, "byteLength": len(indices) // 2 * 4, "target": 34963},
            {"buffer": 0, "byteOffset": len(flat_vertices) * 4 + len(indices) // 2 * 4, "byteLength": len(flat_vertices) * 4, "target": 34962},
            {"buffer": 0, "byteOffset": 2 * len(flat_vertices) * 4 + len(indices) // 2 * 4, "byteLength": len(indices) // 2 * 4, "target": 34963}
        ],
        "buffers": [{"byteLength": 2 * len(flat_vertices) * 4 + 2 * len(indices) // 2 * 4}]
    }
    
    json_str = json.dumps(json_data, separators=(',', ':'))
    json_bytes = json_str.encode('utf-8')
    
    # Pad JSON to 4-byte alignment
    json_padding = (4 - (len(json_bytes) % 4)) % 4
    json_bytes += b' ' * json_padding
    
    glb_data.extend(struct.pack('<I', len(json_bytes) + 8))  # Chunk length
    glb_data.extend(b'JSON')
    glb_data.extend(json_bytes)
    
    # Binary chunk
    bin_data = bytearray()
    
    # Add vertices for both strands
    for v in flat_vertices:
        bin_data.extend(struct.pack('<f', v))
    
    # Add indices
    for i in range(len(indices) // 2):
        bin_data.extend(struct.pack('<I', indices[i]))
    
    # Repeat vertices and indices for second material
    for v in flat_vertices:
        bin_data.extend(struct.pack('<f', v))
    
    for i in range(len(indices) // 2, len(indices)):
        bin_data.extend(struct.pack('<I', indices[i] - vertex_offset))
    
    glb_data.extend(struct.pack('<I', len(bin_data) + 8))  # Chunk length
    glb_data.extend(b'BIN\x00')
    glb_data.extend(bin_data)
    
    # Update total length
    struct.pack_into('<I', glb_data, total_length_offset, len(glb_data))
    
    # Write file
    os.makedirs('public/models', exist_ok=True)
    with open('public/models/dna.glb', 'wb') as f:
        f.write(glb_data)
    
    print(f"✓ Created DNA model: public/models/dna.glb ({len(glb_data)} bytes)")

if __name__ == '__main__':
    create_dna_gltf()
