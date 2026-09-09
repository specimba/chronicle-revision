import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Reuse existing Firebase app or initialize once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// All Google Drive scopes configured for the workspace
export const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

// Flag to indicate if we are currently in the middle of a sign-in flow
let isSigningIn = false;

// Access token MUST be cached strictly in memory (NEVER in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

// Initialize auth state listener. Call this on app mount.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token expired from memory or page refreshed
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Interactive sign-in triggered by user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No OAuth access token returned from Google Auth provider');
    }
    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentUser = (): User | null => {
  return cachedUser;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedUser = null;
};

export interface PickedDriveDoc {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  url?: string;
  iconUrl?: string;
  description?: string;
  lastEditedUtc?: number;
}

// Loads the Google Picker library via gapi
export function loadGooglePickerApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();

    // If google.picker is already ready
    if ((window as any).google?.picker) {
      return resolve();
    }

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const gapi = (window as any).gapi;
      if (gapi) {
        clearInterval(interval);
        gapi.load('picker', {
          callback: () => resolve(),
          onerror: () => reject(new Error('Google Picker library failed to load.')),
        });
      } else if (attempts > 50) {
        clearInterval(interval);
        reject(new Error('Timed out waiting for Google API Client script.'));
      }
    }, 100);
  });
}

// Opens the Google Picker dialog
export async function openGooglePickerModal({
  token,
  onPicked,
  onCancel,
}: {
  token?: string;
  onPicked: (doc: PickedDriveDoc) => void;
  onCancel?: () => void;
}): Promise<void> {
  const activeToken = token || cachedAccessToken;
  if (!activeToken) {
    throw new Error('Authentication required to open Google Picker. Please Sign in with Google first.');
  }

  await loadGooglePickerApi();

  const google = (window as any).google;
  if (!google?.picker) {
    throw new Error('Google Picker API is unavailable.');
  }

  // Robust iframe origin resolution
  const pickerOrigin =
    typeof window !== 'undefined' &&
    window.location.ancestorOrigins &&
    window.location.ancestorOrigins.length > 0
      ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
      : typeof window !== 'undefined'
      ? window.location.origin
      : '';

  // Configure views: Documents, Images, Audio, Videos
  const docsView = new google.picker.DocsView()
    .setIncludeFolders(true)
    .setSelectFolderEnabled(false);

  const imagesView = new google.picker.DocsView(google.picker.ViewId.DOCS_IMAGES)
    .setIncludeFolders(true);

  const videosView = new google.picker.DocsView(google.picker.ViewId.DOCS_VIDEOS)
    .setIncludeFolders(true);

  const picker = new google.picker.PickerBuilder()
    .addView(docsView)
    .addView(imagesView)
    .addView(videosView)
    .addView(google.picker.ViewId.DOCS)
    .setOAuthToken(activeToken)
    .setOrigin(pickerOrigin)
    .setTitle('Select Chronicle Studio Asset from Google Drive')
    .setCallback((data: any) => {
      if (data.action === google.picker.Action.PICKED) {
        const doc = data.docs?.[0];
        if (doc) {
          onPicked({
            id: doc.id,
            name: doc.name,
            mimeType: doc.mimeType,
            sizeBytes: doc.sizeBytes,
            url: doc.url || `https://drive.google.com/file/d/${doc.id}/view`,
            iconUrl: doc.iconUrl,
            description: doc.description,
            lastEditedUtc: doc.lastEditedUtc,
          });
        }
      } else if (data.action === google.picker.Action.CANCEL) {
        onCancel?.();
      }
    })
    .build();

  picker.setVisible(true);
}
