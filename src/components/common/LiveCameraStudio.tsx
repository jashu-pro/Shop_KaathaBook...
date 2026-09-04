/* src/components/common/LiveCameraStudio.tsx */
import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RotateCw, Check, AlertCircle, Sparkles } from 'lucide-react';

interface LiveCameraStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotosCaptured: (newPhotos: string[]) => void;
  existingCount?: number;
}

export const LiveCameraStudio: React.FC<LiveCameraStudioProps> = ({
  isOpen,
  onClose,
  onPhotosCaptured,
  existingCount = 0,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedSessionPhotos, setCapturedSessionPhotos] = useState<string[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturingFlash, setIsCapturingFlash] = useState<boolean>(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileFallbackRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopCurrentStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
  };

  // Start camera stream
  const startCamera = async (facing: 'environment' | 'user') => {
    stopCurrentStream();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by this browser. Please use Gallery upload.');
      return;
    }

    try {
      // Check available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoInputs.length > 1);

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch {
        // Fallback for laptops/desktops without 'environment' rear camera
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Failed to open camera:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in browser permissions or use file upload.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Please use gallery upload.');
      } else {
        setCameraError(err.message || 'Could not start camera feed.');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedSessionPhotos([]);
      startCamera(facingMode);
    } else {
      stopCurrentStream();
    }
    return () => {
      stopCurrentStream();
    };
  }, [isOpen]);

  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Snap photo with shutter feedback
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Haptic feedback if supported on mobile
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(40);
    }

    // Flash animation
    setIsCapturingFlash(true);
    setTimeout(() => setIsCapturingFlash(false), 120);

    setCapturedSessionPhotos((prev) => [...prev, photoDataUrl]);
  };

  const handleRemoveSessionPhoto = (idx: number) => {
    setCapturedSessionPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDone = () => {
    if (capturedSessionPhotos.length > 0) {
      onPhotosCaptured(capturedSessionPhotos);
    }
    stopCurrentStream();
    onClose();
  };

  const handleCloseWithoutSaving = () => {
    if (capturedSessionPhotos.length > 0) {
      if (confirm(`Keep ${capturedSessionPhotos.length} captured photos?`)) {
        onPhotosCaptured(capturedSessionPhotos);
      }
    }
    stopCurrentStream();
    onClose();
  };

  const handleFallbackFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          setCapturedSessionPhotos((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  if (!isOpen) return null;

  const totalPhotosCount = existingCount + capturedSessionPhotos.length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#020617',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* 1. Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1rem',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <Camera size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#F8FAFC' }}>
              Product & Bill Camera
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                Unlimited Snapping • {capturedSessionPhotos.length} snapped ({totalPhotosCount} total)
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {hasMultipleCameras && (
            <button
              type="button"
              onClick={toggleCameraFacing}
              title="Switch Camera (Front/Back)"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#F8FAFC',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <RotateCw size={18} />
            </button>
          )}

          <button
            type="button"
            onClick={handleCloseWithoutSaving}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* 2. Main Viewfinder / Camera View */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Shutter Flash Animation */}
        {isCapturingFlash && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#FFFFFF',
              zIndex: 30,
              opacity: 0.85,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Live Camera Video Feed */}
        {!cameraError ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />

            {/* Viewfinder Reticle Framing Guidelines */}
            <div
              style={{
                position: 'absolute',
                inset: '20px',
                border: '2px dashed rgba(255, 255, 255, 0.35)',
                borderRadius: '16px',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                padding: '0.75rem',
              }}
            >
              <span
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  color: '#CBD5E1',
                  backdropFilter: 'blur(4px)',
                  fontWeight: '600',
                }}
              >
                📸 Align Bill, Receipt or Products inside frame
              </span>
            </div>
          </>
        ) : (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              maxWidth: '380px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={32} />
            </div>
            <h3 style={{ margin: 0, color: '#F8FAFC', fontSize: '1.1rem', fontWeight: '800' }}>
              Camera Permission or Access Issue
            </h3>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.825rem', lineHeight: '1.4' }}>
              {cameraError}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '12px',
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Retry Camera
              </button>
              <button
                type="button"
                onClick={() => fileFallbackRef.current?.click()}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#F8FAFC',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Select Photos
              </button>
              <input
                ref={fileFallbackRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFallbackFileSelect}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Control & Snapped Photos Strip */}
      <div
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0.75rem 1rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          zIndex: 10,
        }}
      >
        {/* Horizontal Thumbnails Strip of Photos Snapped */}
        {capturedSessionPhotos.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.25rem',
            }}
          >
            {capturedSessionPhotos.map((photo, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  width: '52px',
                  height: '52px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '2px solid #10B981',
                  flexShrink: 0,
                }}
              >
                <img src={photo} alt={`Snap ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => handleRemoveSessionPhoto(idx)}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  <X size={10} />
                </button>
                <span
                  style={{
                    position: 'absolute',
                    bottom: '1px',
                    left: '2px',
                    fontSize: '0.6rem',
                    fontWeight: '800',
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: '0 3px',
                    borderRadius: '3px',
                  }}
                >
                  #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Shutter Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 0.5rem',
          }}
        >
          {/* Photos Count Badge */}
          <div style={{ minWidth: '80px' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: '800',
                color: capturedSessionPhotos.length > 0 ? '#10B981' : '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <Sparkles size={14} />
              {capturedSessionPhotos.length} Snapped
            </span>
          </div>

          {/* Big Tactile Shutter Button */}
          <button
            type="button"
            onClick={handleSnapPhoto}
            disabled={!stream}
            title="Snap Photo"
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              border: '4px solid #FFFFFF',
              backgroundColor: 'transparent',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: stream ? 'pointer' : 'not-allowed',
              opacity: stream ? 1 : 0.5,
              transition: 'transform 0.1s ease',
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(0.92)';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
            onTouchStart={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(0.92)';
            }}
            onTouchEnd={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
              }}
            />
          </button>

          {/* Finish / Done Button */}
          <div style={{ minWidth: '80px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleDone}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '14px',
                backgroundColor: capturedSessionPhotos.length > 0 ? '#059669' : 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: '800',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
              }}
            >
              <Check size={16} />
              Done {capturedSessionPhotos.length > 0 ? `(${capturedSessionPhotos.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
