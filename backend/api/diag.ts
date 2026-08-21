export default function handler(req, res) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
        hasDbUrl: !!process.env.DATABASE_URL,
        hasOlEmail: !!process.env.OL_CONTACT_EMAIL,
        hasJwtAccess: !!process.env.JWT_ACCESS_SECRET,
        hasJwtRefresh: !!process.env.JWT_REFRESH_SECRET,
        hasDeepseek: !!process.env.DEEPSEEK_API_KEY,
        nodeEnv: process.env.NODE_ENV || "not set",
    }));
}
