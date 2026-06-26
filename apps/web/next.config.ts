import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@recipe-box/supabase'],
  webpack(config) {
    // The supabase workspace package uses NodeNext module resolution which
    // requires .js extensions in source imports. Webpack resolves them
    // literally, so we tell it to try .ts/.tsx before .js.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    }
    return config
  },
}

export default nextConfig
