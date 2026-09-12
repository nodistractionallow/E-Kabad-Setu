/**
 * SIH 2026 Live Demo Test Image Generators
 * Generates verified canvas images to showcase strict Quality Gate rules & classification live to judges.
 */

export function generateDarkPhoto(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d')!;
  
  // Very dark underexposed image (brightness ~ 18)
  ctx.fillStyle = '#141416';
  ctx.fillRect(0, 0, 320, 240);
  
  // Faint dark outline barely visible in dark room
  ctx.fillStyle = '#1e1e24';
  ctx.fillRect(80, 60, 160, 120);
  
  return canvas.toDataURL('image/jpeg', 0.9);
}

export function generateBlurryPhoto(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d')!;
  
  // Smooth blurred gradient with no sharp edges (Laplacian variance < 20)
  const grad = ctx.createRadialGradient(160, 120, 10, 160, 120, 180);
  grad.addColorStop(0, '#94a3b8');
  grad.addColorStop(0.5, '#64748b');
  grad.addColorStop(1, '#475569');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 320, 240);
  
  return canvas.toDataURL('image/jpeg', 0.9);
}

export function generateFacePhoto(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d')!;
  
  // Neutral background
  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, 320, 240);
  
  // Draw human portrait head and shoulders
  // Hair
  ctx.fillStyle = '#1e1b18';
  ctx.beginPath();
  ctx.arc(160, 95, 62, Math.PI, 0, false);
  ctx.fill();

  // Face oval (Skin tone: R: 215, G: 160, B: 125 in valid Indian skin locus)
  ctx.fillStyle = '#d7a07d';
  ctx.beginPath();
  ctx.ellipse(160, 115, 48, 65, 0, 0, 2 * Math.PI);
  ctx.fill();

  // Eyes and Eyebrows (Dark valleys in upper third)
  ctx.fillStyle = '#2d241e';
  // Left eye & brow
  ctx.fillRect(135, 95, 14, 4);
  ctx.beginPath();
  ctx.ellipse(142, 105, 7, 4, 0, 0, 2 * Math.PI);
  ctx.fill();
  // Right eye & brow
  ctx.fillRect(171, 95, 14, 4);
  ctx.beginPath();
  ctx.ellipse(178, 105, 7, 4, 0, 0, 2 * Math.PI);
  ctx.fill();

  // Nose shadow
  ctx.fillStyle = '#be8564';
  ctx.beginPath();
  ctx.moveTo(160, 108);
  ctx.lineTo(156, 126);
  ctx.lineTo(164, 126);
  ctx.closePath();
  ctx.fill();

  // Mouth valley in lower third
  ctx.fillStyle = '#994d4d';
  ctx.beginPath();
  ctx.ellipse(160, 145, 15, 5, 0, 0, 2 * Math.PI);
  ctx.fill();

  // Shirt / shoulders
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.ellipse(160, 230, 90, 45, 0, 0, 2 * Math.PI);
  ctx.fill();

  return canvas.toDataURL('image/jpeg', 0.9);
}

export function generateEmptyTablePhoto(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d')!;
  
  // Completely flat monotonous surface (wooden table / floor with zero scrap objects)
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, 320, 240);
  
  return canvas.toDataURL('image/jpeg', 0.9);
}

export function generateLowConfidencePhoto(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d')!;
  
  // Non-descript mixed geometry that doesn't clearly match any of the 8 e-waste categories
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, 320, 240);
  
  // Random gray patches
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(40, 50);
  ctx.lineTo(120, 80);
  ctx.lineTo(80, 160);
  ctx.fill();

  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(220, 140, 45, 0, 2 * Math.PI);
  ctx.fill();

  return canvas.toDataURL('image/jpeg', 0.9);
}

export function generatePcbPhoto(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d')!;
  
  // Green PCB substrate
  ctx.fillStyle = '#065f46';
  ctx.fillRect(0, 0, 320, 240);
  
  // Copper and gold circuit traces
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(30, 40); ctx.lineTo(120, 40); ctx.lineTo(160, 80); ctx.lineTo(280, 80);
  ctx.moveTo(40, 180); ctx.lineTo(140, 180); ctx.lineTo(180, 140); ctx.lineTo(290, 140);
  ctx.stroke();

  // IC chip in center
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(100, 75, 120, 90);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.strokeRect(100, 75, 120, 90);

  // Gold connector pins
  ctx.fillStyle = '#fbbf24';
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(110 + i * 13, 67, 7, 8);
    ctx.fillRect(110 + i * 13, 165, 7, 8);
  }

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('SERVER PCB', 122, 125);

  return canvas.toDataURL('image/jpeg', 0.9);
}

export function generateCablesPhoto(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d')!;
  
  // Dark industrial work mat
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 320, 240);

  // Bundle of thick copper cables
  const cableColors = ['#b45309', '#ea580c', '#d97706', '#ca8a04'];
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = cableColors[i % cableColors.length];
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(20, 40 + i * 30);
    ctx.bezierCurveTo(120, 80 + i * 20, 200, 20 + i * 25, 300, 60 + i * 30);
    ctx.stroke();
  }

  // Bare copper wire stripped tips (Bright reddish-orange copper)
  ctx.fillStyle = '#f97316';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(270, 52 + i * 30, 35, 14);
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}

export function generateBatteryPhoto(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d')!;
  
  // Neutral table
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 320, 240);

  // Silver pouch lithium battery pack
  ctx.fillStyle = '#64748b';
  ctx.fillRect(60, 50, 200, 140);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 50, 200, 140);

  // Battery terminal tabs
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(90, 32, 25, 18);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(205, 32, 25, 18);

  // Hazard warning label
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(100, 95, 120, 40);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('⚡ LI-ION BATTERY', 108, 120);

  return canvas.toDataURL('image/jpeg', 0.9);
}
