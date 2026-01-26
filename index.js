import { Telegraf } from 'telegraf';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { delay } from '@whiskeysockets/baileys';
import { CONFIG } from './config.js';
import { db, redis } from './database.js';
import { UTILS, MAIL } from './utils.js';
import { WA, activeSocks } from './whatsapp.js';

const bot = new Telegraf(CONFIG.botToken);
const tempStorage = new Map();

const checkAccess = (ctx, user) => {
    if (user.role !== 'owner' && user.exp < Date.now()) {
        const msg = `<b>⛔ ACCESS DENIED</b>\n\nYour subscription has expired.\nPlease contact the owner to renew access.`;
        const btn = { inline_keyboard: [[{ text: ' Contact Owner', url: `https://t.me/${CONFIG.ownerUsername}` }]] };
        
        if(ctx.callbackQuery) ctx.answerCbQuery('Subscription Expired', {show_alert:true});
        
        if(ctx.callbackQuery) ctx.editMessageText(UTILS.ui('EXPIRED', msg), { parse_mode:'HTML', reply_markup: btn }).catch(()=>{});
        else ctx.reply(UTILS.ui('EXPIRED', msg), { parse_mode:'HTML', reply_markup: btn });
        return false;
    }
    return true;
};

const UI = {
    main: (u) => {
        const b = [
            [{ text: 'Fix Login 🔴', callback_data: 'nav_fix' }, { text: 'Converter 📂', callback_data: 'nav_convert' }],
            [{ text: 'Realtime Bio 🔎', callback_data: 'nav_bio' }, { text: 'Connections 🔗', callback_data: 'nav_waconnect' }],
            [{ text: 'My Profile 👤', callback_data: 'nav_acc' }, { text: 'Server Stats 📊', callback_data: 'nav_stats' }],
        ];
        if (u.role === 'owner') b.push([{ text: 'Admin Panel ', callback_data: 'nav_admin' }]);
        return { inline_keyboard: b };
    },
    admin: {
        inline_keyboard: [
            [{ text: 'Manage Users', callback_data: 'adm_users' }, { text: 'Add Access', callback_data: 'adm_add' }],
            [{ text: 'Broadcast', callback_data: 'adm_bc' }, { text: 'Maintenance', callback_data: 'adm_mt' }],
            [{ text: 'Email DB', callback_data: 'nav_emails' }, { text: 'Dashboard', callback_data: 'nav_home' }]
        ]
    },
    back: { inline_keyboard: [[{ text: '‹ Back to Home', callback_data: 'nav_home' }]] },
    userList: (users, page = 0) => {
        const buttons = users.slice(page * 5, (page + 1) * 5).map(u => 
            [{ text: `✖ ${u.username || u.id}`, callback_data: `del_u_${u.id}` }]
        );
        const nav = [];
        if (page > 0) nav.push({ text: '‹', callback_data: `pg_u_${page - 1}` });
        if ((page + 1) * 5 < users.length) nav.push({ text: '›', callback_data: `pg_u_${page + 1}` });
        buttons.push(nav);
        buttons.push([{ text: '‹ Back', callback_data: 'nav_admin' }]);
        return { inline_keyboard: buttons };
    }
};

bot.use(async (ctx, next) => {
    if(!ctx.from) return;
    try {
        if(ctx.chat.type === 'private') {
            const cm = await ctx.telegram.getChatMember(CONFIG.requiredChannel, ctx.from.id);
            if(['left', 'kicked'].includes(cm.status)) return ctx.reply(`⚠️ Access Denied.\nJoin: ${CONFIG.requiredChannel}`);
        }
    } catch {}

    const u = await db.getUser(ctx.from.id);
    const isMT = await redis.get('wz:mt');

    if(isMT && u.role !== 'owner') {
         if(ctx.callbackQuery) return ctx.answerCbQuery('SYSTEM UNDER REPAIR', {show_alert:true});
         return ctx.reply(UTILS.ui('MAINTENANCE', 'System is currently under repair.\nPlease try again later.'));
    }
    
    ctx.user = u;
    await next();
});

const render = async (ctx, text, markup) => {
    try {
        if (ctx.callbackQuery) {
            await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: markup, disable_web_page_preview: true });
        } else {
            await ctx.reply(text, { parse_mode: 'HTML', reply_markup: markup, disable_web_page_preview: true });
        }
    } catch {
        await ctx.reply(text, { parse_mode: 'HTML', reply_markup: markup, disable_web_page_preview: true });
    }
};

bot.start((ctx) => render(ctx, UTILS.ui('DASHBOARD', `User: <b>${ctx.from.first_name}</b>\nID: <code>${ctx.from.id}</code>\nPlan: ${UTILS.time(ctx.user.exp)}`), UI.main(ctx.user)));
bot.action('nav_home', (ctx) => render(ctx, UTILS.ui('DASHBOARD', `User: <b>${ctx.from.first_name}</b>\nID: <code>${ctx.from.id}</code>\nPlan: ${UTILS.time(ctx.user.exp)}`), UI.main(ctx.user)));

bot.action('nav_fix', (ctx) => {
    if(!checkAccess(ctx, ctx.user)) return;
    render(ctx, UTILS.ui('FIX LOGIN', 'Send the target number (628xxx) directly in this chat.'), UI.back);
});

bot.action('nav_convert', (ctx) => {
    if(!checkAccess(ctx, ctx.user)) return;
    render(ctx, UTILS.ui('CONVERTER', 'Send .xlsx or .txt file to extract and clean numbers.'), UI.back);
});

bot.action('nav_bio', (ctx) => {
    if(!checkAccess(ctx, ctx.user)) return;
    if(!activeSocks.size) return ctx.answerCbQuery('Connect WhatsApp First!', {show_alert:true});
    render(ctx, UTILS.ui('BIO CHECKER', 'Send .txt file containing numbers.\nSystem will check in Real-time.'), UI.back);
});

bot.action('nav_waconnect', async (ctx) => {
    const sessions = Array.from(activeSocks.keys());
    render(ctx, UTILS.ui('CONNECTIONS', 
`Active Sessions: <b>${sessions.length}</b>\n
Click button below to scan new QR.`), { inline_keyboard: [[{text:'Add Session ➕', callback_data:'wa_new'}], [{text:'‹ Back', callback_data:'nav_home'}]] });
});

bot.action('wa_new', async (ctx) => {
    const id = `iOS_${Date.now()}`;
    await ctx.reply(`🔄 Generating Session: ${id}...`);
    WA.start(id, ctx);
});

bot.action('nav_admin', (ctx) => {
    if(ctx.user.role !== 'owner') return;
    render(ctx, UTILS.ui('ADMIN PANEL', 'Control Center.'), UI.admin);
});

bot.action('adm_mt', async (ctx) => {
    if(ctx.user.role !== 'owner') return;
    const current = await redis.get('wz:mt');
    if(current) await redis.del('wz:mt');
    else await redis.set('wz:mt', '1');
    ctx.answerCbQuery(`Maintenance: ${current ? 'OFF' : 'ON'}`);
    render(ctx, UTILS.ui('ADMIN PANEL', `Maintenance: <b>${current ? 'OFF' : 'ON'}</b>`), UI.admin);
});

bot.action('adm_users', async (ctx) => {
    if(ctx.user.role !== 'owner') return;
    const users = await db.getAllUsers();
    render(ctx, UTILS.ui('USER LIST', `Total: ${users.length} Users`), UI.userList(users, 0));
});

bot.action(/pg_u_(\d+)/, async (ctx) => {
    if(ctx.user.role !== 'owner') return;
    const page = parseInt(ctx.match[1]);
    const users = await db.getAllUsers();
    render(ctx, UTILS.ui('USER LIST', `Total: ${users.length} Users`), UI.userList(users, page));
});

bot.action(/del_u_(.+)/, async (ctx) => {
    if(ctx.user.role !== 'owner') return;
    const target = ctx.match[1];
    await db.delUser(target);
    ctx.answerCbQuery('User Deleted');
    const users = await db.getAllUsers();
    render(ctx, UTILS.ui('USER LIST', `Total: ${users.length} Users`), UI.userList(users, 0));
});

bot.action('adm_add', (ctx) => {
    tempStorage.set(ctx.from.id, { t: 'ADD_DUR' });
    ctx.reply('Format: ID|DAYS (e.g., 123456|30)');
});

bot.on('document', async (ctx) => {
    if(!checkAccess(ctx, ctx.user)) return;

    const file = await ctx.telegram.getFileLink(ctx.message.document.file_id);
    const res = await axios.get(file.href, { responseType: 'arraybuffer' });
    let content = res.data.toString('utf-8');
    
    if(ctx.message.document.file_name.endsWith('xlsx')) {
        const wb = XLSX.read(res.data);
        content = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1}).flat().join('\n');
    }

    const nums = content.match(/\d{10,15}/g);
    if(!nums) return ctx.reply('❌ No numbers found.');
    const unique = [...new Set(nums)];

    if (activeSocks.size > 0) {
        let msg = await ctx.reply(UTILS.ui('PROCESSING', `Target: ${unique.length} Numbers\nStarting engine...`), {parse_mode:'HTML'});
        let result = '';
        let liveLog = '';
        let socks = Array.from(activeSocks.values());
        
        for(let i=0; i<unique.length; i++) {
            const sock = socks[i % socks.length];
            const num = unique[i];
            const jid = num + '@s.whatsapp.net';
            
            try {
                const [onwa] = await sock.onWhatsApp(jid);
                if(onwa && onwa.exists) {
                    const status = await sock.fetchStatus(jid).catch(() => null);
                    const biz = await sock.getBusinessProfile(jid).catch(() => null);
                    
                    const bioData = {
                        status: status ? status.status : null,
                        statusDate: status ? new Date(status.setAt).getTime() / 1000 : null,
                        biz: !!biz,
                        bizProfile: biz
                    };

                    const formatted = UTILS.formatBioResult(num, bioData);
                    result += formatted + '\n\n';
                    liveLog = `☑️ <b>${num}</b>\n` + liveLog.split('\n').slice(0, 4).join('\n');
                } else {
                    result += `❌ ${num} (Not Registered)\n\n`;
                    liveLog = `❌ <b>${num}</b>\n` + liveLog.split('\n').slice(0, 4).join('\n');
                }
            } catch (e) {
                liveLog = `⚠️ <b>${num}</b> (Err)\n` + liveLog.split('\n').slice(0, 4).join('\n');
            }

            if(i % 5 === 0) {
                await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, 
                    UTILS.ui('LIVE FEED', 
                    `Progress: ${i+1}/${unique.length}\n` +
                    `Est: ${Math.floor((unique.length - i) / 5)}s\n\n` +
                    `${liveLog}`), 
                    {parse_mode:'HTML'}
                ).catch(()=>{});
            }
            await delay(1000);
        }

        await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, '✅ <b>DONE</b> Uploading result...', {parse_mode:'HTML'});
        await ctx.replyWithDocument({ source: Buffer.from(result), filename: `Result_${unique.length}.txt` }, { caption: UTILS.ui('COMPLETED', `Checked: ${unique.length}`), parse_mode:'HTML' });
    } else {
        await ctx.replyWithDocument({ source: Buffer.from(unique.join('\n')), filename: 'Clean_Numbers.txt' }, {caption: '✅ Conversion Complete'});
    }
});

bot.on('message', async (ctx) => {
    const txt = ctx.message.text;
    if(!txt) return;

    if(tempStorage.has(ctx.from.id)) {
        const sess = tempStorage.get(ctx.from.id);
        if(sess.t === 'ADD_DUR') {
            const [id, days] = txt.split('|');
            const u = await db.getUser(id);
            u.exp = Date.now() + (parseInt(days) * 86400000);
            await db.saveUser(id, u);
            ctx.reply(`✅ Added ${days} days to ${id}`);
            tempStorage.delete(ctx.from.id);
        }
        return;
    }

    const ph = txt.replace(/\D/g,'');
    if(ph.length > 9) {
        if(!checkAccess(ctx, ctx.user)) return;

        render(ctx, UTILS.ui('TARGET DETECTED', `📱: <code>${ph}</code>\n🌍: ${UTILS.getCountry(ph)}`), 
        { inline_keyboard: [[{text:'🔴 Fix Login', callback_data:`exec_FIX_${ph}`}, {text:'🟢 Unban Spam', callback_data:`exec_SPAM_${ph}`}]] });
    }
});

bot.action(/^exec_(.+)_(\d+)$/, async (ctx) => {
    if(!checkAccess(ctx, ctx.user)) return;
    
    const [, type, num] = ctx.match;
    await ctx.answerCbQuery('Sending Request...');
    try {
        const tmpl = UTILS.spin(type === 'FIX' ? 'LOGIN' : 'SPAM', num);
        const mail = await MAIL.send(tmpl.subject, tmpl.body);
        ctx.editMessageText(UTILS.ui('SENT', `✉️: ${UTILS.mask(mail)}\n📱: ${num}\n\nCheck email for updates.`), {parse_mode:'HTML'});
    } catch(e) {
        ctx.reply(`❌ Error: ${e.message}`);
    }
});

(async () => {
    console.log(' WALZY EXPLOIT iOS STARTED');
    await WA.restore();
    bot.launch();
})();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
