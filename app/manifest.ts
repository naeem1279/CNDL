import type { MetadataRoute } from 'next';

/** Web app manifest: name, colours and icons when the site is added to a phone's home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CNDL Global — Digital Dental Laboratory',
    short_name: 'CNDL',
    description: 'Digital CAD/CAM dental laboratory in Khilgaon, Dhaka: zirconia, E-max, PFM, flexible dentures and aligners.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#10395a',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
