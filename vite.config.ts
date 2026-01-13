import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Configuração para o ambiente de produção/preview no Easypanel
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: true, // Isso resolve o erro "Blocked request. This host is not allowed"
  },
  
  // Configuração do servidor de desenvolvimento
  server: {
    host: "0.0.0.0",
    port: 8080,
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
