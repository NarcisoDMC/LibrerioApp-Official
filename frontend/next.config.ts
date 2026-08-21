import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // ── Orígenes permitidos en dev (IP LAN del PC; si rota de IP,
    //    actualizar aquí + CORS_ORIGIN en backend/.env + NEXT_PUBLIC_API_URL
    //    en frontend/.env.local, y reiniciar ambos servidores) ──────────────
    allowedDevOrigins: [
        "192.168.0.228",
        "192.168.0.13",
    ],
};

export default nextConfig;
