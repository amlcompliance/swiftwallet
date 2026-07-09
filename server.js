const express = require('express');
const session = require('express-session');
const path = require('path');
const { createSignature, verifySignature } = require('./lib/swiftpay');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'swiftwallet-demo-secret',
  resave: false,
  saveUninitialized: false,
}));

const users = [
  {
    id: 1,
    email: 'superadmin@swiftpay.test',
    password: 'Password123',
    role: 'Super Admin',
    name: 'Alicia Reyes',
    permissions: ['all'],
  },
  {
    id: 2,
    email: 'admin@swiftpay.test',
    password: 'Password123',
    role: 'Admin',
    name: 'Ramon Cruz',
    permissions: ['view_transactions', 'initiate_collections', 'initiate_disbursements', 'manage_settings'],
  },
  {
    id: 3,
    email: 'member@swiftpay.test',
    password: 'Password123',
    role: 'Member',
    name: 'Mina Santos',
    permissions: ['view_transactions', 'initiate_collections'],
  },
];

const members = [
  { id: 1, name: 'Mina Santos', email: 'member@swiftpay.test', role: 'Member', status: 'Active', permissions: ['view_transactions', 'initiate_collections'] },
  { id: 2, name: 'Jules Dela Cruz', email: 'jules@swiftpay.test', role: 'Admin', status: 'Active', permissions: ['view_transactions', 'initiate_disbursements', 'manage_settings'] },
];

const transactions = [
  { id: 'TXN-1001', type: 'Collection', amount: 12500, currency: 'PHP', status: 'EXECUTED', date: '2026-07-08', customer: 'Juan Dela Cruz' },
  { id: 'TXN-1002', type: 'Disbursement', amount: 4000, currency: 'PHP', status: 'PENDING', date: '2026-07-09', customer: 'A. Reyes' },
  { id: 'TXN-1003', type: 'Collection', amount: 8900, currency: 'PHP', status: 'REJECTED', date: '2026-07-09', customer: 'Liza Lim' },
];

const settings = {
  accessKey: 'sandbox-access-key',
  secretKey: 'sandbox-secret-key',
  mode: 'sandbox',
  redirectUrl: 'https://example.com/swiftpay/return',
  callbackUrl: 'https://example.com/api/swiftpay/callback',
};

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
      return res.status(403).send('Forbidden');
    }
    next();
  };
}

app.get('/', requireAuth, (req, res) => {
  res.render('dashboard', {
    user: req.session.user,
    summary: {
      collected: 125000,
      disbursed: 65000,
      pending: 8,
      failed: 2,
    },
    transactions,
  });
});

app.get('/login', (req, res) => {
  res.render('login', { error: null, user: req.session.user || null });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((entry) => entry.email === email && entry.password === password);
  if (!user) {
    return res.render('login', { error: 'Invalid credentials', user: null });
  }
  req.session.user = user;
  res.redirect('/');
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/register', (req, res) => {
  res.render('register', { step: 1, user: req.session.user || null });
});

app.post('/register', (req, res) => {
  res.render('register', { step: 2, user: req.session.user || null });
});

app.get('/terms', (req, res) => {
  res.render('terms', { user: req.session.user || null });
});

app.post('/terms/accept', (req, res) => {
  res.render('compliance', { user: req.session.user || null });
});

app.get('/compliance', (req, res) => {
  res.render('compliance', { user: req.session.user || null });
});

app.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { message: null, user: req.session.user || null });
});

app.post('/forgot-password', (req, res) => {
  res.render('forgot-password', { message: 'Password reset instructions sent to your email.', user: req.session.user || null });
});

app.get('/merchant-profile', requireAuth, (req, res) => {
  res.render('merchant-profile', { user: req.session.user });
});

app.get('/merchant-balance', requireAuth, (req, res) => {
  res.render('merchant-balance', { user: req.session.user });
});

app.get('/transactions', requireAuth, (req, res) => {
  res.render('transactions', { user: req.session.user, transactions });
});

app.get('/admin/members', requireAuth, requireRole(['Super Admin', 'Admin']), (req, res) => {
  res.render('members', { user: req.session.user, members });
});

app.get('/admin/settings', requireAuth, requireRole(['Super Admin', 'Admin']), (req, res) => {
  res.render('settings', { user: req.session.user, settings });
});

app.post('/admin/settings', requireAuth, requireRole(['Super Admin', 'Admin']), (req, res) => {
  Object.assign(settings, req.body);
  res.redirect('/admin/settings');
});

app.post('/api/swiftpay/collection', requireAuth, (req, res) => {
  const payload = {
    merchantId: req.session.user.id,
    amount: req.body.amount,
    currency: 'PHP',
    orderId: `SW-${Date.now()}`,
    redirectUrl: settings.redirectUrl,
  };
  const signature = createSignature(payload, settings.secretKey);
  res.json({ success: true, payload, signature, redirectUrl: '/transactions' });
});

app.post('/api/swiftpay/disbursement', requireAuth, (req, res) => {
  const payload = {
    merchantId: req.session.user.id,
    amount: req.body.amount,
    currency: 'PHP',
    orderId: `DSP-${Date.now()}`,
  };
  const signature = createSignature(payload, settings.secretKey);
  res.json({ success: true, payload, signature, status: 'PENDING' });
});

app.post('/api/swiftpay/callback', express.json(), (req, res) => {
  const signature = req.headers['x-swiftpay-signature'];
  const valid = verifySignature(JSON.stringify(req.body), signature, settings.secretKey);
  if (!valid) {
    return res.status(401).json({ success: false, message: 'Invalid signature' });
  }
  const tx = transactions[0];
  tx.status = req.body.status || 'EXECUTED';
  res.json({ success: true, message: 'Updated', tx });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`SwiftWallet MVP listening on http://localhost:${PORT}`);
});
