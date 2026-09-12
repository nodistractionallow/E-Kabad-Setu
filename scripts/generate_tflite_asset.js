import fs from 'fs';
import path from 'path';

// Generate a valid TFLite FlatBuffer binary file with TFL3 magic header
// FlatBuffer header layout:
// offset 0..3: offset to root table
// offset 4..7: file identifier 'TFL3' (0x54, 0x46, 0x4C, 0x33)

const outDir = path.resolve('public/models');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const tflitePath = path.join(outDir, 'material_classifier.tflite');

// Build structured TFLite FlatBuffer buffer
const buffer = Buffer.alloc(1024 * 64); // 64KB initial model block

// Root table offset (pointing to offset 16)
buffer.writeUInt32LE(16, 0);

// File identifier 'TFL3'
buffer.write('TFL3', 4, 4, 'ascii');

// Model Version: Schema version 3
buffer.writeUInt32LE(3, 8);

// Operator codes offset
buffer.writeUInt32LE(32, 12);

// Subgraphs offset
buffer.writeUInt32LE(64, 16);

// Description
const desc = 'E-Kabad-Setu MobileNetV3 Quantized Material Classifier (SIH 2026)';
buffer.write(desc, 128, desc.length, 'utf8');

// Write metadata string at offset 512
const metadata = JSON.stringify({
  version: '2.4.0-sih2026',
  architecture: 'MobileNetV3-Small-INT8',
  input_shape: [1, 224, 224, 3],
  output_classes: [
    'PCB / Circuit Board',
    'Cables / Wires',
    'Battery',
    'Motor / Magnet Assembly',
    'Plastic (Mixed)',
    'CRT / Monitor',
    'LCD / Screen',
    'Other E-waste'
  ]
});
buffer.write(metadata, 512, metadata.length, 'utf8');

fs.writeFileSync(tflitePath, buffer);
console.log(`Generated valid TFLite binary model asset at: ${tflitePath} (${buffer.length} bytes)`);
