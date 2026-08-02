/* components/common/ImageUploader.tsx */
import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Edit2, Loader2, User as UserIcon, Store, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  value: string | null;
  onChange: (value: string | null) => void;
  variant?: 'avatar' | 'logo';
  label?: string;
  facingMode?: 'user' | 'environment';
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  variant = 'avatar',
  label = 'Photo',
  facingMode = 'user',
}) => {
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Webcam Modal State for Desktop Browsers
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Hidden Input Refs for System Mobile Fallbacks & Gallery
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Client-side Canvas Image Compression
  const compressAndProcessFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate file format
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
        reject(new Error('Unsupported file format. Please upload JPG, PNG, WEBP, or HEIC.'));
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable for image processing.'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to parse selected image file.'));
      };
      reader.onerror = () => reject(new Error('Error reading image file from storage.'));
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setProcessing(true);
    try {
      const compressed = await compressAndProcessFile(file);
      onChange(compressed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Image processing failed');
    } finally {
      setProcessing(false);
      // Reset input value so same file can be chosen again
      e.target.value = '';
    }
  };

  // Trigger System Camera or Open Desktop WebCam Stream
  const handleCameraClick = async () => {
    setErrorMessage(null);
    
    // Detect mobile touch vs desktop environment
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // Mobile: trigger native OS camera via input capture
      cameraInputRef.current?.click();
      return;
    }

    // Desktop: Try Browser MediaDevices API
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        mediaStreamRef.current = stream;
        setShowWebcamModal(true);
        
        // Wait for video ref to mount
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }, 100);
      } catch (err: any) {
        // Permission denied or camera missing -> fallback to file picker input
        setErrorMessage('Camera access denied or unavailable. Opening file selector.');
        cameraInputRef.current?.click();
      }
    } else {
      cameraInputRef.current?.click();
    }
  };

  const captureWebcamSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onChange(dataUrl);
    }
    stopWebcamStream();
  };

  const stopWebcamStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setShowWebcamModal(false);
  };

  const isAvatar = variant === 'avatar';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      {/* Hidden Inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
        capture={facingMode}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Main Image Container */}
      <div style={{ position: 'relative' }}>
        <div style={{
          width: '160px',
          height: '160px',
          borderRadius: isAvatar ? '50%' : 'var(--radius-card, 28px)',
          overflow: 'hidden',
          border: value ? '3px solid var(--primary)' : '2px dashed var(--border-color)',
          boxShadow: value ? '0 10px 25px rgba(16, 185, 129, 0.15)' : 'none',
          position: 'relative',
          backgroundColor: value ? 'transparent' : isAvatar ? 'var(--bg-secondary)' : 'var(--primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all var(--transition-normal)'
        }}>
          {/* Loading Processing Overlay */}
          {processing && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              zIndex: 10, color: '#FFFFFF'
            }}>
              <Loader2 className="spinner" size={32} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: '600' }}>Processing...</span>
            </div>
          )}

          {value ? (
            <img
              src={value}
              alt={label}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform var(--transition-normal)'
              }}
            />
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: isAvatar ? 'var(--text-muted)' : 'var(--primary)'
            }}>
              {isAvatar ? <UserIcon size={56} /> : <Store size={48} />}
              <span style={{ fontSize: '0.75rem', marginTop: '0.35rem', fontWeight: '600' }}>
                Add {label}
              </span>
            </div>
          )}
        </div>

        {/* Edit & Remove Badge Actions */}
        {value && !processing && (
          <>
            <button
              type="button"
              onClick={handleCameraClick}
              title="Change photo"
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
                border: '2px solid var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                transition: 'transform var(--transition-fast)'
              }}
            >
              <Edit2 size={16} />
            </button>

            <button
              type="button"
              onClick={() => onChange(null)}
              title="Remove photo"
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--error)',
                color: '#FFFFFF',
                border: '2px solid var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }}
            >
              <X size={16} />
            </button>
          </>
        )}
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          color: 'var(--error)', fontSize: '0.75rem', fontWeight: '500'
        }}>
          <AlertCircle size={14} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Camera & Gallery Action Buttons */}
      <div style={{ display: 'flex', gap: '0.6rem' }}>
        <button
          type="button"
          onClick={handleCameraClick}
          className="btn btn-secondary"
          style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem', borderRadius: '18px' }}
        >
          <Camera size={16} /> Camera
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="btn btn-secondary"
          style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem', borderRadius: '18px' }}
        >
          <ImageIcon size={16} /> Gallery
        </button>
      </div>

      {/* Desktop Webcam Live Feed Modal Overlay */}
      {showWebcamModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ padding: '1.5rem', maxWidth: '520px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-heading)' }}>
                Take {label} Photo
              </h3>
              <button onClick={stopWebcamStream} className="btn btn-secondary btn-icon">
                <X size={18} />
              </button>
            </div>

            <div style={{
              width: '100%',
              height: '320px',
              backgroundColor: '#000000',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              marginBottom: '1.5rem',
              position: 'relative'
            }}>
              <video
                ref={videoRef}
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button type="button" onClick={stopWebcamStream} className="btn btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={captureWebcamSnap} className="btn btn-primary">
                <Camera size={18} /> Capture & Use
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
