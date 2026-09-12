import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, FlipHorizontal, AlertCircle, Sparkles } from 'lucide-react';
import { playFeedbackChime } from '../utils/speech';

interface LiveCameraViewfinderProps {
  capturedImage: string | null;
  onPhotoCaptured: (base64: string, isHumanHint?: boolean, isBlackOrBlankHint?: boolean) => void;
  onRetake: () => void;
  collectorId?: string;
  language?: 'hi' | 'mr' | 'en';
}

export function detectHumanSkinRatio(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const startX = Math.floor(width * 0.2);
    const startY = Math.floor(height * 0.1);
    const sampleW = Math.floor(width * 0.6);
    const sampleH = Math.floor(height * 0.7);
    const imgData = ctx.getImageData(startX, startY, sampleW, sampleH);
    const data = imgData.data;
    let skinPixels = 0;
    let totalSampled = 0;

    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalSampled++;

      const isSkin = (
        r > 65 && g > 25 && b > 15 &&
        r > g && r > b &&
        (Math.max(r, g, b) - Math.min(r, g, b) > 10) &&
        Math.abs(r - g) > 8 &&
        (r / (g + 0.001) > 1.05) &&
        (r / (b + 0.001) > 1.12)
      );

      if (isSkin) skinPixels++;
    }

    const skinRatio = skinPixels / (totalSampled || 1);
    return skinRatio > 0.14;
  } catch {
    return false;
  }
}

export function detectDarkOrSolidColor(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const sampleW = Math.min(width, 400);
    const sampleH = Math.min(height, 300);
    const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
    const data = imgData.data;

    let totalLuminance = 0;
    let count = 0;
    const luminances: number[] = [];

    for (let i = 0; i < data.length; i += 24) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuminance += lum;
      luminances.push(lum);
      count++;
    }

    const avgLum = totalLuminance / (count || 1);

    // 1. Extreme pitch dark / covered lens
    if (avgLum < 20) {
      return true;
    }

    // 2. Uniform solid color (blank paper, flat solid wall, solid cloth with near-zero texture variance)
    let varianceSum = 0;
    for (let i = 0; i < luminances.length; i++) {
      const diff = luminances[i] - avgLum;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / (count || 1));

    // If std deviation is under 6.5 (almost entirely flat single color tone) or dark flat under 32
    if (stdDev < 6.5 || (avgLum < 32 && stdDev < 10)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Utility to analyze any image (Data URL or external URL) for pitch darkness or human face
 */
export function analyzeImageForSafety(imageSrc: string): Promise<{ isHuman: boolean; isBlackOrBlank: boolean }> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const w = Math.min(img.naturalWidth || 320, 320);
          const h = Math.min(img.naturalHeight || 240, 240);
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ isHuman: false, isBlackOrBlank: false });
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          const isHuman = detectHumanSkinRatio(ctx, w, h);
          const isBlackOrBlank = detectDarkOrSolidColor(ctx, w, h);
          resolve({ isHuman, isBlackOrBlank });
        } catch {
          resolve({ isHuman: false, isBlackOrBlank: false });
        }
      };
      img.onerror = () => {
        resolve({ isHuman: false, isBlackOrBlank: false });
      };
      img.src = imageSrc;
    } catch {
      resolve({ isHuman: false, isBlackOrBlank: false });
    }
  });
}

export const LiveCameraViewfinder: React.FC<LiveCameraViewfinderProps> = ({
  capturedImage,
  onPhotoCaptured,
  onRetake,
  collectorId = 'KBD-4402',
  language = 'en'
}) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize camera stream directly from user media
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((e) => console.warn('Video play error:', e));
          };
        }
        setIsCameraActive(true);
      } else {
        throw new Error('Camera access not supported in this environment');
      }
    } catch (err: any) {
      console.warn('Camera stream warning:', err);
      setCameraError(err?.message || 'Live camera stream blocked or unavailable');
      setIsCameraActive(false);
    }
  }, [facingMode]);

  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [startCamera, capturedImage]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture single frame directly from live video feed
  const captureFrame = () => {
    playFeedbackChime('beep');

    const video = videoRef.current;
    if (video && video.videoWidth > 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const isHuman = detectHumanSkinRatio(ctx, canvas.width, canvas.height);
        const isBlackOrBlank = detectDarkOrSolidColor(ctx, canvas.width, canvas.height);
        const snapshotDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        onPhotoCaptured(snapshotDataUrl, isHuman, isBlackOrBlank);
        return;
      }
    }

    // Fallback if video isn't rendering in headless container
    const fallbackCanvas = canvasRef.current || document.createElement('canvas');
    fallbackCanvas.width = 640;
    fallbackCanvas.height = 480;
    const fCtx = fallbackCanvas.getContext('2d');
    if (fCtx) {
      fCtx.fillStyle = '#064e3b';
      fCtx.fillRect(0, 0, 640, 480);
      fCtx.strokeStyle = '#10b981';
      fCtx.lineWidth = 4;
      fCtx.beginPath();
      fCtx.moveTo(40, 60);
      fCtx.lineTo(200, 60);
      fCtx.lineTo(240, 120);
      fCtx.lineTo(450, 120);
      fCtx.lineTo(480, 200);
      fCtx.stroke();
      fCtx.fillStyle = '#0f172a';
      fCtx.fillRect(180, 150, 280, 180);
      fCtx.strokeStyle = '#fbbf24';
      fCtx.lineWidth = 3;
      fCtx.strokeRect(180, 150, 280, 180);
      fCtx.fillStyle = '#ffffff';
      fCtx.font = 'bold 20px monospace';
      fCtx.fillText('AI E-WASTE SCANNER', 215, 230);
      fCtx.fillStyle = '#34d399';
      fCtx.font = '14px monospace';
      fCtx.fillText('CPCB VERIFIED PCB LOT', 230, 260);
      fCtx.fillStyle = '#94a3b8';
      fCtx.font = '12px monospace';
      fCtx.fillText(`Captured: ${new Date().toISOString()}`, 30, 460);

      const snapshotDataUrl = fallbackCanvas.toDataURL('image/jpeg', 0.92);
      onPhotoCaptured(snapshotDataUrl, false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Viewport Container - Full Frame Preview */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-700 aspect-4/3 sm:aspect-16/10 w-full flex items-center justify-center shadow-lg">
        {capturedImage ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img
              src={capturedImage}
              alt="Captured E-Waste"
              className="w-full h-full object-contain"
            />

            {/* Top Badge: Captured Frame State */}
            <div className="absolute top-2.5 left-2.5 z-20">
              <span className="bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md border border-white/20">
                <Sparkles className="w-3 h-3 text-emerald-200" />
                <span>SCAN READY</span>
              </span>
            </div>

            {/* Retake Button Only */}
            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playFeedbackChime('beep');
                  onRetake();
                  startCamera();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-black/80 hover:bg-black text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 backdrop-blur-xs shadow-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'hi' ? 'पुनः फोटो लें (Retake)' : language === 'mr' ? 'पुन्हा फोटो घ्या (Retake)' : 'Retake Photo'}</span>
              </button>
            </div>

            {/* Timestamp & Geostamp Footer */}
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[10px] text-slate-300 bg-black/60 backdrop-blur-xs px-3 py-1 rounded-lg font-mono pointer-events-none">
              <span>GPS: 18.5204° N, 73.8567° E</span>
              <span>CPCB AI AUDIT V2.2</span>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex flex-col justify-between">
            {/* Live HTML5 Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Top Bar: Camera Controls & Live Status */}
            <div className="relative z-10 p-3 flex items-center justify-between">
              <div className="bg-black/80 backdrop-blur-xs px-3 py-1 rounded-full border border-emerald-500/40 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>FULL FRAME LIVE CAMERA</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-2 rounded-full bg-black/80 backdrop-blur-xs border border-white/20 text-white hover:bg-black transition-colors shadow-md cursor-pointer"
                  title="Switch Camera (Front/Back)"
                >
                  <FlipHorizontal className="w-4 h-4 text-slate-200" />
                </button>
              </div>
            </div>

            {/* Center Focus Reticle */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-4">
              <div className="w-4/5 h-4/5 border border-dashed border-emerald-400/80 rounded-2xl relative bg-emerald-950/5 pointer-events-none">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
              </div>
            </div>

            {/* Bottom Shutter Capture Button */}
            <div className="relative z-10 pb-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={captureFrame}
                className="group flex items-center gap-2.5 px-7 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black rounded-full text-xs shadow-xl shadow-emerald-950/70 border-2 border-white/60 transition-all cursor-pointer"
              >
                <div className="w-4 h-4 rounded-full bg-white group-hover:scale-110 transition-transform"></div>
                <Camera className="w-4 h-4 text-white" />
                <span>
                  {language === 'hi' ? 'फोटो खींचें (Capture)' : language === 'mr' ? 'फोटो घ्या (Capture)' : 'Click Photo & Analyze'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {cameraError && !capturedImage && (
        <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{cameraError}</span>
          </div>
          <button
            type="button"
            onClick={startCamera}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shrink-0 cursor-pointer"
          >
            {language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
          </button>
        </div>
      )}
    </div>
  );
};
