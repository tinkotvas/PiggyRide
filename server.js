const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const qs = require('qs');
const cookieParser = require('cookie-parser');
const MyHandler = require('./backend/helper.class');
const validRoutes = [];
const userProtector = require('./backend/user-route-protector');

Object.assign(app, { validRoutes: validRoutes });

app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());
app.use(express.static('www'));
app.use(cookieParser());
app.use(userProtector);

const User = require('./backend/user.class');
let UserModel = new User(app).myModel;
const mySession = new MyHandler(app, UserModel);

app.use(mySession);

const Order = require('./backend/order.class');
let order = new Order(app);

const Piggy = require('./backend/piggy.class');
let piggy = new Piggy(app);
const BestPiggy = require('./backend/best-piggy-route');
app.get('/bestpiggy', BestPiggy);

// let session = new Session(app);

const Extra = require('./backend/extra.class');
let extra = new Extra(app);

const Waypoint = require('./backend/waypoint.class');
// let waypoint = Waypoint.create(app, {
//   from: 'Sallerupsvägen 26B',
//   to: 'Björkholmsgatan 2',
//   startTime: new Date('2018-03-02 13:00:00')
// });

const previewOrder = require('./backend/previeworder');
app.get(
  '/previeworder',
  previewOrder(app, Waypoint, extra.model, piggy.model, order.model, UserModel)
);
const confirmOrder = require('./backend/confirmorder')
app.post('/confirmorder', confirmOrder(app, Waypoint, extra.model, piggy.model, order.model, UserModel));
app.get('/user', (req, res) => {
  // check if there is a logged-in user and return that user
  let response;
  if (req.session) {
    res.json(req.session);
    response = req.user;
    // never send the password back
    // response.password = '******';
  } else {
    response = { message: 'Not logged in' };
  }
  console.log(req.session);
});

app.get(/^[^.]*$/, (req, res, next) => {
  let reqPath = req.path.split('/').slice(1);
  if (
    reqPath[0] &&
    !validRoutes.some((route) => {
      return reqPath[0] === route || reqPath[0].startsWith(route + '/'); // route.slice(0, -1) to match singulars
    })
  ) {
    res.sendFile(path.join(__dirname, '/www/index.html'));
  } else {
    next();
  }
});

app.all('/sign-out', async (req, res) => {
  req.user = null;
  if (req.session) {
    req.session.loggedIn = false;
    let result = await req.session.save();
  }
  res.clearCookie('session');
  res.json({ message: 'Logged out', session: null, user: null });
});

app.post('/login', async (req, res) => {
  let obj = req.body;
  for (let key in obj) {
    let parsedData = JSON.parse(key);
    // console.log(parsedData.email)
    let currentUser = await UserModel.findOne({
      email: parsedData.email,
      passwordHash: parsedData.passwordHash
    });
    if (currentUser) {
      currentUser.sessionID = req.cookies.session;
      req.user = currentUser;
      try {
        req.session.data = { userId: currentUser._id };
      } catch (error) {
        res.clearCookie('session');
        res.json('You need to create an account');
      }
      req.session.loggedIn = true;
      currentUser.save();
      req.session.save();
      res.json(req.session);
    } else {
      res.json('You need to create an account');
    }
  }

  // let User = await UserModel.find({_id : req.cookies.session});
});

app.post('/register', async (req, res) => {
  // first check if so current user doesnt exist

  let obj = req.body;
  for (let key in obj) {
    let parsedData = JSON.parse(key);
    // console.log(parsedData);
    let currentUser = await UserModel.findOne({
      email: parsedData.email,
      passwordHash: parsedData.passwordHash
    });
    if (!currentUser) {
      if (parsedData.email && parsedData.passwordHash) {
        UserModel.create(parsedData)
          .then((result) => {
            result.sessionID = req.cookies.session;
            req.session.data.userId = result._id;
            req.user = result;
            req.session.loggedIn = true;
            req.session.save();
            result.save();
            res.json(parsedData);
            // console.log(req.session);
          })
          .catch((error) => {
            if (error.errmsg.includes('duplicate')) {
              res.json('Needs to be a unique email!');
            } else {
              res.json(error.errmsg);
            }
          });
      } else {
        res.json('Missing field');
      }
    } else {
      res.json('User aldready exist. Please sign in');
    }
  }
});

app.listen(3000, () => {
  console.log('Listening on port 3000!');
});

/*
  Start a REPL if server was started with --inspect or --debug.
  Note that await in the REPL is only available in Node v10.0+.
*/
const nodeArgs = process.execArgv.join();
if (nodeArgs.includes('--inspect') || nodeArgs.includes('--debug')) {
  /* Show unhandled promise rejections */
  process.on('unhandledRejection', (error, p) => {
    console.log(
      'Unhandled rejection at: Promise: ',
      p,
      '\nReason: ',
      error.stack
    );
  });

  // Start read-eval-print loop
  const nodeRepl = require('repl');
  setTimeout(async () => {
    console.info('Starting REPL 🐍');
    const repl = nodeRepl.start({
      useColors: true,
      prompt: 'PiggyRide > ',
      input: process.stdin,
      output: process.stdout,
      useGlobal: true
    });
    let context = repl.context;
    Object.assign(context, {
      app: app,
      Waypoint: Waypoint,
      moment: require('moment'),
      order: order.model
    });
    // console.log(global === repl.context);
    repl.on('exit', function () {
      console.info('REPL closed');
    });
  }, 2500);
}
