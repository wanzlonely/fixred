import makeWASocket, { DisconnectReason, Browsers, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import { redis, useRedisAuthState } from './database.js';

export const activeSocks = new Map();

export const WA = {
    start: async (sessionId, ctx = null) => {
        const { state, saveCreds } = await useRedisAuthState(sessionId);
        const { version } = await fetchLatestBaileysVersion();
        
        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.macOS('Desktop'),
            auth: state,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            syncFullHistory: false
        });

        if(ctx) {
            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                if(qr) {
                    await ctx.replyWithPhoto({ source: Buffer.from(qr.replace('data:image/png;base64,', ''), 'base64') }, 
                    { caption: `Scan QR Code Session: <b>${sessionId}</b>\nExpires in 30s...`, parse_mode: 'HTML' });
                }
                if(connection === 'close') {
                    const code = lastDisconnect?.error?.output?.statusCode;
                    if(code !== DisconnectReason.loggedOut) {
                        WA.start(sessionId);
                    } else {
                        await redis.del(`wz:sess:${sessionId}`);
                        activeSocks.delete(sessionId);
                    }
                }
                if(connection === 'open') {
                    activeSocks.set(sessionId, sock);
                    if(ctx) await ctx.reply(`✅ WhatsApp <b>${sessionId}</b> Connected!`, {parse_mode:'HTML'});
                }
            });
        } else {
             sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update;
                if(connection === 'close') {
                    const code = lastDisconnect?.error?.output?.statusCode;
                    if(code !== DisconnectReason.loggedOut) WA.start(sessionId);
                    else {
                        await redis.del(`wz:sess:${sessionId}`);
                        activeSocks.delete(sessionId);
                    }
                }
                if(connection === 'open') activeSocks.set(sessionId, sock);
            });
        }

        sock.ev.on('creds.update', saveCreds);
        return sock;
    },

    restore: async () => {
        const keys = await redis.keys('wz:sess:*');
        for(const k of keys) {
            const id = k.split(':')[2];
            await WA.start(id);
        }
    }
};
