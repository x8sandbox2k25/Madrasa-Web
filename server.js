const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ভিজিটর ট্রাফিক ডেটা সংরক্ষণ
const trafficData = [];
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// সেশন সিকিউরিটি কনফিগারেশন
app.use(session({
    secret: 'madrasa_admin_secret_key_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 } // ১ ঘণ্টা সেশন মেয়াদ
}));

// ইউজার ট্রাফিক ট্র্যাকিং মিডলওয়্যার
app.use((req, res, next) => {
    if (!req.path.startsWith('/admin') && !req.path.startsWith('/api')) {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        trafficData.push({
            id: trafficData.length + 1,
            ip: clientIp,
            page: req.path,
            userAgent: req.headers['user-agent'],
            timestamp: new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })
        });
    }
    next();
});

// অথেন্টিকেশন চেক
function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized access' });
    }
}

// অ্যাডমিন লগইন API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'Alhamdulillah10xyz') {
        req.session.isAdmin = true;
        return res.json({ success: true });
    }
    res.status(401).json({ success: false });
});

// অ্যাডমিন লগআউট API
app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

// ট্রাফিক ডেটা পাঠাবে
app.get('/api/admin/traffic', requireAuth, (req, res) => {
    res.json({
        totalVisitors: trafficData.length,
        traffic: trafficData.slice(-100).reverse()
    });
});

app.listen(PORT, () => {
    console.log(`Server executing at http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
