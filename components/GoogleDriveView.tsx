'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  googleSignIn,
  logout,
  initAuth,
  getAccessToken,
  getCurrentUser,
  openGooglePickerModal,
  PickedDriveDoc,
} from '@/lib/firebase-auth';
import { User } from 'firebase/auth';
import {
  HardDrive,
  Search,
  Upload,
  RefreshCw,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  Trash2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  LogOut,
  SlidersHorizontal,
  Plus,
} from 'lucide-react';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  iconLink?: string;
  description?: string;
}

interface GoogleDriveViewProps {
  onNavigateToStudio?: (mediaPayload?: {
    type: 'image' | 'video' | 'audio' | 'document';
    url?: string;
    id: string;
    name: string;
    mimeType: string;
  }) => void;
}

export default function GoogleDriveView({ onNavigateToStudio }: GoogleDriveViewProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Drive state
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'videos' | 'audio' | 'documents'>('all');

  // Selected asset from Google Picker
  const [pickedDoc, setPickedDoc] = useState<PickedDriveDoc | null>(null);
  const [isOpeningPicker, setIsOpeningPicker] = useState<boolean>(false);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadContent, setUploadContent] = useState<string>('');
  const [uploadMimeType, setUploadMimeType] = useState<string>('text/plain');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Delete confirmation modal state (MANDATORY for destructive ops)
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, activeToken) => {
        setCurrentUser(user);
        setToken(activeToken);
        setIsLoadingAuth(false);
      },
      () => {
        setCurrentUser(null);
        setToken(null);
        setIsLoadingAuth(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch Drive files when token or filters change
  const fetchDriveFiles = useCallback(async () => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken) return;

    setIsLoadingFiles(true);
    setFetchError(null);
    try {
      const url = new URL('/api/drive/files', window.location.origin);
      if (searchQuery.trim()) url.searchParams.set('q', searchQuery.trim());
      if (filterType !== 'all') url.searchParams.set('type', filterType);

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load Google Drive files');
      }

      setFiles(data.files || []);
    } catch (err: any) {
      setFetchError(err.message || 'Error communicating with Google Drive API');
    } finally {
      setIsLoadingFiles(false);
    }
  }, [token, searchQuery, filterType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!token) {
        setFiles([]);
      } else {
        fetchDriveFiles();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [token, fetchDriveFiles]);

  // Handle Google Sign-in
  const handleSignIn = async () => {
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setToken(res.accessToken);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google Sign-in was cancelled or failed.');
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setToken(null);
    setPickedDoc(null);
    setFiles([]);
  };

  // Launch Google Picker
  const handleOpenPicker = async () => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken) {
      handleSignIn();
      return;
    }

    setIsOpeningPicker(true);
    setAuthError(null);
    try {
      await openGooglePickerModal({
        token: activeToken,
        onPicked: (doc) => {
          setPickedDoc(doc);
          setIsOpeningPicker(false);
        },
        onCancel: () => {
          setIsOpeningPicker(false);
        },
      });
    } catch (err: any) {
      setIsOpeningPicker(false);
      setAuthError(err.message || 'Could not launch Google Picker.');
    }
  };

  // Upload new file to Drive
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim()) return;

    const activeToken = token || (await getAccessToken());
    if (!activeToken) return;

    setIsUploading(true);
    try {
      const res = await fetch('/api/drive/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: uploadFileName.trim(),
          content: uploadContent,
          mimeType: uploadMimeType,
          description: 'Chronicle Continuity Asset / Script Artifact',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload file to Google Drive');
      }

      setUploadSuccessMsg(`"${uploadFileName}" uploaded to Google Drive!`);
      setUploadFileName('');
      setUploadContent('');
      setIsUploadOpen(false);
      setTimeout(() => setUploadSuccessMsg(null), 4000);
      fetchDriveFiles();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete file with confirmation
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    const activeToken = token || (await getAccessToken());
    if (!activeToken) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/drive/files/${fileToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete file');
      }

      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      if (pickedDoc?.id === fileToDelete.id) {
        setPickedDoc(null);
      }
      setFileToDelete(null);
    } catch (err: any) {
      alert(`Deletion error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '—';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '—';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMimeIcon = (mimeType: string) => {
    if (mimeType.includes('image/')) return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    if (mimeType.includes('video/')) return <VideoIcon className="w-4 h-4 text-sky-400" />;
    if (mimeType.includes('audio/')) return <MusicIcon className="w-4 h-4 text-amber-400" />;
    return <FileText className="w-4 h-4 text-purple-400" />;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0e11] text-[#e2e2e6] overflow-hidden">
      {/* Top Banner / Breadcrumb */}
      <div className="h-12 border-b border-[#22272e] bg-[#12161c] px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
              Google Drive Vault & Picker Integration
            </h1>
            <p className="text-[10px] text-neutral-400 font-mono">
              Live OAuth-connected cloud asset manager & multi-modal ingest bridge
            </p>
          </div>
        </div>

        {/* Auth status & user details */}
        <div className="flex items-center space-x-3">
          {currentUser ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-[#181d24] border border-[#2a303c] rounded px-2.5 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-neutral-300">
                  {currentUser.displayName || currentUser.email}
                </span>
                <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded px-1 font-mono">
                  OAuth Active
                </span>
              </div>
              <button
                id="btn-drive-signout"
                onClick={handleSignOut}
                className="flex items-center space-x-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-[#161a22] border border-[#272d38] hover:border-[#384152] px-2.5 py-1 rounded transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          ) : (
            <button
              id="btn-drive-signin"
              onClick={handleSignIn}
              disabled={isLoadingAuth}
              className="flex items-center space-x-2 text-xs font-medium bg-[#1a73e8] hover:bg-[#1557b0] text-white px-3.5 py-1.5 rounded transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6 space-y-5 overflow-y-auto">
        {authError && (
          <div className="p-3 bg-red-950/40 border border-red-800/50 rounded text-xs text-red-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{authError}</span>
            </div>
            <button
              onClick={() => setAuthError(null)}
              className="text-red-400 hover:text-red-200 text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {uploadSuccessMsg && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded text-xs text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadSuccessMsg}</span>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#13171f] p-3 rounded-lg border border-[#22272e]">
          <div className="flex items-center space-x-2">
            <button
              id="btn-open-google-picker"
              onClick={handleOpenPicker}
              disabled={isOpeningPicker}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-medium px-4 py-2 rounded shadow transition-all cursor-pointer"
            >
              <FolderOpen className="w-4 h-4" />
              <span>{isOpeningPicker ? 'Opening Picker...' : 'Open Google Picker'}</span>
            </button>

            {currentUser && (
              <button
                id="btn-drive-upload-modal"
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center space-x-1.5 bg-[#1a202a] hover:bg-[#232a36] text-neutral-200 border border-[#2f3747] text-xs font-medium px-3 py-2 rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>Upload to Drive</span>
              </button>
            )}

            <button
              id="btn-drive-refresh"
              onClick={fetchDriveFiles}
              disabled={isLoadingFiles || !token}
              className="p-2 bg-[#1a202a] hover:bg-[#232a36] text-neutral-400 hover:text-neutral-200 border border-[#2f3747] rounded transition-colors disabled:opacity-40"
              title="Refresh Drive Files"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-[#0e1116] p-1 rounded-md border border-[#202530]">
            {(['all', 'images', 'videos', 'audio', 'documents'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors capitalize ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#181d26]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search in Drive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d1015] border border-[#232833] focus:border-blue-500 rounded pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Picked Document Card (from Google Picker) */}
        {pickedDoc && (
          <div className="bg-[#141a24] border border-blue-500/40 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {getMimeIcon(pickedDoc.mimeType)}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Google Picker Asset Selected
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    ID: {pickedDoc.id.slice(0, 10)}...
                  </span>
                </div>
                <h2 className="text-sm font-semibold text-neutral-100 mt-1">{pickedDoc.name}</h2>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  Type: {pickedDoc.mimeType} | Size: {formatFileSize(pickedDoc.sizeBytes?.toString())}
                </p>
              </div>
            </div>

            {/* Pipeline Action Triggers */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-picker-send-veo"
                onClick={() =>
                  onNavigateToStudio?.({
                    type: 'video',
                    id: pickedDoc.id,
                    name: pickedDoc.name,
                    mimeType: pickedDoc.mimeType,
                    url: pickedDoc.url,
                  })
                }
                className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Animate with Veo Video</span>
              </button>

              <button
                id="btn-picker-send-image"
                onClick={() =>
                  onNavigateToStudio?.({
                    type: 'image',
                    id: pickedDoc.id,
                    name: pickedDoc.name,
                    mimeType: pickedDoc.mimeType,
                    url: pickedDoc.url,
                  })
                }
                className="flex items-center space-x-1.5 bg-[#1e2430] hover:bg-[#283142] text-neutral-200 border border-[#343e52] text-xs font-medium px-3 py-1.5 rounded transition-all"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Edit with Gemini Flash Image</span>
              </button>

              <button
                id="btn-picker-send-transcribe"
                onClick={() =>
                  onNavigateToStudio?.({
                    type: 'audio',
                    id: pickedDoc.id,
                    name: pickedDoc.name,
                    mimeType: pickedDoc.mimeType,
                    url: pickedDoc.url,
                  })
                }
                className="flex items-center space-x-1.5 bg-[#1e2430] hover:bg-[#283142] text-neutral-200 border border-[#343e52] text-xs font-medium px-3 py-1.5 rounded transition-all"
              >
                <MusicIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Transcribe Audio</span>
              </button>
            </div>
          </div>
        )}

        {/* Files Grid / Empty State */}
        {!currentUser ? (
          <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center border border-dashed border-[#262c38] rounded-xl p-8 text-center bg-[#0e1117]">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <HardDrive className="w-7 h-7" />
            </div>
            <h2 className="text-base font-medium text-neutral-200">Connect Your Google Drive</h2>
            <p className="text-xs text-neutral-400 max-w-md mt-1 mb-5">
              Authorize Google Drive and Google Picker to access film rushes, concept artwork, ADR recordings, and scripts. Seamlessly send assets to Gemini Media Studio.
            </p>
            <button
              id="btn-hero-google-signin"
              onClick={handleSignIn}
              className="flex items-center space-x-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold px-5 py-2.5 rounded-md transition-all shadow-md"
            >
              <LogIn className="w-4 h-4" />
              <span>Connect Google Drive & Picker</span>
            </button>
          </div>
        ) : isLoadingFiles ? (
          <div className="flex-1 min-h-[260px] flex flex-col items-center justify-center text-neutral-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
            <p className="text-xs font-mono">Querying Google Drive files via v3 REST API...</p>
          </div>
        ) : fetchError ? (
          <div className="p-4 bg-red-950/20 border border-red-800/40 rounded-lg text-xs text-red-300">
            <p className="font-semibold mb-1">Failed to fetch files from Google Drive</p>
            <p className="font-mono text-neutral-400">{fetchError}</p>
            <button
              onClick={fetchDriveFiles}
              className="mt-3 px-3 py-1 bg-red-900/40 hover:bg-red-800/50 border border-red-700/50 rounded text-red-200"
            >
              Retry
            </button>
          </div>
        ) : files.length === 0 ? (
          <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center border border-dashed border-[#222731] rounded-lg p-6 text-center text-neutral-400">
            <FolderOpen className="w-8 h-8 text-neutral-600 mb-2" />
            <p className="text-xs">No files found matching your search in Google Drive.</p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Use &quot;Open Google Picker&quot; or upload a file to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-[#12161f] border border-[#202632] hover:border-[#323c4e] rounded-lg p-3.5 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2 rounded bg-[#181d26] border border-[#28303f]">
                      {getMimeIcon(file.mimeType)}
                    </div>
                    <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-[#1a202c] rounded"
                          title="Open in Google Drive"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => setFileToDelete(file)}
                        className="p-1 text-neutral-400 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3
                    className="text-xs font-medium text-neutral-200 mt-2.5 truncate"
                    title={file.name}
                  >
                    {file.name}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono mt-1">
                    <span>{formatFileSize(file.size)}</span>
                    <span>
                      {file.modifiedTime
                        ? new Date(file.modifiedTime).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Direct Pipe into Gemini Studio */}
                <div className="mt-3 pt-2.5 border-t border-[#1d232e] flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400 font-mono truncate max-w-[120px]">
                    {file.mimeType.split('/')[1] || file.mimeType}
                  </span>
                  <button
                    onClick={() => {
                      const mediaType = file.mimeType.includes('image/')
                        ? 'image'
                        : file.mimeType.includes('video/')
                        ? 'video'
                        : file.mimeType.includes('audio/')
                        ? 'audio'
                        : 'document';
                      onNavigateToStudio?.({
                        type: mediaType,
                        id: file.id,
                        name: file.name,
                        mimeType: file.mimeType,
                        url: file.webViewLink,
                      });
                    }}
                    className="flex items-center space-x-1 text-[10px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Send to Gemini</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload File Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#13171e] border border-[#2b3342] rounded-xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#222834] pb-3">
              <h2 className="text-sm font-semibold text-neutral-200 flex items-center space-x-2">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Upload to Google Drive</span>
              </h2>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  File Name & Extension
                </label>
                <input
                  type="text"
                  placeholder="e.g. scene_12_script_notes.txt"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  required
                  className="w-full bg-[#0c0e12] border border-[#262c38] rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  MIME Type
                </label>
                <select
                  value={uploadMimeType}
                  onChange={(e) => setUploadMimeType(e.target.value)}
                  className="w-full bg-[#0c0e12] border border-[#262c38] rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="text/plain">Text Document (text/plain)</option>
                  <option value="application/json">JSON Metadata (application/json)</option>
                  <option value="text/markdown">Markdown Script (text/markdown)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  File Content / Script Text
                </label>
                <textarea
                  rows={5}
                  placeholder="Enter notes, continuity revisions, or paste text..."
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  className="w-full bg-[#0c0e12] border border-[#262c38] rounded p-2.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-3 py-1.5 bg-[#181d26] hover:bg-[#202733] text-neutral-300 text-xs rounded border border-[#2d3646]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-all disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (MANDATORY REQUIREMENT) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#141820] border border-red-800/40 rounded-xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="p-2 bg-red-950/50 border border-red-800/50 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-neutral-100">
                  Confirm Google Drive Deletion
                </h2>
                <p className="text-xs text-neutral-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 bg-[#0e1116] p-3 rounded border border-[#232936] font-mono break-all">
              Are you sure you want to permanently delete: <br />
              <strong className="text-red-300">{fileToDelete.name}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 bg-[#1a202a] hover:bg-[#232a36] text-neutral-300 text-xs rounded border border-[#2d3646]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
