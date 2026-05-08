'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';

export default function TonProvider({ children }: { children: React.ReactNode }) {
  // Use a protocol-relative or absolute URL for the manifest
  // In development, you might need to use a local tunnel or a real URL if TON wallet requires it
  const manifestUrl = 'https://enough.pwa/tonconnect-manifest.json';

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      {children}
    </TonConnectUIProvider>
  );
}
