import { Redis } from '@upstash/redis';
import { CONFIG } from './config.js';
import { useMultiFileAuthState } from '@whiskeysockets/baileys';

export const redis = new Redis({ url: CONFIG.redisUrl, token: CONFIG.redisToken });

export class Database {
    constructor() { this.k = { u: 'wz:u', e: 'wz:e', s: 'wz:s', c: 'wz:c' }; }

    async safe(fn, fallback) {
        try { return await fn(); }
        catch(e) { return fallback; }
    }

    async getUser(id) {
        return this.safe(async () => {
            let d = await redis.hget(this.k.u, String(id));
            if (!d) {
                const n = { id: String(id), username: 'User', role: 'user', exp: 0, joined: Date.now() };
                if (String(id) === CONFIG.ownerId) { n.role = 'owner'; n.exp = 9e15; }
                await this.saveUser(id, n);
                return n;
            }
            d = typeof d === 'string' ? JSON.parse(d) : d;
            if(String(id) === CONFIG.ownerId && d.role !== 'owner') { d.role = 'owner'; d.exp = 9e15; await this.saveUser(id, d); }
            return d;
        }, { id: String(id), role: 'user', exp: 0 });
    }

    async saveUser(id, d) { return this.safe(() => redis.hset(this.k.u, { [String(id)]: JSON.stringify(d) }), null); }
    async delUser(id) { return this.safe(() => redis.hdel(this.k.u, String(id)), null); }

    async getAllUsers() {
        return this.safe(async () => {
            const d = await redis.hgetall(this.k.u);
            if (!d) return [];
            return Object.values(d).map(x => typeof x === 'string' ? JSON.parse(x) : x);
        }, []);
    }

    async getEmails() {
        const d = await this.safe(() => redis.get(this.k.e), []);
        return Array.isArray(d) ? d : [];
    }
    async saveEmails(e) { return this.safe(() => redis.set(this.k.e, JSON.stringify(e)), null); }

    async addEmail(email, pass) {
        const c = await this.getEmails();
        if (c.length >= CONFIG.maxEmails) return false;
        c.push({ email, pass, used: 0, status: 'active' });
        await this.saveEmails(c);
        return true;
    }
}

export const useRedisAuthState = async (sessionId) => {
    const key = `wz:sess:${sessionId}`;
    const readData = async () => {
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data, (k, v) => {
                if(v && v.type === 'Buffer') return Buffer.from(v.data);
                return v;
            }) : {};
        } catch { return {}; }
    };
    
    const writeData = async (data) => {
        await redis.set(key, JSON.stringify(data));
    };

    let creds = await readData();
    if(!creds || !creds.creds) {
        creds = { creds: (await useMultiFileAuthState('temp')).state.creds, keys: {} };
    }

    return {
        state: {
            creds: creds.creds,
            keys: {
                get: (type, ids) => {
                    const data = {};
                    ids.forEach(id => {
                        const k = `${type}-${id}`;
                        if (creds.keys[k]) data[id] = creds.keys[k];
                    });
                    return data;
                },
                set: (data) => {
                    for (const cat in data) {
                        for (const id in data[cat]) {
                            const k = `${cat}-${id}`;
                            creds.keys[k] = data[cat][id];
                        }
                    }
                    writeData(creds);
                }
            }
        },
        saveCreds: () => writeData(creds)
    };
};

export const db = new Database();
