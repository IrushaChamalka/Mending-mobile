import { useCameraPermissions, type CameraView } from 'expo-camera';
import { router, useIsFocused } from 'expo-router';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Linking } from 'react-native';

import { canSubmitTask, useTask, type Task } from '@/features/tasks';
import { useIsAppActive } from '@/shared/hooks/useIsAppActive';
import { logger } from '@/shared/lib/logger';

import type { SyncPillState } from '../domain/uploadRules';
import { compressPhoto, type PhotoFile } from '../services/imageCompressor';
import { deleteFile } from '../services/photoFiles';

import { useSyncPill } from './useUploads';

/** Quality of the camera's own JPEG. The compressor resizes it and re-encodes it at 0.7. */
const CAPTURE_QUALITY = 0.8;

const CAPTURE_FAILED = "Couldn't take the photo. Hold the phone steady and try again.";
const CAMERA_FAILED =
  "The camera couldn't start. Close other apps that use it, then go back and open the camera again.";

/**
 * unavailable: the task is gone or cannot take a submission · checkingPermission · askPermission:
 * not asked yet, or the system may ask again · permissionBlocked: denied, only Settings can change it ·
 * camera: live viewfinder · preview: the compressed photo, to retake or use.
 */
export type CaptureState =
  | 'unavailable'
  | 'checkingPermission'
  | 'askPermission'
  | 'permissionBlocked'
  | 'camera'
  | 'preview';

export interface CaptureViewModel {
  state: CaptureState;
  task: Task | null;
  cameraRef: RefObject<CameraView | null>;
  /** The camera is mounted only while the screen is focused and the app is in the foreground. */
  isCameraActive: boolean;
  /** The preview is running and no photo is being processed. */
  canCapture: boolean;
  isProcessing: boolean;
  photo: PhotoFile | null;
  errorMessage: string | null;
  syncPill: SyncPillState;
  onCameraReady: () => void;
  onCameraMountError: () => void;
  takePhoto: () => void;
  retake: () => void;
  confirmPhoto: () => void;
  requestPermission: () => void;
  openSettings: () => void;
  openSyncCenter: () => void;
  goBack: () => void;
}

function captureState(
  task: Task | null,
  photo: PhotoFile | null,
  permission: { granted: boolean; canAskAgain: boolean } | null,
): CaptureState {
  if (!task || !canSubmitTask(task)) return 'unavailable';
  if (photo) return 'preview';
  if (permission === null) return 'checkingPermission';
  if (permission.granted) return 'camera';
  return permission.canAskAgain ? 'askPermission' : 'permissionBlocked';
}

/**
 * The in-app camera (brief §13): permission states, a viewfinder that only runs while the screen is
 * visible, then compression and a preview to retake or use. Every photo file it creates is deleted
 * on retake and when the screen closes; the queue moves a used photo away before that.
 */
export function useCaptureViewModel(taskId: string): CaptureViewModel {
  const task = useTask(taskId);
  const [permission, askForPermission, readPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const isAppActive = useIsAppActive();
  const syncPill = useSyncPill();
  const cameraRef = useRef<CameraView>(null);
  const isBusy = useRef(false);
  const isClosed = useRef(false);
  /** The compressed photo this screen made and still owns. */
  const ownedPhotoUri = useRef<string | null>(null);
  const [photo, setPhoto] = useState<PhotoFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const state = captureState(task, photo, permission);
  const isGranted = permission?.granted ?? false;
  const isCameraActive = state === 'camera' && isFocused && isAppActive;

  // A camera that unmounts must report ready again after it remounts.
  const [wasCameraActive, setWasCameraActive] = useState(isCameraActive);
  if (wasCameraActive !== isCameraActive) {
    setWasCameraActive(isCameraActive);
    if (!isCameraActive) setIsCameraReady(false);
  }

  // Back from the system settings: read the permission again.
  useEffect(() => {
    if (isAppActive && !isGranted) void readPermission();
  }, [isAppActive, isGranted, readPermission]);

  useEffect(() => {
    isClosed.current = false;
    return () => {
      isClosed.current = true;
      if (ownedPhotoUri.current) deleteFile(ownedPhotoUri.current);
      ownedPhotoUri.current = null;
    };
  }, []);

  const takePhoto = async (): Promise<void> => {
    const camera = cameraRef.current;
    if (!camera || isBusy.current) return;
    isBusy.current = true;
    setIsProcessing(true);
    setErrorMessage(null);
    let originalUri: string | null = null;
    try {
      const picture = await camera.takePictureAsync({ quality: CAPTURE_QUALITY });
      originalUri = picture.uri;
      const compressed = await compressPhoto(picture);
      if (isClosed.current) {
        deleteFile(compressed.uri);
        return;
      }
      ownedPhotoUri.current = compressed.uri;
      setPhoto(compressed);
      logger.breadcrumb('photo_captured', {
        taskId,
        width: compressed.width,
        height: compressed.height,
      });
    } catch (error) {
      logger.warn('Taking a photo failed', { error });
      setErrorMessage(CAPTURE_FAILED);
    } finally {
      if (originalUri) deleteFile(originalUri);
      isBusy.current = false;
      setIsProcessing(false);
    }
  };

  return {
    state,
    task,
    cameraRef,
    isCameraActive,
    canCapture: isCameraActive && isCameraReady && !isProcessing,
    isProcessing,
    photo,
    errorMessage,
    syncPill,
    onCameraReady: () => {
      setIsCameraReady(true);
    },
    onCameraMountError: () => {
      logger.warn('The camera failed to start');
      setErrorMessage(CAMERA_FAILED);
    },
    takePhoto: () => {
      void takePhoto();
    },
    retake: () => {
      if (ownedPhotoUri.current) deleteFile(ownedPhotoUri.current);
      ownedPhotoUri.current = null;
      setPhoto(null);
      setErrorMessage(null);
    },
    confirmPhoto: () => {
      if (!photo) return;
      router.push({ pathname: '/submit/[id]', params: { id: taskId, photoUri: photo.uri } });
    },
    requestPermission: () => {
      void askForPermission();
    },
    openSettings: () => {
      void Linking.openSettings();
    },
    openSyncCenter: () => {
      router.push('/sync');
    },
    goBack: () => {
      if (router.canGoBack()) router.back();
      else router.replace({ pathname: '/tasks/[id]', params: { id: taskId } });
    },
  };
}
