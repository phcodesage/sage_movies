'use client';

import { useEffect, useRef, useState } from 'react';
import { Smartphone, Download, X } from 'lucide-react';
import { usePWA } from './PWAProvider';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DownloadAppModal({ isOpen, onClose }: DownloadAppModalProps) {
  const { canInstall, installed, isIOS, isAndroid, install } = usePWA();
  const dialog = useRef<HTMLDialogElement>(null);
  const [installError, setInstallError] = useState('');
  const downloadUrl =
    process.env.NEXT_PUBLIC_ANDROID_APK_URL ||
    'https://sagemovies-downloads.rechceltoledo.workers.dev/sagemovies-latest.apk';

  useEffect(() => {
    if (isOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
      aria-labelledby="install-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-zinc-700 bg-[#0f1015] p-6 text-white shadow-2xl backdrop:bg-black/80"
    >
      <button
        onClick={onClose}
        aria-label="Close install instructions"
        className="absolute right-3 top-3 rounded p-2 hover:bg-zinc-800"
      >
        <X size={20} />
      </button>
      <Smartphone className="mb-4 text-yellow-400" size={32} />
      <h2 id="install-title" className="text-xl font-black">
        Sage Movies on your home screen
      </h2>
      <p className="my-3 text-sm text-zinc-300">
        Open Sage Movies like an app on iPhone, iPad, Android, or your computer. An internet
        connection is needed to stream.
      </p>
      {installed ? (
        <p className="my-4 text-green-400">Sage Movies is installed and ready.</p>
      ) : canInstall ? (
        <button
          onClick={async () => {
            try {
              await install();
            } catch {
              setInstallError('Use your browser menu to install Sage Movies.');
            }
          }}
          className="my-4 flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-4 py-3 font-bold text-black"
        >
          <Download size={18} /> Install Sage Movies
        </button>
      ) : isIOS ? (
        <ol className="my-4 list-decimal space-y-2 pl-5 text-sm">
          <li>Open this site in Safari.</li>
          <li>
            Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
          </li>
          <li>
            Keep <strong>Open as Web App</strong> enabled if shown, then tap <strong>Add</strong>.
          </li>
        </ol>
      ) : (
        <p className="my-4 rounded-lg bg-zinc-900 p-4 text-sm">
          Open your browser menu and choose <strong>Install app</strong> or{' '}
          <strong>Add to Home screen</strong>. On a computer, look for the install icon in the
          address bar.
        </p>
      )}
      {installError && (
        <p role="status" className="text-sm text-yellow-400">
          {installError}
        </p>
      )}
      {isAndroid && (
        <a href={downloadUrl} className="mt-3 inline-block text-sm text-zinc-400 underline">
          Download the Android APK instead
        </a>
      )}
    </dialog>
  );
}
