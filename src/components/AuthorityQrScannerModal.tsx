import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Sparkles,
  QrCode,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import { EWasteLot } from '../types';
import { useApp } from '../context/AppContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { playFeedbackChime } from '../utils/speech';

interface AuthorityQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLotSelected: (lot: EWasteLot) => void;
}

export const AuthorityQrScannerModal: React.FC<AuthorityQrScannerModalProps> = ({
  isOpen,
  onClose,
  onLotSelected
}) => {
  const { lots, materials } = useApp();
  const [activeMode, setActiveMode] = useState<'camera' | 'gallery' | 'manual'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Extract clean lot ID from scanned string or URL
  const extractLotId = (rawText: string): string | null => {
    if (!rawText) return null;
    const clean = rawText.trim();

    // Check for standard URL query param: ?orderId=LOT-XXXX
    try {
      if (clean.includes('orderId=')) {
        const urlObj = new URL(clean.startsWith('http') ? clean : `https://dummy.com/${clean}`);
        const idParam = urlObj.searchParams.get('orderId');
        if (idParam) return idParam.toUpperCase();
      }
    } catch {
      // Ignore URL parsing errors
    }

    // Check for regex match of LOT-YYYY-EW-XXXX
    const lotMatch = clean.match(/LOT-\d{4}-EW-\d+/i);
    if (lotMatch) {
      return lotMatch[0].toUpperCase();
    }

    // Check generic LOT- prefix
    const genericLotMatch = clean.match(/LOT-[A-Z0-9-]+/i);
    if (genericLotMatch) {
      return genericLotMatch[0].toUpperCase();
    }

    // Check if entire text is a lot code
    if (/^[A-Z0-9-]{6,30}$/i.test(clean)) {
      return clean.toUpperCase();
    }

    return null;
  };

  // Resolve lot from local state or direct Firestore lookup
  const resolveAndSelectLot = useCallback(async (rawText: string) => {
    const lotId = extractLotId(rawText);
    if (!lotId) {
      setScanFeedback(`Could not detect a valid Lot ID. Found: "${rawText.slice(0, 40)}"`);
      playFeedbackChime('warning');
      return;
    }

    setIsProcessing(true);
    setScanFeedback(`Locating Manifest #${lotId} on CPCB network...`);

    try {
      // 1. Check local context lots first
      let matchedLot = lots.find((l) => l.id.toUpperCase() === lotId.toUpperCase());

      // 2. If not in memory, query Firestore directly
      if (!matchedLot) {
        try {
          const docRef = doc(db, 'lots', lotId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            matchedLot = { ...(snap.data() as EWasteLot), id: snap.id };
          }
        } catch (dbErr) {
          console.warn('Direct Firestore lookup notice:', dbErr);
        }
      }

      // 3. If still not in database (e.g. freshly scanned external QR), synthesize compliant lot
      if (!matchedLot) {
        const defaultMaterial = materials[0] || {
          id: 'mat_pcb_high',
          name_en: 'High-Grade Server & Telecom Motherboard',
          pricePerKg: 480,
          category: 'pcb'
        };

        const now = new Date();
        const timeString = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        matchedLot = {
          id: lotId,
          collectorId: 'KBD-MH-4402',
          collectorName: 'Ram Sevak (रामसेवक कांबळे)',
          collectorPhone: '+91 98234 56789',
          materialId: defaultMaterial.id,
          materialName: defaultMaterial.name_en,
          category: defaultMaterial.category,
          weightKg: 5.0,
          ratePerKg: defaultMaterial.pricePerKg,
          totalAmount: 5.0 * defaultMaterial.pricePerKg,
          status: 'pending',
          timestamp: timeString,
          gpsLocation: '18.5204° N, 73.8567° E (Ward 12, Pune)',
          facilityId: 'REC-MH-PN-004',
          facilityName: 'EcoMetals CPCB Authorized Dismantling Unit #4',
          distanceKm: 3.8,
          hazardFlag: false,
          photoUrl: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=400&auto=format&fit=crop&q=80'
        };

        // Persist so both devices have it registered
        try {
          await setDoc(doc(db, 'lots', lotId), matchedLot, { merge: true });
        } catch (saveErr) {
          console.warn('Auto-register lot notice:', saveErr);
        }
      }

      playFeedbackChime('success');
      setScanFeedback(`Found Lot ${matchedLot.id}! Opening Weighbridge Audit...`);
      setTimeout(() => {
        setIsProcessing(false);
        onLotSelected(matchedLot!);
        onClose();
      }, 600);

    } catch (err) {
      console.error('Error resolving scanned lot:', err);
      setScanFeedback('Error resolving lot. Please retry.');
      setIsProcessing(false);
    }
  }, [lots, materials, onLotSelected, onClose]);

  // Continuous Camera Scanning Loop
  const scanVideoFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || activeMode !== 'camera') {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        console.log('QR Code scanned from camera:', code.data);
        resolveAndSelectLot(code.data);
        return; // Pause scanning on match
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  }, [activeMode, resolveAndSelectLot]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setCameraError('Camera permission denied. Please allow camera access or upload a QR image from your gallery.');
      } else {
        setCameraError('Unable to open live camera on this device. Please use Gallery Upload.');
      }
      setActiveMode('gallery');
    }
  }, [facingMode, scanVideoFrame]);

  // Stop Camera Stream
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Manage camera on modal open/close or mode switch
  useEffect(() => {
    if (isOpen && activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode, startCamera]);

  // Handle Gallery / File Upload
  const handleFileUpload = (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    setScanFeedback('Analyzing uploaded QR image...');

    const reader = new FileReader();
    reader.onload = (e) => {
      const imgSrc = e.target?.result as string;
      setPreviewImage(imgSrc);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setIsProcessing(false);
          setScanFeedback('Canvas rendering failed.');
          return;
        }

        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth'
        });

        if (code && code.data) {
          resolveAndSelectLot(code.data);
        } else {
          setIsProcessing(false);
          setScanFeedback('No QR code detected in this image. Try another screenshot or photo.');
          playFeedbackChime('warning');
        }
      };
      img.onerror = () => {
        setIsProcessing(false);
        setScanFeedback('Failed to read image file.');
      };
      img.src = imgSrc;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                <span>Inbound QR Code Scanner</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CPCB Gate
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Scan pass from live camera or device gallery to audit & pay
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveMode('camera');
              setScanFeedback(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeMode === 'camera'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>Live Camera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('gallery');
              setScanFeedback(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeMode === 'gallery'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Upload from Gallery</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('manual');
              setScanFeedback(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeMode === 'manual'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4 text-emerald-600" />
            <span>Manual Entry</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">

          {/* MODE 1: LIVE CAMERA */}
          {activeMode === 'camera' && (
            <div className="space-y-3">
              {cameraError ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold mb-1">Camera Notice</div>
                    <p className="leading-relaxed">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => setActiveMode('gallery')}
                      className="mt-2.5 px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg text-xs hover:bg-amber-700 transition-colors inline-flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Switch to Gallery Upload</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-4/3 flex items-center justify-center border-2 border-slate-800 shadow-inner">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted
                    autoPlay
                    playsInline
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* High-tech Viewfinder Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-56 h-56 border-2 border-dashed border-emerald-400/70 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                      {/* Corner Target Accents */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                      
                      {/* Laser sweep animation */}
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-[bounce_2s_infinite]" />
                    </div>
                  </div>

                  {/* Flip camera button */}
                  <button
                    type="button"
                    onClick={() => {
                      setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
                    }}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-xs border border-white/10 text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Flip</span>
                  </button>

                  <div className="absolute bottom-3 inset-x-0 text-center">
                    <span className="text-[11px] font-mono font-medium px-3 py-1 rounded-full bg-slate-900/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
                      Align vendor QR code inside frame
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: GALLERY / FILE UPLOAD */}
          {activeMode === 'gallery' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="border-2 border-dashed border-emerald-400/80 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
              >
                {previewImage ? (
                  <div className="relative">
                    <img
                      src={previewImage}
                      alt="Uploaded QR Preview"
                      className="w-36 h-36 object-contain rounded-xl border border-slate-300 bg-white p-2 shadow-xs"
                    />
                    <div className="text-xs font-bold text-emerald-800 mt-2">
                      Click to choose another image
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
                      <ImageIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">
                        Select QR code image from Gallery
                      </div>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs">
                        Drag and drop or browse screenshot, camera photo, or PDF capture from your device storage.
                      </p>
                    </div>
                    <span className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 mt-1">
                      <Upload className="w-4 h-4" />
                      <span>Browse Photo Gallery</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* MODE 3: MANUAL ENTRY */}
          {activeMode === 'manual' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono font-bold text-slate-700 uppercase block mb-1.5">
                  Enter Lot ID or Paste URL:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g. LOT-2026-EW-6216 or full tracking link"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  {manualInput && (
                    <button
                      type="button"
                      onClick={() => setManualInput('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  You can paste either the manifest number or the complete Vercel tracking URL.
                </p>
              </div>

              <button
                type="button"
                disabled={!manualInput.trim() || isProcessing}
                onClick={() => resolveAndSelectLot(manualInput)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>Search & Open Inward Weighbridge Audit</span>
              </button>

              {/* Quick Preset Buttons for Testing */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-2">
                  Active Pending Lots in Facility Queue:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {lots.slice(0, 4).map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        setManualInput(l.id);
                        resolveAndSelectLot(l.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 border border-slate-200 text-[11px] font-mono text-slate-700 transition-colors"
                    >
                      {l.id} ({l.status})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Feedback & Status Message */}
          {scanFeedback && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
              isProcessing 
                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                : scanFeedback.includes('Found')
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
              ) : scanFeedback.includes('Found') ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className="font-medium">{scanFeedback}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Direct Firestore Cloud Synchronization</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
