export default async function handler(req, res) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }));
}
