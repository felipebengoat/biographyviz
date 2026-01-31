import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  webpack: (config, { isServer }) => {
    // Configuración para Leaflet y Transformers.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    // Soporte para WebAssembly (necesario para Transformers.js)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    
    // En el servidor, excluir completamente el módulo Transformers.js
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@xenova/transformers': false,
      };
    }
    
    return config;
  },
};

export default nextConfig;