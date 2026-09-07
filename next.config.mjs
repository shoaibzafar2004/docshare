/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Above the largest thing a Server Action actually accepts (a 5MB
      // attachment, see MAX_ATTACHMENT_BYTES in src/lib/attachments.ts),
      // with headroom for multipart overhead.
      bodySizeLimit: '6mb',
    },
  },
};

export default nextConfig;
