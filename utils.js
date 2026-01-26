import nodemailer from 'nodemailer';
import { db, CONFIG } from './database.js';

const COUNTRIES = {
    '1': 'USA/Canada 🇺🇸', '7': 'Russia/Kazakhstan 🇷🇺', '20': 'Egypt 🇪🇬', '27': 'South Africa 🇿🇦', '30': 'Greece 🇬🇷',
    '31': 'Netherlands 🇳🇱', '32': 'Belgium 🇧🇪', '33': 'France 🇫🇷', '34': 'Spain 🇪🇸', '36': 'Hungary 🇭🇺',
    '39': 'Italy 🇮🇹', '40': 'Romania 🇷🇴', '41': 'Switzerland 🇨🇭', '43': 'Austria 🇦🇹', '44': 'UK 🇬🇧',
    '45': 'Denmark 🇩🇰', '46': 'Sweden 🇸🇪', '47': 'Norway 🇳🇴', '48': 'Poland 🇵🇱', '49': 'Germany 🇩🇪',
    '51': 'Peru 🇵🇪', '52': 'Mexico 🇲🇽', '53': 'Cuba 🇨🇺', '54': 'Argentina 🇦🇷', '55': 'Brazil 🇧🇷',
    '56': 'Chile 🇨🇱', '57': 'Colombia 🇨🇴', '58': 'Venezuela 🇻🇪', '60': 'Malaysia 🇲🇾', '61': 'Australia 🇦🇺',
    '62': 'Indonesia 🇮🇩', '63': 'Philippines 🇵🇭', '64': 'New Zealand 🇳🇿', '65': 'Singapore 🇸🇬', '66': 'Thailand 🇹🇭',
    '81': 'Japan 🇯🇵', '82': 'South Korea 🇰🇷', '84': 'Vietnam 🇻🇳', '86': 'China 🇨🇳', '90': 'Turkey 🇹🇷',
    '91': 'India 🇮🇳', '92': 'Pakistan 🇵🇰', '93': 'Afghanistan 🇦🇫', '94': 'Sri Lanka 🇱🇰', '95': 'Myanmar 🇲🇲',
    '98': 'Iran 🇮🇷', '211': 'South Sudan 🇸🇸', '212': 'Morocco 🇲🇦', '213': 'Algeria 🇩🇿', '216': 'Tunisia 🇹🇳',
    '218': 'Libya 🇱🇾', '220': 'Gambia 🇬🇲', '221': 'Senegal 🇸🇳', '222': 'Mauritania 🇲🇷', '223': 'Mali 🇲🇱',
    '224': 'Guinea 🇬🇳', '225': 'Ivory Coast 🇨🇮', '226': 'Burkina Faso 🇧🇫', '227': 'Niger 🇳🇪', '228': 'Togo 🇹🇬',
    '229': 'Benin 🇧🇯', '230': 'Mauritius 🇲🇺', '231': 'Liberia 🇱🇷', '232': 'Sierra Leone 🇸🇱', '233': 'Ghana 🇬🇭',
    '234': 'Nigeria 🇳🇬', '235': 'Chad 🇹🇩', '236': 'CAR 🇨🇫', '237': 'Cameroon 🇨🇲', '238': 'Cape Verde 🇨🇻',
    '239': 'Sao Tome 🇸🇹', '240': 'Eq Guinea 🇬🇶', '241': 'Gabon 🇬🇦', '242': 'Congo 🇨🇬', '243': 'DR Congo 🇨🇩',
    '244': 'Angola 🇦🇴', '245': 'Guinea-Bissau 🇬🇼', '246': 'Diego Garcia 🇮🇴', '247': 'Ascension 🇦🇨', '248': 'Seychelles 🇸🇨',
    '249': 'Sudan 🇸🇩', '250': 'Rwanda 🇷🇼', '251': 'Ethiopia 🇪🇹', '252': 'Somalia 🇸🇴', '253': 'Djibouti 🇩🇯',
    '254': 'Kenya 🇰🇪', '255': 'Tanzania 🇹🇿', '256': 'Uganda 🇺🇬', '257': 'Burundi 🇧🇮', '258': 'Mozambique 🇲🇿',
    '260': 'Zambia 🇿🇲', '261': 'Madagascar 🇲🇬', '262': 'Reunion/Mayotte 🇷🇪', '263': 'Zimbabwe 🇿🇼', '264': 'Namibia 🇳🇦',
    '265': 'Malawi 🇲🇼', '266': 'Lesotho 🇱🇸', '267': 'Botswana 🇧🇼', '268': 'Eswatini 🇸🇿', '269': 'Comoros 🇰🇲',
    '290': 'St Helena 🇸🇭', '291': 'Eritrea 🇪🇷', '297': 'Aruba 🇦🇼', '298': 'Faroe Is 🇫🇴', '299': 'Greenland 🇬🇱',
    '350': 'Gibraltar 🇬🇮', '351': 'Portugal 🇵🇹', '352': 'Luxembourg 🇱🇺', '353': 'Ireland 🇮🇪', '354': 'Iceland 🇮🇸',
    '355': 'Albania 🇦🇱', '356': 'Malta 🇲🇹', '357': 'Cyprus 🇨🇾', '358': 'Finland 🇫🇮', '359': 'Bulgaria 🇧🇬',
    '370': 'Lithuania 🇱🇹', '371': 'Latvia 🇱🇻', '372': 'Estonia 🇪🇪', '373': 'Moldova 🇲🇩', '374': 'Armenia 🇦🇲',
    '375': 'Belarus 🇧🇾', '376': 'Andorra 🇦🇩', '377': 'Monaco 🇲🇨', '378': 'San Marino 🇸🇲', '379': 'Vatican 🇻🇦',
    '380': 'Ukraine 🇺🇦', '381': 'Serbia 🇷🇸', '382': 'Montenegro 🇲🇪', '383': 'Kosovo 🇽🇰', '385': 'Croatia 🇭🇷',
    '386': 'Slovenia 🇸🇮', '387': 'Bosnia 🇧🇦', '389': 'North Macedonia 🇲🇰', '420': 'Czechia 🇨🇿', '421': 'Slovakia 🇸🇰',
    '423': 'Liechtenstein 🇱🇮', '500': 'Falkland Is 🇫🇰', '501': 'Belize 🇧🇿', '502': 'Guatemala 🇬🇹', '503': 'El Salvador 🇸🇻',
    '504': 'Honduras 🇭🇳', '505': 'Nicaragua 🇳🇮', '506': 'Costa Rica 🇨🇷', '507': 'Panama 🇵🇦', '508': 'St Pierre 🇵🇲',
    '509': 'Haiti 🇭🇹', '590': 'Guadeloupe 🇬🇵', '591': 'Bolivia 🇧🇴', '592': 'Guyana 🇬🇾', '593': 'Ecuador 🇪🇨',
    '594': 'French Guiana 🇬🇫', '595': 'Paraguay 🇵🇾', '596': 'Martinique 🇲🇶', '597': 'Suriname 🇸🇷', '598': 'Uruguay 🇺🇾',
    '599': 'Curacao/Bonaire 🇨🇼', '670': 'Timor-Leste 🇹🇱', '672': 'Norfolk/Antarctic 🇦🇶', '673': 'Brunei 🇧🇳', '674': 'Nauru 🇳🇷',
    '675': 'Papua New Guinea 🇵🇬', '676': 'Tonga 🇹🇴', '677': 'Solomon Is 🇸🇧', '678': 'Vanuatu 🇻🇺', '679': 'Fiji 🇫🇯',
    '680': 'Palau 🇵🇼', '681': 'Wallis & Futuna 🇼🇫', '682': 'Cook Is 🇨🇰', '683': 'Niue 🇳🇺', '685': 'Samoa 🇼🇸',
    '686': 'Kiribati 🇰🇮', '687': 'New Caledonia 🇳🇨', '688': 'Tuvalu 🇹🇻', '689': 'French Polynesia 🇵🇫', '690': 'Tokelau 🇹🇰',
    '691': 'Micronesia 🇫🇲', '692': 'Marshall Is 🇲🇭', '850': 'North Korea 🇰🇵', '852': 'Hong Kong 🇭🇰', '853': 'Macau 🇲🇴',
    '855': 'Cambodia 🇰🇭', '856': 'Laos 🇱🇦', '880': 'Bangladesh 🇧🇩', '886': 'Taiwan 🇹🇼', '960': 'Maldives 🇲🇻',
    '961': 'Lebanon 🇱🇧', '962': 'Jordan 🇯🇴', '963': 'Syria 🇸🇾', '964': 'Iraq 🇮🇶', '965': 'Kuwait 🇰🇼',
    '966': 'Saudi Arabia 🇸🇦', '967': 'Yemen 🇾🇪', '968': 'Oman 🇴🇲', '970': 'Palestine 🇵🇸', '971': 'UAE 🇦🇪',
    '972': 'Israel 🇮🇱', '973': 'Bahrain 🇧🇭', '974': 'Qatar 🇶🇦', '975': 'Bhutan 🇧🇹', '976': 'Mongolia 🇲🇳',
    '977': 'Nepal 🇳🇵', '992': 'Tajikistan 🇹🇯', '993': 'Turkmenistan 🇹🇲', '994': 'Azerbaijan 🇦🇿', '995': 'Georgia 🇬🇪',
    '996': 'Kyrgyzstan 🇰🇬', '998': 'Uzbekistan 🇺🇿', '1242': 'Bahamas 🇧🇸', '1246': 'Barbados 🇧🇧', '1264': 'Anguilla 🇦🇮',
    '1268': 'Antigua 🇦🇬', '1284': 'BVI 🇻🇬', '1340': 'USVI 🇻🇮', '1345': 'Cayman Is 🇰🇾', '1441': 'Bermuda 🇧🇲',
    '1473': 'Grenada 🇬🇩', '1649': 'Turks & Caicos 🇹🇨', '1664': 'Montserrat 🇲🇸', '1670': 'Mariana Is 🇲🇵', '1671': 'Guam 🇬🇺',
    '1721': 'Sint Maarten 🇸🇽', '1758': 'St Lucia 🇱🇨', '1767': 'Dominica 🇩🇲', '1784': 'St Vincent 🇻🇨', '1787': 'Puerto Rico 🇵🇷',
    '1809': 'Dominican Rep 🇩🇴', '1829': 'Dominican Rep 🇩🇴', '1849': 'Dominican Rep 🇩🇴', '1868': 'Trinidad 🇹🇹',
    '1869': 'St Kitts 🇰🇳', '1876': 'Jamaica 🇯🇲', '1939': 'Puerto Rico 🇵🇷'
};

export const UTILS = {
    sleep: (ms) => new Promise(r => setTimeout(r, ms)),
    
    time: (ms) => {
        if (!ms || ms < Date.now()) return 'EXPIRED';
        if (ms > 9e12) return 'LIFETIME';
        const diff = ms - Date.now();
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return `${d}d ${h}h`;
    },

    mask: (e) => {
        if(!e) return 'Unknown';
        const [n,d] = e.split('@');
        return `${n.slice(0,3)}•••@${d}`;
    },

    ui: (title, content) => {
        return `<b> 𝗪𝗔𝗟𝗭𝗬 𝗶𝗢𝗦</b>\n\n` +
               `<b>${title}</b>\n` +
               `━━━━━━━━━━━━━━\n` +
               `${content}\n` +
               `━━━━━━━━━━━━━━`;
    },

    getCountry: (num) => {
        const sorted = Object.keys(COUNTRIES).sort((a,b) => b.length - a.length);
        for(const p of sorted) if(num.toString().startsWith(p)) return COUNTRIES[p];
        return 'International 🌍';
    },

    formatBioResult: (num, data) => {
        let date = '-';
        let bioAge = 0;
        let statusBadge = '⚪';

        if (data.statusDate) {
            date = new Date(data.statusDate * 1000).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
            bioAge = (Date.now()/1000) - data.statusDate;
            if(bioAge > 31536000) statusBadge = '📜 OLD';
            else if(bioAge > 2592000) statusBadge = '📅 MID';
            else statusBadge = '✨ NEW';
        }

        let verified = data.bizProfile?.email ? '☑️ Verified' : '⚠️ Standard';
        let bizInfo = '';

        if (data.biz) {
            bizInfo = `\n├  🏢 <b>Business Info</b>\n` +
                      `│  • Cat: ${data.bizProfile?.category || '-'}\n` +
                      `│  • Mail: ${data.bizProfile?.email || '-'}\n` +
                      `│  • Web: ${data.bizProfile?.website || '-'}\n` +
                      `│  • Desc: ${data.bizProfile?.description ? data.bizProfile.description.substring(0,30)+'...' : '-'}`;
        }

        return `╭  📱 <b>${num}</b>\n` +
               `│  🏳️ ${UTILS.getCountry(num)}\n` +
               `│  📝 "${data.status || '🔒 Private/Empty'}"\n` +
               `│  🕒 ${date}\n` +
               `│  🛡️ ${verified} | ${statusBadge}` +
               `${bizInfo}\n` +
               `╰─────────────────`;
    },

    spin: (type, num) => {
        let templates = [];
        if(type === 'LOGIN') {
             templates = [
                { s: "Problemas de Registro - Login Indisponível", b: `Prezada Equipe de Suporte do WhatsApp,\n\nEstou com problemas para registrar meu número. Sempre que tento, recebo a mensagem "login indisponível". Este número é muito importante porque o utilizo para fins educacionais e de comunicação como estudante.\n\nEspero sinceramente que a equipe do WhatsApp possa ajudar a resolver este problema o mais rápido possível para que eu possa usá-lo novamente no WhatsApp.\n\nMeu número é ${num}\n\nAgradeço a atenção e o apoio de todos.` },
                { s: "Problem with Number Verification", b: `Hello WhatsApp,\n\nI am having problems with number verification. The problem is that it says the number is not available, even though I just bought it, please re-verify my WhatsApp number which is affected by the issue because the number is very important ${num}, I hope this problem can be resolved soon, thank you.` }
            ];
        } else if (type === 'SPAM') {
            templates = [
                { s: "Mohon Peninjauan - Akun Terblokir", b: `Halo Tim WhatsApp,\n\nNomor saya ${num} tiba-tiba diblokir permanen karena terdeteksi spam. Saya yakin ini kesalahan sistem karena saya hanya membalas pesan pelanggan dan tidak melakukan broadcast massal.\n\nMohon kebijaksanaannya untuk memulihkan akun ini.\n\nNomor: ${num}` },
                { s: "Appeal: Account Permanently Banned", b: `Dear Support Team,\n\nMy number ${num} has been permanently banned. I suspect this happened because I was added to many new community groups recently, which triggered your anti-spam bot mistakenly. I strictly follow the Terms of Service.\n\nPlease review my activity manually.\n\nNumber: ${num}` },
                { s: "Suspensión Injusta de Cuenta", b: `Hola Soporte,\n\nEscribo para apelar la suspensión permanente de mi número ${num}. Utilizo este teléfono para mi negocio local y el bloqueo está afectando mis ventas. No he enviado spam.\n\nPor favor, reactiven mi servicio.\n\nNúmero: ${num}` },
                { s: "Apelo: Bloqueio de Conta (Erro)", b: `Prezada equipe,\n\nMeu número ${num} foi banido injustamente. Eu troquei de aparelho recentemente e, ao tentar restaurar o backup, fui bloqueado por suspeita de spam. Acredito que seja um erro técnico.\n\nPeço que verifiquem e liberem meu acesso.\n\nNúmero: ${num}` },
                { s: "Oshibka blokirovki - Proshu razbanit", b: `Zdravstvuyte WhatsApp Support,\n\nMoy nomer ${num} byl zablokirovan po oshibke (Spam). Ya ispol'zuyu yego tol'ko dlya lichnogo obshcheniya s rodnymi. Nikakogo spama ya ne rassylal.\n\nProshu snyat' blokirovku kak mozhno skoreye.\n\nNumber: ${num}` }
            ];
        }
        return templates[Math.floor(Math.random() * templates.length)];
    }
};

export const MAIL = {
    async verify(email, pass) {
        try {
            const tr = nodemailer.createTransport({ service: 'gmail', auth: { user: email, pass: pass } });
            await tr.verify();
            return true;
        } catch { return false; }
    },
    async send(subj, body) {
        let pool = await db.getEmails();
        pool = pool.filter(e => e.status === 'active').sort((a,b) => a.used - b.used);
        if(!pool.length) throw new Error('Database Email Empty');
        
        const top = pool.slice(0, 3);
        const acc = top[Math.floor(Math.random() * top.length)];

        const tr = nodemailer.createTransport({ service: 'gmail', auth: { user: acc.email, pass: acc.pass } });
        await tr.sendMail({ from: acc.email, to: 'support@support.whatsapp.com', subject: subj, text: body });
        
        const idx = pool.findIndex(e => e.email === acc.email);
        if(idx > -1) {
            pool[idx].used++;
            if(pool[idx].used >= CONFIG.maxCountPerEmail) pool[idx].status = 'limit';
            db.saveEmails(pool).catch(()=>{});
        }
        return acc.email;
    }
};
