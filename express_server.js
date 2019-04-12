const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const shortURLgenerator = require("./shortURLgenerator");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
// const cookieParser = require('cookie-parser')

// Setting up view engine to ejs
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  secret: "test"
}));
// app.use(cookieParser());

const password = "purple-monkey-dinosaur";
const hashedPassword = bcrypt.hashSync(password, 10);

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48W" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {
  'aJ48W':
   { userID: 'aJ48W',
     userEmail: 'dongyunrhee@gmail.com',
     userPassword: '123' }
};

app.get("/", (req, res) => {
  if(req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const URLs = urlsForUser(userID);

  let templateVars = {
    urls: URLs,
    user: users[userID]
  };

  if(userID){
    res.render("urls_index", templateVars);
    res.redirect("/urls");
  } else {
    res.render("registration", templateVars);
  }
});


app.get("/urls/new", (req, res) =>  {
  let templateVars = {
    user: users[req.session.user_id]
  };
  if(!req.session.user_id){
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.get("/urls/:shortURL", (req, res) => {
  const foundURL = urlDatabase[req.params.shortURL];

  if(!req.session.user_id){
    res.render("registration");
    return;
  }
  if(!foundURL) {
    res.render("ErrorMessage");
    return;
  }

  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: foundURL.longURL,
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;

  if(longURL.includes('https://')){
    res.redirect(longURL);
  } else {
    res.render("ErrorMessage");
  }

});

app.post("/urls", (req, res) => {
  const randomURL = shortURLgenerator();
  const longURL = req.body.longURL;
  urlDatabase[randomURL] = {longURL: longURL, userID: req.session.user_id};

  console.log(urlDatabase);

  // urlDatabase[randomURL] = longURL;
  res.redirect(`/urls/${randomURL}`);
});


app.post("/urls/:shortURL/delete", (req,res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;

  if(userID){
      if(checkingUserID(userID, shortURL)){
        delete urlDatabase[shortURL];
        res.redirect('/urls');
    } else {
        res.send("Nice try 🤟");
    }
  } else {
      res.send("Nice try 🤟");
  }

  const foundURL = urlDatabase[shortURL];

  if(!req.session.user_id){
    res.render("registration");
    return;
  }
  if(!foundURL) {
    res.render("ErrorMessage");
    return;
  }
});

app.post("/urls/:id/update", (req, res) => {
  const id = req.params.id;
  const newURL = req.body.longURL;
  if (newURL) {
    urlDatabase[id] = {longURL: newURL, userID: urlDatabase[id].userID};
    //
  }
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;


  if(!emailLookUp(email)){
    res.status(403).send("Status Code 403: Your Email address does not match! Please try again.");
  }

  if(!comparePassword(password, email)){
      res.status(403).send("Status Code 403: Your password does not match! Please try again.");
  }

  let user_id = findUserId(email);
  if(user_id){
      req.session.user_id = user_id;
      res.redirect("/urls");
  } else{
    res.send("Sorry the user is not found");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('session');
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const userID = shortURLgenerator();

  const userInfo = {
    "userID": userID,
    "userEmail": req.body.email,
    "userPassword": bcrypt.hashSync(req.body.password, 10)
  }

  if(userInfo["userEmail"] == '' || userInfo["userPassword"] == ''){
    res.render("NoInputErrorMessage");
    // res.status(400).send("Status Code 400: Please enter email and password correctly.");
  }

  if(emailLookUp(req.body.email)){
    res.render("EmailError");
    // res.send("This Email address already exists. Please try again with different Email address.");
  }

  users[userID] = userInfo;
  req.session.user_id = userInfo.userID;
  res.redirect("/urls");
});

//Function for checking if user entered email already exists or not.
function emailLookUp (email) {
  for (key in users) {
    if(users[key].userEmail === email) {
      return true;
    }
  } return false;
}

//Function for checking if user password is correct or not.
function comparePassword (password, email) {
  for (key in users) {
    if(emailLookUp(email)){
       if(bcrypt.compareSync(password, users[key].userPassword)) {
        return true;
      }
    }
  }
  return false;
}

//Checking if the user is logged in and assignin new values.
function urlsForUser(id) {
let newURLs = {};
  for(let key in urlDatabase){
    if (urlDatabase[key].userID === id){
    newURLs[key] = urlDatabase[key];
    }
  }
  return newURLs;
}

//Finding userID (key) at certain email address.
function findUserId(email) {
  for(let key in users){
    if(users[key].userEmail === email){
      return key;
    }
  }
}

function checkingUserID(id, shortURL) {
    return (urlDatabase[shortURL].userID === id);
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

