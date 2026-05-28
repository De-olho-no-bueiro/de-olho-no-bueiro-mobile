import type { PropsWithChildren } from 'react';

import { ScrollViewStyleReset } from 'expo-router/html';

const pwaBootstrapScript = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function (error) {
      console.error('[PWA] service worker registration failed', error);
    });
  });
}
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover, shrink-to-fit=no"
        />
        <meta name="theme-color" content="#0C5A87" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="De Olho" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon-167x167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png" />

        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html:
              'html,body{background:#dbe9ff;margin:0;padding:0;touch-action:pan-x pan-y;}body{min-height:100vh;min-height:100dvh;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;}',
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: pwaBootstrapScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
