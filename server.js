if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
};

const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const path = require('path')
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const PORT = 1984;

const initializePassport = require('./passport-config')
initializePassport(
    passport,
    email => {return users.find(user => user.email === email),
        id => users.find(user => user.id === id)
})



let db,
    dbConnectionStr = 'mongodb+srv://garrett:b9XXT5qpAFNM6gA@cluster0.dv3rc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
    dbName = 'burritoDb';


MongoClient.connect(dbConnectionStr, { useUnifiedTopology: true })
    .then(client => {
        console.log(`Hola, estamos conectados a ${dbName}.`);
        db = client.db(dbName);
    })
    .catch(err => {
        console.log(err);
    });


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static('public'));
app.use(express.urlencoded( { extended: true }));
app.use(express.json());
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize())
app.use(passport.session())

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login');
}); 

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/signup', checkNotAuthenticated, (req, res) => {
    res.render('signup');
})

app.post('/signup', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        db.collection('users').insertOne({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });
    } catch {
        res.redirect('/signup');
    }
    console.log(users);
});

app.get('/profile', checkAuthenticated, (req, res) => {
    db.collection('burritos').find().toArray()
    .then(data => {
        res.render('profile', { burritoArray: data });
    })
})

app.get('/feed', checkAuthenticated, (req, res) => {
    db.collection('burritos').find().toArray()
    .then(data => {
        res.render('feed', { burritoArray: data });
    })
    
});

app.get('/posts', checkAuthenticated, (req, res) => {
    res.render('posts');
});

app.post('/createPost', checkAuthenticated, (req, res) => {
    console.log(req.body);
    db.collection('burritos').insertOne({ burrito: req.body, likes: 0 })
    .then(result => {
        console.log(`Burrito added to db! (${burrito}`)
    })
    res.redirect('/posts')
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}

app.listen(PORT, () => {
    console.log(`Escuchando a PORT: ${PORT}.  Vámanos pues.`);
});