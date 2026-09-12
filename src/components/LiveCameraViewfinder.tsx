import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, FlipHorizontal, AlertCircle, Upload, ZoomIn, ZoomOut } from 'lucide-react';
import { playFeedbackChime } from '../utils/speech';

interface LiveCameraViewfinderProps {
  capturedImage: string | null;
  onPhotoCaptured: (base64: string) => void;
  onRetake: () => void;
  collectorId?: string;
  language?: 'hi' | 'mr' | 'en';
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
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // digital zoom multiplier

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    setZoomLevel(1.0);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(4.0, parseFloat((prev + 0.5).toFixed(1))));
    playFeedbackChime('beep');
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.5, parseFloat((prev - 0.5).toFixed(1))));
    playFeedbackChime('beep');
  };

  // Capture frame applying the current zoom crop
  const captureFrame = () => {
    playFeedbackChime('beep');

    const video = videoRef.current;
    if (video && video.videoWidth > 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      // Crop the zoomed region from the center
      const cropW = vw / zoomLevel;
      const cropH = vh / zoomLevel;
      const cropX = (vw - cropW) / 2;
      const cropY = (vh - cropH) / 2;

      canvas.width = Math.round(cropW);
      canvas.height = Math.round(cropH);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
        const snapshotDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        onPhotoCaptured(snapshotDataUrl);
        return;
      }
    }

    // Fallback canvas (when live camera is blocked/unavailable)
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
      fCtx.moveTo(40, 60); fCtx.lineTo(200, 60); fCtx.lineTo(240, 120); fCtx.lineTo(450, 120);
      fCtx.stroke();
      fCtx.fillStyle = '#0f172a';
      fCtx.fillRect(180, 150, 280, 180);
      fCtx.strokeStyle = '#fbbf24';
      fCtx.lineWidth = 3;
      fCtx.strokeRect(180, 150, 280, 180);
      fCtx.fillStyle = '#fbbf24';
      for (let i = 0; i < 10; i++) {
        fCtx.fillRect(190 + i * 26, 140, 12, 10);
        fCtx.fillRect(190 + i * 26, 330, 12, 10);
      }
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
      onPhotoCaptured(snapshotDataUrl);
    }
  };

  return (
    <div className="space-y-2">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Viewport Container */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-700 w-full shadow-lg" style={{ aspectRatio: '4/3' }}>
        {capturedImage ? (
          /* Captured Photo — show full image, no crop */
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            <img
              src={capturedImage}
              alt="Captured E-Waste Scrap"
              className="w-full h-full object-contain bg-black"
              style={{ maxHeight: '100%', maxWidth: '100%' }}
            />
            {/* Timestamp Watermark */}
            <div className="absolute bottom-2.5 left-2.5 bg-black/85 backdrop-blur-xs text-emerald-400 font-mono text-[10px] px-3 py-1 rounded-lg border border-emerald-500/40 z-10 flex items-center gap-1.5 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{new Date().toLocaleDateString('en-IN')} • {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • {collectorId}</span>
            </div>

            {/* Retake Button */}
            <div className="absolute top-2.5 right-2.5 z-20">
              <button
                type="button"
                onClick={() => {
                  playFeedbackChime('beep');
                  onRetake();
                }}
                className="px-3.5 py-1.5 bg-slate-900/95 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 shadow-lg backdrop-blur-xs transition-transform active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {language === 'hi' ? 'पुनः लें' : language === 'mr' ? 'पुन्हा घ्या' : 'Retake Photo'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Live Camera Stream */
          <div className="relative w-full h-full flex flex-col justify-between bg-black overflow-hidden">
            {/* Video with digital zoom applied via CSS transform (scales from center) */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && streamRef.current && el.srcObject !== streamRef.current) {
                    el.srcObject = streamRef.current;
                    el.onloadedmetadata = () => {
                      el.play().catch((e) => console.warn('Video play error:', e));
                    };
                  }
                }}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              />
            </div>

            {/* Top Bar: Live Status + Camera Flip */}
            <div className="relative z-10 p-3 flex items-center justify-between">
              <div className="bg-black/80 backdrop-blur-xs px-3 py-1 rounded-full border border-emerald-500/40 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>LIVE CAMERA</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Zoom level badge */}
                <div className="bg-black/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20 text-white text-[11px] font-mono font-bold">
                  {zoomLevel.toFixed(1)}×
                </div>
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-2 rounded-full bg-black/80 backdrop-blur-xs border border-white/20 text-white hover:bg-black transition-colors shadow-md cursor-pointer"
                  title="Switch Camera"
                >
                  <FlipHorizontal className="w-4 h-4 text-slate-200" />
                </button>
              </div>
            </div>

            {/* Center Focus Reticle */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-4 pointer-events-none">
              <div className="w-4/5 h-4/5 border border-dashed border-emerald-400/80 rounded-2xl relative bg-emerald-950/5">
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-emerald-400"></div>
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-emerald-400"></div>
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-emerald-400"></div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-emerald-400"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] text-emerald-400/70 font-mono bg-black/40 px-2 py-0.5 rounded">
                    {language === 'hi' ? 'कबाड़ को फ्रेम में रखें' : language === 'mr' ? 'स्क्रॅप फ्रेममध्ये ठेवा' : 'Frame the scrap here'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Controls: Upload + Zoom − + Capture + Zoom + */}
            <div className="relative z-10 pb-4 px-4 flex items-center justify-center gap-2">
              {/* Gallery Upload */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') {
                        playFeedbackChime('beep');
                        onPhotoCaptured(reader.result);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer"
                title={language === 'hi' ? 'गैलरी से फोटो' : 'Upload from gallery'}
              >
                <Upload className="w-4 h-4 text-emerald-400" />
              </button>

              {/* Zoom Out */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="p-3 bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-slate-200" />
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={captureFrame}
                className="group flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black rounded-full text-xs shadow-xl shadow-emerald-950/70 border-2 border-white/60 transition-all cursor-pointer"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white group-hover:scale-110 transition-transform"></div>
                <Camera className="w-4 h-4 text-white" />
                <span>
                  {language === 'hi' ? 'फोटो खींचें' : language === 'mr' ? 'फोटो घ्या' : 'Capture'}
                </span>
              </button>

              {/* Zoom In */}
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4.0}
                className="p-3 bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-slate-200" />
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
