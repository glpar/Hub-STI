import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // A importação da planilha de fatura sobe o arquivo pela server action.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
