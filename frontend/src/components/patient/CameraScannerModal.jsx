import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, AlertCircle, UploadCloud } from 'lucide-react';

export const CameraScannerModal = ({ isOpen, onClose, onScanCaptured }) => {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage]);

  // Ensure live video stream attaches reliably whenever stream or videoRef updates
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch((err) => {
          console.warn('Live video auto-play warning:', err);
        });
      };
      videoRef.current.play?.().catch(() => {});
    }
  }, [stream, isOpen, capturedImage]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let mediaStream;
        try {
          // Attempt back/environment camera first (ideal for scanning papers/documents)
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920, min: 640 },
              height: { ideal: 1080, min: 480 },
            },
            audio: false,
          });
        } catch (constraintErr) {
          console.log('Environment camera constraint fallback to default video device');
          // Fallback to any active webcam (standard on laptops/desktops)
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play?.().catch(() => {});
        }
      } else {
        setCameraError('Camera access not supported on this browser or device.');
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Camera unavailable or permission denied. Please allow camera permissions or use device upload.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImage({ dataUrl, blob });
      stopCamera();
    }, 'image/jpeg');
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleUseScan = () => {
    if (capturedImage?.blob) {
      const file = new File([capturedImage.blob], `camera-scan-lab-report-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      onScanCaptured(file);
      handleClose();
    }
  };

  const handleFallbackFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onScanCaptured(file);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setCameraError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white border border-[#D9E4E5] rounded-3xl p-6 shadow-2xl text-[#172033] flex flex-col items-center">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-[#D9E4E5] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center text-[#0EA5A8]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172033]">MediKiosk Document Camera Scanner</h3>
              <p className="text-[11px] text-[#64748B]">Position document inside the frame guide</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-[#D9E4E5] shadow-inner">
          
          {cameraError ? (
            <div className="p-6 text-center max-w-sm">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <p className="text-xs text-white mb-4">{cameraError}</p>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFallbackFile}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-2 mx-auto transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload From Device</span>
              </button>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage.dataUrl}
              alt="Captured Medical Document"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Document Frame Guide Overlay */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-[#0EA5A8]/80 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between items-center">
                  <span className="w-4 h-4 border-t-2 border-l-2 border-[#0EA5A8]" />
                  <div className="bg-white/90 border border-[#0EA5A8]/40 text-[#0EA5A8] text-[10px] font-mono px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md pointer-events-auto font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#0EA5A8] animate-ping" />
                    <span>LIVE CAMERA READY</span>
                  </div>
                  <span className="w-4 h-4 border-t-2 border-r-2 border-[#0EA5A8]" />
                </div>
                <div className="text-center">
                  <span className="bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] text-white font-medium shadow-md">
                    Hold report flat & steady inside green border
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-b-2 border-l-2 border-[#0EA5A8]" />
                  <span className="w-4 h-4 border-b-2 border-r-2 border-[#0EA5A8]" />
                </div>
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFallbackFile}
          />
        </div>

        {/* Action Controls: Capture / Retake / Use Scan / Cancel */}
        <div className="w-full pt-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#172033] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-[#F3F8F8] hover:bg-[#EAF3F3] border border-[#D9E4E5] text-[#172033] text-[11px] font-medium flex items-center gap-1.5 transition-colors"
              title="Open phone or hardware camera app"
            >
              <Camera className="w-3.5 h-3.5 text-[#0EA5A8]" />
              <span>Native Camera App</span>
            </button>
          </div>

          {!cameraError && (
            <div className="flex items-center gap-3">
              {capturedImage ? (
                <>
                  <button
                    onClick={handleRetake}
                    className="px-4 py-2.5 rounded-xl bg-[#F3F8F8] hover:bg-[#EAF3F3] border border-[#D9E4E5] text-[#172033] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>
                  <button
                    onClick={handleUseScan}
                    className="px-5 py-2.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Use Scan</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCapture}
                  className="px-6 py-3 rounded-2xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Document</span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
