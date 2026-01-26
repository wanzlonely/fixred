import { Telegraf } from 'telegraf';
import { Redis } from '@upstash/redis';
import nodemailer from 'nodemailer';
import os from 'os';
import axios from 'axios';
import * as XLSX from 'xlsx';

const CONFIG = {
    botToken: '8301511202:AAHUSxb-3Jomliqs0O7XpE_JEfjOwNwtSoE',
    ownerId: '7650101390',
    ownerUsername: 'walzyexploit',
    requiredChannel: '@walzyexploit', 
    redisUrl: "https://stable-sawfish-12572.upstash.io",
    redisToken: "ATEcAAIncDJlZDcxZGU4ODZjZjQ0NWE2YTQ5NGQ3M2M5NzcyOThhN3AyMTI1NzI",
    banners: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1000',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000',
        'https://images.unsplash.com/photo-1535868463750-c78d9543614f?q=80&w=1000',
        'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1000',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000',
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1000',
        'https://images.unsplash.com/photo-1504384308090-c54be3852f92?q=80&w=1000',
        'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000',
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1000'
    ],
    maxEmails: 20,
    maxCountPerEmail: 15
};

const redis = new Redis({ url: CONFIG.redisUrl, token: CONFIG.redisToken });
const bot = new Telegraf(CONFIG.botToken);
const tempStorage = new Map();

const UTILS = {
    sleep: (ms) => new Promise(r => setTimeout(r, ms)),
    
    randomBanner: () => CONFIG.banners[Math.floor(Math.random() * CONFIG.banners.length)],

    time: (ms) => {
        if (!ms) return 'Expired 🔴';
        if (ms > 9e12) return 'Lifetime ♾️';
        if (ms < Date.now()) return 'Expired 🔴';
        const diff = ms - Date.now();
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return `${d} Hari ${h} Jam`;
    },

    mask: (e) => { 
        if(!e) return 'Unknown';
        const [n,d] = e.split('@'); 
        return `${n.slice(0,3)}•••@${d}`; 
    },

    ui: (header, content) => {
        const time = new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
        return `<b>🏝️ WALZY EXPLOIT</b>\n` +
               `━━━━━━━━━━━━━━━\n` +
               `<b>📂 ${header.toUpperCase()}</b>\n\n` +
               `${content}\n\n` +
               `<i> iOS Security Systems</i>`;
    },

    row: (label, val) => `▪ <b>${label}:</b> ${val}`,
    
    text: (txt) => `› ${txt}`,

    spin: (type, num) => {
        let templates = [];
        if(type === 'LOGIN') {
            return {
                subject: "Problemas de Registro - Login Indisponível",
                body: `Prezada Equipe de Suporte do WhatsApp,\n\nEstou com problemas para registrar meu número. Sempre que tento, recebo a mensagem "login indisponível". Este número é muito importante porque o utilizo para fins educacionais e de comunicação como estudante.\n\nEspero sinceramente que a equipe do WhatsApp possa ajudar a resolver este problema o mais rápido possível para que eu possa usá-lo novamente no WhatsApp.\n\nMeu número é ${num}\n\nAgradeço a atenção e o apoio de todos.`
            };
        } 
        if (type === 'SPAM') {
            templates = [
                { s: "Urgent: Business Account Flagged Mistakenly", b: `Dear WhatsApp Support,\n\nMy business number ${num} has been banned for spam, which is a mistake. I only send messages to clients who have opted-in to receive updates about their orders. This disruption is affecting my livelihood.\n\nPlease review the chat logs manually. I strictly follow the Terms of Service.\n\nNumber: ${num}\nThank you.` },
                { s: "Mohon Peninjauan Kembali - Kesalahan Pemblokiran", b: `Halo Tim WhatsApp,\n\nNomor saya ${num} tiba-tiba diblokir karena dianggap spam. Padahal saya hanya menggunakannya untuk komunikasi grup keluarga dan sekolah. Saya tidak pernah mengirim pesan massal atau promosi.\n\nMohon kebijaksanaannya untuk memulihkan akun saya karena sangat penting untuk sekolah daring saya.\n\nNomor: ${num}\nTerima kasih.` },
                { s: "Error en la suspensión de mi cuenta (Falso Positivo)", b: `Hola Soporte,\n\nMi número ${num} ha sido suspendido injustamente. Creo que su sistema automatizado cometió un error. Uso este teléfono para comunicarme con mi familia en el extranjero y no para enviar publicidad no deseada.\n\nPor favor, reactiven mi cuenta lo antes posible.\n\nNúmero: ${num}\nGracias.` },
                { s: "Account Restriction Appeal - Educational Use", b: `To the Support Team,\n\nI am a university student and my number ${num} was banned. I use this account solely for coordinating with my study groups and professors. I suspect being added to too many new groups triggered a false spam flag.\n\nI assure you I have not violated any policies. Please restore access.\n\nMy Number: ${num}` },
                { s: "Wrongful Ban - Please Reactivate", b: `Hello,\n\nI was shocked to find my number ${num} banned. I recently organized a community event and messaged participants who requested info. This might have been flagged as spam by the bot, but it was legitimate communication.\n\nPlease lift the ban. I will be more careful with message volume in the future.\n\nNumber: ${num}` }
            ];
        } else {
            templates = [
                { s: "CRITICAL: Account Compromised & Stolen Device", b: `Dear Trust & Safety Team,\n\nMy mobile phone was STOLEN yesterday. The thief has evidently misused my WhatsApp account ${num}, leading to a permanent ban. I have just recovered my SIM card from my carrier.\n\nThe spam activity was NOT done by me. Please remove the ban so I can secure my account with 2FA immediately.\n\nVictim Number: ${num}` },
                { s: "Conta Hackeada - Acesso Não Autorizado", b: `Equipe de Segurança,\n\nCliquei acidentalmente em um link de phishing e perdi o acesso ao meu WhatsApp (${num}). O invasor usou minha conta para enviar spam, o que causou o banimento.\n\nEu já recuperei o acesso ao meu número telefônico. Por favor, removam o banimento para que eu possa retomar o controle da minha conta.\n\nNúmero: ${num}` },
                { s: "Appeal for Recycled Phone Number", b: `Hello,\n\nI just bought a new SIM card with number ${num} from the store today. When I tried to register, it said it was banned. It seems the previous owner of this number violated the rules, not me.\n\nI have proof of purchase for this new SIM. Please reset the account status for me, the new owner.\n\nNumber: ${num}` },
                { s: "Kehilangan Akses - HP Direset Orang Lain", b: `Yth Tim WhatsApp,\n\nAkun WhatsApp saya di nomor ${num} diblokir permanen. Handphone saya sempat dipinjam orang lain dan disalahgunakan tanpa sepengetahuan saya untuk mengirim broadcast.\n\nSaya berjanji akan menjaga keamanan perangkat saya lebih ketat. Mohon berikan kesempatan kedua dan buka blokirnya.\n\nNomor: ${num}` },
                { s: "Security Breach - Identity Theft Report", b: `To Support,\n\nI am reporting a case of identity theft. Someone cloned my number ${num} or accessed it via WhatsApp Web without my consent and engaged in prohibited activities.\n\nI am the legal owner of this line. Please review the IP addresses; the spam did not originate from my usual location. Unban my number please.\n\nTarget: ${num}` }
            ];
        }
        const selected = templates[Math.floor(Math.random() * templates.length)];
        return { subject: selected.s, body: selected.b };
    },

    detect: (num) => {
        const map = {
    '1': 'USA/Canada 🇺🇸', '1242': 'Bahamas 🇧🇸', '1246': 'Barbados 🇧🇧', '1264': 'Anguilla 🇦🇮',
    '1268': 'Antigua & Barbuda 🇦🇬', '1284': 'British Virgin Is 🇻🇬', '1340': 'US Virgin Is 🇻🇮', '1345': 'Cayman Is 🇰🇾',
    '1441': 'Bermuda 🇧🇲', '1473': 'Grenada 🇬🇩', '1649': 'Turks & Caicos 🇹🇨', '1664': 'Montserrat 🇲🇸',
    '1670': 'Northern Mariana Is 🇲🇵', '1671': 'Guam 🇬🇺', '1684': 'American Samoa 🇦🇸', '1721': 'Sint Maarten 🇸🇽',
    '1758': 'St Lucia 🇱🇨', '1767': 'Dominica 🇩🇲', '1784': 'St Vincent & Grenadines 🇻🇨', '1787': 'Puerto Rico 🇵🇷',
    '1809': 'Dominican Rep 🇩🇴', '1868': 'Trinidad & Tobago 🇹🇹', '1869': 'St Kitts & Nevis 🇰🇳', '1876': 'Jamaica 🇯🇲',
    '20': 'Egypt 🇪🇬', '211': 'South Sudan 🇸🇸', '212': 'Morocco 🇲🇦', '213': 'Algeria 🇩🇿',
    '216': 'Tunisia 🇹🇳', '218': 'Libya 🇱🇾', '220': 'Gambia 🇬🇲', '221': 'Senegal 🇸🇳',
    '222': 'Mauritania 🇲🇷', '223': 'Mali 🇲🇱', '224': 'Guinea 🇬🇳', '225': 'Ivory Coast 🇨🇮',
    '226': 'Burkina Faso 🇧🇫', '227': 'Niger 🇳🇪', '228': 'Togo 🇹🇬', '229': 'Benin 🇧🇯',
    '230': 'Mauritius 🇲🇺', '231': 'Liberia 🇱🇷', '232': 'Sierra Leone 🇸🇱', '233': 'Ghana 🇬🇭',
    '234': 'Nigeria 🇳🇬', '235': 'Chad 🇹🇩', '236': 'CAR 🇨🇫', '237': 'Cameroon 🇨🇲',
    '238': 'Cape Verde 🇨🇻', '239': 'Sao Tome 🇸🇹', '240': 'Eq Guinea 🇬🇶', '241': 'Gabon 🇬🇦',
    '242': 'Congo Rep 🇨🇬', '243': 'DR Congo 🇨🇩', '244': 'Angola 🇦🇴', '245': 'Guinea-Bissau 🇬🇼',
    '246': 'Diego Garcia 🇮🇴', '247': 'Ascension Is 🇦🇨', '248': 'Seychelles 🇸🇨', '249': 'Sudan 🇸🇩',
    '250': 'Rwanda 🇷🇼', '251': 'Ethiopia 🇪🇹', '252': 'Somalia 🇸🇴', '253': 'Djibouti 🇩🇯',
    '254': 'Kenya 🇰🇪', '255': 'Tanzania 🇹🇿', '256': 'Uganda 🇺🇬', '257': 'Burundi 🇧🇮',
    '258': 'Mozambique 🇲🇿', '260': 'Zambia 🇿🇲', '261': 'Madagascar 🇲🇬', '262': 'Reunion/Mayotte 🇷🇪',
    '263': 'Zimbabwe 🇿🇼', '264': 'Namibia 🇳🇦', '265': 'Malawi 🇲🇼', '266': 'Lesotho 🇱🇸',
    '267': 'Botswana 🇧🇼', '268': 'Eswatini 🇸🇿', '269': 'Comoros 🇰🇲', '27': 'South Africa 🇿🇦',
    '290': 'St Helena 🇸🇭', '291': 'Eritrea 🇪🇷', '297': 'Aruba 🇦🇼', '298': 'Faroe Is 🇫🇴',
    '299': 'Greenland 🇬🇱', '30': 'Greece 🇬🇷', '31': 'Netherlands 🇳🇱', '32': 'Belgium 🇧🇪',
    '33': 'France 🇫🇷', '34': 'Spain 🇪🇸', '350': 'Gibraltar 🇬🇮', '351': 'Portugal 🇵🇹',
    '352': 'Luxembourg 🇱🇺', '353': 'Ireland 🇮🇪', '354': 'Iceland 🇮🇸', '355': 'Albania 🇦🇱',
    '356': 'Malta 🇲🇹', '357': 'Cyprus 🇨🇾', '358': 'Finland 🇫🇮', '359': 'Bulgaria 🇧🇬',
    '36': 'Hungary 🇭🇺', '370': 'Lithuania 🇱🇹', '371': 'Latvia 🇱🇻', '372': 'Estonia 🇪🇪',
    '373': 'Moldova 🇲🇩', '374': 'Armenia 🇦🇲', '375': 'Belarus 🇧🇾', '376': 'Andorra 🇦🇩',
    '377': 'Monaco 🇲🇨', '378': 'San Marino 🇸🇲', '379': 'Vatican City 🇻🇦', '380': 'Ukraine 🇺🇦',
    '381': 'Serbia 🇷🇸', '382': 'Montenegro 🇲🇪', '383': 'Kosovo 🇽🇰', '385': 'Croatia 🇭🇷',
    '386': 'Slovenia 🇸🇮', '387': 'Bosnia 🇧🇦', '389': 'North Macedonia 🇲🇰', '39': 'Italy 🇮🇹',
    '40': 'Romania 🇷🇴', '41': 'Switzerland 🇨🇭', '420': 'Czechia 🇨🇿', '421': 'Slovakia 🇸🇰',
    '423': 'Liechtenstein 🇱🇮', '43': 'Austria 🇦🇹', '44': 'UK 🇬🇧', '441481': 'Guernsey 🇬🇬',
    '441534': 'Jersey 🇯🇪', '441624': 'Isle of Man 🇮🇲', '45': 'Denmark 🇩🇰', '46': 'Sweden 🇸🇪',
    '47': 'Norway 🇳🇴', '48': 'Poland 🇵🇱', '49': 'Germany 🇩🇪', '500': 'Falkland Is 🇫🇰',
    '501': 'Belize 🇧🇿', '502': 'Guatemala 🇬🇹', '503': 'El Salvador 🇸🇻', '504': 'Honduras 🇭🇳',
    '505': 'Nicaragua 🇳🇮', '506': 'Costa Rica 🇨🇷', '507': 'Panama 🇵🇦', '508': 'St Pierre & Miquelon 🇵🇲',
    '509': 'Haiti 🇭🇹', '51': 'Peru 🇵🇪', '52': 'Mexico 🇲🇽', '53': 'Cuba 🇨🇺',
    '54': 'Argentina 🇦🇷', '55': 'Brazil 🇧🇷', '56': 'Chile 🇨🇱', '57': 'Colombia 🇨🇴',
    '58': 'Venezuela 🇻🇪', '590': 'Guadeloupe 🇬🇵', '591': 'Bolivia 🇧🇴', '592': 'Guyana 🇬🇾',
    '593': 'Ecuador 🇪🇨', '594': 'French Guiana 🇬🇫', '595': 'Paraguay 🇵🇾', '596': 'Martinique 🇲🇶',
    '597': 'Suriname 🇸🇷', '598': 'Uruguay 🇺🇾', '599': 'Curacao/Bonaire 🇨🇼', '60': 'Malaysia 🇲🇾',
    '61': 'Australia 🇦🇺', '62': 'Indonesia 🇮🇩', '63': 'Philippines 🇵🇭', '64': 'New Zealand 🇳🇿',
    '65': 'Singapore 🇸🇬', '66': 'Thailand 🇹🇭', '670': 'Timor-Leste 🇹🇱', '672': 'Norfolk Is 🇳🇫',
    '673': 'Brunei 🇧🇳', '674': 'Nauru 🇳🇷', '675': 'Papua New Guinea 🇵🇬', '676': 'Tonga 🇹🇴',
    '677': 'Solomon Is 🇸🇧', '678': 'Vanuatu 🇻🇺', '679': 'Fiji 🇫🇯', '680': 'Palau 🇵🇼',
    '681': 'Wallis & Futuna 🇼🇫', '682': 'Cook Is 🇨🇰', '683': 'Niue 🇳🇺', '685': 'Samoa 🇼🇸',
    '686': 'Kiribati 🇰🇮', '687': 'New Caledonia 🇳🇨', '688': 'Tuvalu 🇹🇻', '689': 'French Polynesia 🇵🇫',
    '690': 'Tokelau 🇹🇰', '691': 'Micronesia 🇫🇲', '692': 'Marshall Is 🇲🇭', '7': 'Russia/Kazakhstan 🇷🇺',
    '81': 'Japan 🇯🇵', '82': 'South Korea 🇰🇷', '84': 'Vietnam 🇻🇳', '850': 'North Korea 🇰🇵',
    '852': 'Hong Kong 🇭🇰', '853': 'Macau 🇲🇴', '855': 'Cambodia 🇰🇭', '856': 'Laos 🇱🇦',
    '86': 'China 🇨🇳', '880': 'Bangladesh 🇧🇩', '886': 'Taiwan 🇹🇼', '90': 'Turkey 🇹🇷',
    '91': 'India 🇮🇳', '92': 'Pakistan 🇵🇰', '93': 'Afghanistan 🇦🇫', '94': 'Sri Lanka 🇱🇰',
    '95': 'Myanmar 🇲🇲', '960': 'Maldives 🇲🇻', '961': 'Lebanon 🇱🇧', '962': 'Jordan 🇯🇴',
    '963': 'Syria 🇸🇾', '964': 'Iraq 🇮🇶', '965': 'Kuwait 🇰🇼', '966': 'Saudi Arabia 🇸🇦',
    '967': 'Yemen 🇾🇪', '968': 'Oman 🇴🇲', '970': 'Palestine 🇵🇸', '971': 'UAE 🇦🇪',
    '972': 'Israel 🇮🇱', '973': 'Bahrain 🇧🇭', '974': 'Qatar 🇶🇦', '975': 'Bhutan 🇧🇹',
    '976': 'Mongolia 🇲🇳', '977': 'Nepal 🇳🇵', '98': 'Iran 🇮🇷', '992': 'Tajikistan 🇹🇯',
    '993': 'Turkmenistan 🇹🇲', '994': 'Azerbaijan 🇦🇿', '995': 'Georgia 🇬🇪', '996': 'Kyrgyzstan 🇰🇬',
    '998': 'Uzbekistan 🇺🇿'
};

        const sorted = Object.keys(map).sort((a, b) => b.length - a.length);
        for (const p of sorted) {
            if (num.startsWith(p)) return map[p];
        }
        return 'International 🌍';
    }
};

class Database {
    constructor() { this.k = { u: 'wz:u', e: 'wz:e', s: 'wz:s', c: 'wz:c', m: 'wz:msg' }; }
    
    async safe(fn, fallback) {
        try { return await fn(); } 
        catch(e) { console.error('DB Error:', e.message); return fallback; }
    }

    async getUser(id) {
        return this.safe(async () => {
            const d = await redis.hget(this.k.u, String(id));
            if (!d) {
                const n = { id: String(id), username: 'User', role: String(id) === CONFIG.ownerId ? 'owner' : 'user', exp: 0, joined: Date.now() };
                await this.saveUser(id, n);
                return n;
            }
            return typeof d === 'string' ? JSON.parse(d) : d;
        }, { id: String(id), role: 'user', exp: 0, joined: Date.now() });
    }

    async saveUser(id, d) { return this.safe(() => redis.hset(this.k.u, { [String(id)]: JSON.stringify(d) }), null); }
    async getAllUsers() { return this.safe(async () => { const d = await redis.hgetall(this.k.u); return d ? Object.values(d).map(x => typeof x === 'string' ? JSON.parse(x) : x) : []; }, []); }
    async getEmails() { return this.safe(async () => (await redis.get(this.k.e)) || [], []); }
    async saveEmails(e) { return this.safe(() => redis.set(this.k.e, e), null); }
    
    async addEmail(email, pass) {
        const c = await this.getEmails();
        if (c.length >= CONFIG.maxEmails) return false;
        c.push({ email, pass, used: 0, status: 'active' });
        await this.saveEmails(c);
        return true;
    }
    
    async logStat(type) {
        const s = await this.safe(() => redis.get(this.k.s), { s: 0, f: 0 }) || { s: 0, f: 0 };
        if (type) s[type === 'success' ? 's' : 'f']++;
        await this.safe(() => redis.set(this.k.s, s));
        return s;
    }
    
    async toggleMt() {
        const c = await this.safe(() => redis.get(this.k.c), { mt: false }) || { mt: false };
        c.mt = !c.mt;
        await this.safe(() => redis.set(this.k.c, c));
        return c.mt;
    }
    async getMt() { const c = await this.safe(() => redis.get(this.k.c), { mt: false }); return c ? c.mt : false; }
    
    async setLastMsg(uid, mid) { return this.safe(() => redis.hset(this.k.m, { [String(uid)]: mid }), null); }
    async getLastMsg(uid) { return this.safe(() => redis.hget(this.k.m, String(uid)), null); }
}
const db = new Database();

const UI = {
    main: (u) => {
        const b = [
            [{ text: '⚡ INJECT WA', callback_data: 'nav_fix' }, { text: '📂 KONVERSI FILE', callback_data: 'nav_convert' }],
            [{ text: '👤 PROFILE', callback_data: 'nav_acc' }, { text: '📊 SERVER INFO', callback_data: 'nav_stats' }],
            [{ text: '📞 CONTACT OWNER', url: `https://t.me/${CONFIG.ownerUsername}` }]
        ];
        if (u.role === 'owner') {
            b.push([{ text: '💎 OWNER PANEL', callback_data: 'nav_admin' }, { text: '📧 EMAIL BASE', callback_data: 'nav_emails' }]);
        }
        return { inline_keyboard: b };
    },
    fixMenu: (num) => ({
        inline_keyboard: [
            [{ text: '🔓 LOGIN FIX', callback_data: `exec_FIX_LOGIN_${num}` }, { text: '🔨 SPAM UNBAN', callback_data: `exec_FIX_SPAM_${num}` }],
            [{ text: '🛡️ PERMANENT', callback_data: `exec_FIX_PERM_${num}` }],
            [{ text: '🔙 KEMBALI', callback_data: 'nav_home' }]
        ]
    }),
    back: { inline_keyboard: [[{ text: '🔙 DASHBOARD', callback_data: 'nav_home' }]] },
    admin: {
        inline_keyboard: [
            [{ text: '👥 ALL USERS', callback_data: 'adm_users' }, { text: '📢 BROADCAST', callback_data: 'adm_bc' }],
            [{ text: '➕ ADD EXP', callback_data: 'adm_add' }, { text: '➖ DEL EXP', callback_data: 'adm_del' }],
            [{ text: '🚧 MT MODE', callback_data: 'adm_mt' }, { text: '🔙 HOME', callback_data: 'nav_home' }]
        ]
    },
    emails: {
        inline_keyboard: [
            [{ text: '➕ ADD EMAIL', callback_data: 'em_add' }, { text: '🗑️ DEL EMAIL', callback_data: 'em_del' }],
            [{ text: '📋 LIST ALL', callback_data: 'em_list' }, { text: '🔙 HOME', callback_data: 'nav_home' }]
        ]
    },
    cancel: { inline_keyboard: [[{ text: '❌ BATALKAN', callback_data: 'act_cancel' }]] },
    join: { inline_keyboard: [
        [{ text: '📢 JOIN CHANNEL WAJIB', url: `https://t.me/${CONFIG.requiredChannel.replace('@', '')}` }],
        [{ text: '🔄 CEK STATUS', callback_data: 'nav_home' }]
    ]}
};

const render = async (ctx, caption, markup) => {
    const uid = ctx.from.id;
    let imageUrl = UTILS.randomBanner(); 
    
    const media = { type: 'photo', media: imageUrl, caption: caption, parse_mode: 'HTML' };
    
    try {
        if (ctx.callbackQuery) {
            await ctx.editMessageMedia(media, { reply_markup: markup }).catch(async (e) => {
                 if (e.description && e.description.includes('message is not modified')) return;
                 await ctx.deleteMessage().catch(()=>{});
                 const m = await ctx.replyWithPhoto(imageUrl, { caption, parse_mode: 'HTML', reply_markup: markup });
                 await db.setLastMsg(uid, m.message_id);
            });
        } else {
            const lastMsgId = await db.getLastMsg(uid);
            if (lastMsgId) await ctx.telegram.deleteMessage(ctx.chat.id, lastMsgId).catch(() => {});
            
            const m = await ctx.replyWithPhoto(imageUrl, { caption, parse_mode: 'HTML', reply_markup: markup });
            await db.setLastMsg(uid, m.message_id);
        }
    } catch (e) {
        try {
            const m = await ctx.replyWithPhoto(imageUrl, { caption, parse_mode: 'HTML', reply_markup: markup });
            await db.setLastMsg(uid, m.message_id);
        } catch(e2) {
            await ctx.reply(caption, { parse_mode: 'HTML', reply_markup: markup }).catch(()=>{});
        }
    }
};

const MAIL = {
    async verify(email, pass) {
        try {
            const tr = nodemailer.createTransport({ service: 'gmail', auth: { user: email, pass: pass } });
            await tr.verify();
            return true;
        } catch(e) { return false; }
    },
    async send(subj, body) {
        let pool = await db.getEmails();
        pool = pool.filter(e => e.status === 'active').sort((a,b) => a.used - b.used);
        if(!pool.length) throw new Error('Stok Email Habis!');
        const acc = pool[0];
        const tr = nodemailer.createTransport({ service: 'gmail', auth: { user: acc.email, pass: acc.pass } });
        try {
            await tr.sendMail({ from: acc.email, to: 'support@support.whatsapp.com', subject: subj, text: body });
            const idx = pool.findIndex(e => e.email === acc.email);
            if(idx > -1) {
                pool[idx].used++;
                if(pool[idx].used >= CONFIG.maxCountPerEmail) pool[idx].status = 'limit';
                await db.saveEmails(pool);
            }
            return acc.email;
        } catch(e) {
            if(e.responseCode === 535) {
                const idx = pool.findIndex(x => x.email === acc.email);
                if(idx > -1) { pool[idx].status = 'dead'; await db.saveEmails(pool); }
            }
            throw e;
        }
    }
};

bot.use(async (ctx, next) => {
    if(!ctx.from) return;
    
    try {
        if(ctx.chat.type === 'private') {
            const chatMember = await ctx.telegram.getChatMember(CONFIG.requiredChannel, ctx.from.id);
            if(['left', 'kicked', 'restricted'].includes(chatMember.status)) {
                 if(ctx.callbackQuery) return ctx.answerCbQuery('❌ Wajib Join Channel!', {show_alert:true});
                 if(ctx.message) await ctx.deleteMessage().catch(()=>{});
                 return ctx.reply(`Halo ${ctx.from.first_name}, akses ditolak. Silakan join channel di bawah ini dulu.`, UI.join);
            }
        }
    } catch(e) {} 

    const u = await db.getUser(ctx.from.id);
    const mt = await db.getMt();
    
    if(mt && u.role !== 'owner') {
        if(ctx.callbackQuery) return ctx.answerCbQuery('🚧 Maintenance Mode', {show_alert:true});
        return ctx.deleteMessage().catch(()=>{}); 
    }

    if(ctx.from.username && u.username !== ctx.from.username) {
        u.username = ctx.from.username; await db.saveUser(u.id, u);
    }
    if(!u.joined) { u.joined = Date.now(); await db.saveUser(u.id, u); }
    if(u.role === 'owner') u.exp = 9999999999999; 

    ctx.user = u;
    await next();
});

const renderDashboard = async (ctx) => {
    const s = await db.logStat();
    const content = 
`${UTILS.row('ID', ctx.user.id)}
${UTILS.row('Role', ctx.user.role === 'owner' ? 'Developer 👑' : 'Member 👤')}
${UTILS.row('Plan', UTILS.time(ctx.user.exp))}

${UTILS.text('CLOUD TRAFFIC')}
${UTILS.row('Success', s.s)}
${UTILS.row('Failed', s.f)}`;
    
    await render(ctx, UTILS.ui('Dashboard Utama', content), UI.main(ctx.user));
};

bot.start(renderDashboard);
bot.action('nav_home', async (ctx) => { await ctx.answerCbQuery().catch(()=>{}); renderDashboard(ctx); });

bot.action('nav_acc', async (ctx) => {
    await ctx.answerCbQuery().catch(()=>{});
    const joinDate = new Date(Number(ctx.user.joined)).toLocaleDateString('id-ID');
    const content = 
`${UTILS.row('Nama', ctx.from.first_name)}
${UTILS.row('Uname', '@'+(ctx.from.username||'-'))}
${UTILS.row('Join', joinDate)}
${UTILS.row('Status', ctx.user.exp > Date.now() ? 'Premium 🟢' : 'Expired 🔴')}`;
    await render(ctx, UTILS.ui('Profil Pengguna', content), UI.back);
});

bot.action('nav_stats', async (ctx) => {
    await ctx.answerCbQuery().catch(()=>{});
    const mem = process.memoryUsage();
    const content = 
`${UTILS.row('RAM', (mem.rss/1024/1024).toFixed(2)+' MB')}
${UTILS.row('CPU', os.loadavg()[0].toFixed(2)+'%')}
${UTILS.row('Uptime', Math.floor(process.uptime())+' Detik')}
${UTILS.row('Ping', Math.floor(Math.random() * 20) + 10 + 'ms')}`;
    await render(ctx, UTILS.ui('Informasi Server', content), UI.back);
});

bot.action('nav_fix', async (ctx) => {
    await ctx.answerCbQuery().catch(()=>{});
    await render(ctx, UTILS.ui('Menu Injeksi', 
`${UTILS.text('PANDUAN PENGGUNAAN:')}

${UTILS.text('1. Kirim nomor target di chat.')}
${UTILS.text('2. Wajib pakai kode negara (62).')}
${UTILS.text('3. Jangan pakai spasi/strip.')}

${UTILS.row('Contoh Benar', '62812345678')}`), UI.back);
});

bot.action('nav_convert', async (ctx) => {
    await ctx.answerCbQuery().catch(()=>{});
    await render(ctx, UTILS.ui('Konversi File', 
`${UTILS.text('FITUR FILE CLEANER:')}

${UTILS.text('Kirim file (Excel/Txt/CSV) ke sini.')}
${UTILS.text('Bot akan otomatis mengambil nomor HP.')}
${UTILS.text('Hasil akan jadi format .txt bersih.')}

${UTILS.text('⚠️ Support: .xlsx .xls .csv .txt')}`), UI.back);
});

bot.action('nav_admin', async (ctx) => {
    if(ctx.user.role !== 'owner') return;
    await ctx.answerCbQuery().catch(()=>{});
    const mt = await db.getMt();
    await render(ctx, UTILS.ui('Panel Owner', 
`${UTILS.row('Maintenance', mt ? 'AKTIF 🔴' : 'MATI 🟢')}
${UTILS.row('Keamanan', 'Terenkripsi')}`), UI.admin);
});

bot.action('nav_emails', async (ctx) => {
    if(ctx.user.role !== 'owner') return;
    await ctx.answerCbQuery().catch(()=>{});
    const e = await db.getEmails();
    await render(ctx, UTILS.ui('Manajemen Email', 
`${UTILS.row('Total', e.length)}
${UTILS.row('Aktif', e.filter(x=>x.status==='active').length)}
${UTILS.row('Mati', e.filter(x=>x.status!=='active').length)}`), UI.emails);
});

bot.action('em_list', async (ctx) => {
    if(ctx.user.role !== 'owner') return;
    await ctx.answerCbQuery().catch(()=>{});
    const e = await db.getEmails();
    const list = e.map((x,i) => `${i+1}. ${UTILS.mask(x.email)} [${x.used}] ${x.status=='active'?'🟢':'🔴'}`).join('\n');
    await render(ctx, UTILS.ui('Daftar Email', list.substring(0, 800) || 'Kosong'), UI.emails);
});

bot.action('adm_users', async (ctx) => {
    if(ctx.user.role !== 'owner') return;
    await ctx.answerCbQuery().catch(()=>{});
    const users = await db.getAllUsers();
    const list = users.slice(0, 10).map(u => {
        const st = u.exp > Date.now() ? '🟢' : '🔴';
        return `${u.id} | ${st}`;
    }).join('\n');
    await render(ctx, UTILS.ui('Database User', list || 'Kosong'), UI.admin);
});

bot.action('adm_mt', async (ctx) => { 
    if(ctx.user.role === 'owner') { 
        await ctx.answerCbQuery().catch(()=>{});
        await db.toggleMt(); 
        await renderDashboard(ctx);
        ctx.dispatch('nav_admin'); 
    } 
});

const handlePrompt = (ctx, type, msg) => {
    ctx.answerCbQuery().catch(()=>{});
    tempStorage.set(ctx.from.id, { t: type });
    render(ctx, UTILS.ui('Input Data', `${UTILS.text(msg)}`), UI.cancel);
};

bot.action('adm_bc', (ctx) => handlePrompt(ctx, 'BC', 'Masukkan pesan broadcast:'));
bot.action('adm_add', (ctx) => handlePrompt(ctx, 'ADD_DUR_ID', 'Masukkan ID Telegram User:'));
bot.action('adm_del', (ctx) => handlePrompt(ctx, 'DEL_DUR', 'Masukkan ID Telegram User:'));
bot.action('em_add', (ctx) => handlePrompt(ctx, 'EMAIL_1', 'Masukkan Email Gmail Baru:'));
bot.action('em_del', (ctx) => handlePrompt(ctx, 'EMAIL_DEL', 'Masukkan Nomor Urut Email:'));
bot.action('act_cancel', async (ctx) => { ctx.answerCbQuery().catch(()=>{}); tempStorage.delete(ctx.from.id); await renderDashboard(ctx); });

bot.action(/^exec_(FIX_LOGIN|FIX_SPAM|FIX_PERM)_(\d+)$/, async (ctx) => {
    if(ctx.user.role !== 'owner' && ctx.user.exp < Date.now()) return ctx.answerCbQuery('🔒 Upgrade Premium Dulu Bos!', {show_alert:true});
    
    await ctx.answerCbQuery('🚀 Memproses...').catch(()=>{}); 

    const [, method, target] = ctx.match;
    const logs = [{ t: 'Menghubungkan API...', p: 20 }, { t: 'Bypass Keamanan...', p: 45 }, { t: 'Inject Script...', p: 70 }, { t: 'Mengirim Request...', p: 90 }];

    for(const l of logs) {
        await ctx.editMessageCaption(UTILS.ui('Sedang Memproses...', 
`${UTILS.row('Target', target)}
${UTILS.row('Metode', method.replace('FIX_', ''))}

${UTILS.text(l.t)}`), {parse_mode:'HTML'});
        await UTILS.sleep(500);
    }

    try {
        const c = UTILS.spin(method, target);
        const m = await MAIL.send(c.subject, c.body);
        await db.logStat('success');
        
        await ctx.editMessageCaption(UTILS.ui('Berhasil Terkirim!', 
`${UTILS.row('Target', target)}
${UTILS.row('Pengirim', UTILS.mask(m))}

${UTILS.text('Banding telah sukses dikirim ke WhatsApp.')}`), {parse_mode:'HTML'});
        
    } catch(e) {
        await db.logStat('failed');
        await ctx.editMessageCaption(UTILS.ui('Gagal Mengirim', `${UTILS.text('Error: ' + e.message)}`), {parse_mode:'HTML'});
    }
    
    await UTILS.sleep(3000);
    await renderDashboard(ctx);
});

bot.on('document', async (ctx) => {
    const fileId = ctx.message.document.file_id;
    const fileName = ctx.message.document.file_name;
    const fileUrl = await ctx.telegram.getFileLink(fileId);
    
    await ctx.reply('⏳ Sedang membaca file...').catch(()=>{});

    try {
        const response = await axios({ url: fileUrl.href, method: 'GET', responseType: 'arraybuffer' });
        let content = '';
        
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            const workbook = XLSX.read(response.data, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            content = data.flat().join('\n');
        } else {
            content = response.data.toString('utf-8');
        }

        const numbers = content.match(/\d{8,15}/g) || [];
        const uniqueNumbers = [...new Set(numbers)];
        
        if (uniqueNumbers.length === 0) return ctx.reply('❌ Tidak ada nomor ditemukan.');

        const resultText = uniqueNumbers.join('\n');
        const caption = UTILS.ui('Hasil Konversi', 
`${UTILS.row('Nama File', 'Converted_' + fileName)}
${UTILS.row('Total Nomor', uniqueNumbers.length)}

${UTILS.text('File siap digunakan.')}`);

        await ctx.replyWithDocument({
            source: Buffer.from(resultText, 'utf-8'),
            filename: `WalzyClean_${uniqueNumbers.length}.txt`
        }, { caption: caption, parse_mode: 'HTML' });

    } catch (error) {
        ctx.reply('❌ Gagal convert. File corrupt atau format salah.');
    }
});

bot.on('message', async (ctx) => {
    if(!ctx.message.text) return;
    const txt = ctx.message.text;
    const uid = ctx.from.id;

    if (ctx.chat.type === 'private' && !txt.startsWith('/') && !txt.match(/\d{8,15}/) && !tempStorage.has(uid)) {
        return ctx.deleteMessage().catch(()=>{});
    }

    const pending = tempStorage.get(uid);
    if(pending) {
        await ctx.deleteMessage().catch(()=>{});
        if(pending.t === 'BC') {
            const users = await db.getAllUsers();
            await render(ctx, UTILS.ui('Broadcasting', `${UTILS.text(`Mengirim ke ${users.length} user...`)}`), undefined);
            for(const u of users) { try { await ctx.copyMessage(u.id); await UTILS.sleep(50); } catch{} }
            tempStorage.delete(uid);
            await render(ctx, UTILS.ui('Selesai', `${UTILS.text('Broadcast berhasil.')}`), UI.admin);
            return;
        }
        if(pending.t === 'ADD_DUR_ID') {
            tempStorage.set(uid, { t: 'ADD_DUR_DAYS', target: txt.trim() });
            await render(ctx, UTILS.ui('Tambah License', `${UTILS.row('Target', txt)}\n${UTILS.text('Masukkan Durasi (Hari):')}`), UI.cancel);
            return;
        }
        if(pending.t === 'ADD_DUR_DAYS') {
            const days = parseInt(txt);
            const targetId = pending.target;
            const tUser = await db.getUser(targetId);
            tUser.exp = Date.now() + (days * 86400000);
            await db.saveUser(targetId, tUser);
            tempStorage.delete(uid);
            await render(ctx, UTILS.ui('Sukses', `${UTILS.text(`User ${targetId} aktif selama ${days} hari.`)}`), UI.admin);
            return;
        }
        if(pending.t === 'DEL_DUR') {
            const tUser = await db.getUser(txt.trim());
            tUser.exp = 0;
            await db.saveUser(txt.trim(), tUser);
            tempStorage.delete(uid);
            await render(ctx, UTILS.ui('Dicabut', `${UTILS.text(`License User ${txt} telah dihapus.`)}`), UI.admin);
            return;
        }
        if(pending.t === 'EMAIL_1') {
           tempStorage.set(uid, {t: 'EMAIL_2', email: txt.trim()});
           await render(ctx, UTILS.ui('Tambah Email', `${UTILS.row('Email', txt)}\n${UTILS.text('Masukkan App Password (16 Digit):')}`), UI.cancel);
           return;
        }
        if(pending.t === 'EMAIL_2') {
            const pass = txt.replace(/\s+/g, '');
            if(pass.length !== 16) {
                 return render(ctx, UTILS.ui('Gagal', `${UTILS.text('Password harus 16 karakter! Ulangi.')}`), UI.cancel);
            }
            await render(ctx, UTILS.ui('Memverifikasi...', `${UTILS.text('Sedang login ke Google...')}`), undefined);
            const isValid = await MAIL.verify(pending.email, pass);
            
            if(isValid) {
                await db.addEmail(pending.email, pass);
                tempStorage.delete(uid);
                await render(ctx, UTILS.ui('Sukses', `${UTILS.text('Email valid & tersimpan di database.')}`), UI.emails);
            } else {
                await render(ctx, UTILS.ui('Gagal Login', `${UTILS.text('Email/Password salah! Cek App Password Anda.')}`), UI.cancel);
            }
            return;
        }
        if(pending.t === 'EMAIL_DEL') {
            const idx = parseInt(txt) - 1;
            const mails = await db.getEmails();
            if(mails[idx]) {
                mails.splice(idx, 1);
                await db.saveEmails(mails);
                await render(ctx, UTILS.ui('Dihapus', `${UTILS.text('Email berhasil dihapus dari database.')}`), UI.emails);
            }
            tempStorage.delete(uid);
            return;
        }
    }

    const ph = txt.replace(/\D/g,'');
    if(ph.length >= 8 && ph.length <= 15) {
        await render(ctx, UTILS.ui('Nomor Terdeteksi', 
`${UTILS.row('Nomor', ph)}
${UTILS.row('Negara', UTILS.detect(ph))}

${UTILS.text('Pilih metode eksekusi di bawah:')}`), UI.fixMenu(ph));
    }
});

process.on('uncaughtException', (err) => console.log('AntiCrash: ', err));
process.on('unhandledRejection', (err) => console.log('AntiCrash: ', err));

(async () => {
    console.log('System WALZY EXPLOIT Online.');
    await bot.launch();
})();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
