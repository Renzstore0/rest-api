'use strict';

require('dotenv').config();
const express       = require('express');
const helmet        = require('helmet');
const cors          = require('cors');
const session       = require('express-session');
const MySQLStore    = require('express-mysql-session')(session);
const path          = require('path');
const migrate       = require('./config/migrate');
const webRoutes     = require('./routes/web');
const authRoutes    = require('./routes/auth');
const apiRoutes     = require('./routes/api');
const antiDdos      = require('./middlewares/antiDdos');
const requestLogger = require('./middlewares/requestLogger');
const resetScheduler = require('./utils/resetScheduler');
const roleExpiryScheduler = require('./utils/roleExpiryScheduler');
const uploadCleanupScheduler = require('./utils/uploadCleanupScheduler');
const paymentPollScheduler = require('./utils/paymentPollScheduler');

const app  = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

const sessionStore = new MySQLStore({
  host:              process.env.DB_HOST,
  port:              3306,
  user:              process.env.DB_USER,
  password:          process.env.DB_PASSWORD,
  database:          process.env.DB_NAME,
  createDatabaseTable: false,
  schema: {
    tableName:        'sessions',
    columnNames: {
      session_id:     'session_id',
      expires:        'expires',
      data:           'data'
    }
  }
});

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(helmet({ contentSecurityPolicy: false }));

const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const apiCors      = cors({ origin: '*' });
const webCors      = cors({ origin: CORS_ORIGINS, credentials: true });

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return apiCors(req, res, next);
  return webCors(req, res, next);
});

app.use(session({
  secret:            process.env.SESSION_SECRET,
  store:             sessionStore,
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    domain:   process.env.COOKIE_DOMAIN || undefined,
    maxAge:   24 * 60 * 60 * 1000
  }
}));

app.use(requestLogger);
app.use(antiDdos);

app.use('/',     webRoutes);
app.use('/auth', authRoutes);
app.use('/api',  apiRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

migrate()
  .then(() => {
    roleExpiryScheduler.start();
    resetScheduler.start();
    uploadCleanupScheduler.start();
    paymentPollScheduler.start();
    app.listen(PORT, () => {
      console.log(`[Lumpo] Running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('[Lumpo] Migration failed:', err.message);
    process.exit(1);
  });
