const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const shortURLgenerator = require("./shortURLgenerator");

// Setting up view engine to ejs
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {

};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) =>  {
  let templateVars = {
    user: users[req.cookies['user_id']]
  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies['user_id']]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  const randomURL = shortURLgenerator();
  const longURL = req.body.longURL;

  urlDatabase[randomURL] = longURL;
  res.redirect(`/urls/${randomURL}`);
});


app.post("/urls/:shortURL/delete", (req,res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  const id = req.params.id;
  const newURL = req.body.longURL;
  urlDatabase[id] = newURL;
  res.redirect("/urls");
});

function findUserId(email){
  for(let key in users){
    if(users[key].userEmail === email){
      return key;
    }
  }
}

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
      res.cookie('user_id', user_id);
      res.redirect("/urls");
  } else{
    res.send("Sorry the user is not found");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const userID = shortURLgenerator();

  const userInfo = {
    "userID": userID,
    "userEmail": req.body.email,
    "userPassword": req.body.password
  }

  if(userInfo["userEmail"] == '' || userInfo["userPassword"] == ''){
    res.status(400).send("Status Code 400: Please enter email and password correctly.");
  }

  if(emailLookUp(req.body.email)){
    res.send("This Email address already exists. Please try again with different Email address.");
  }

  users[userID] = userInfo;
  console.log(users);
  res.cookie("user_id", userID);
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
      if(users[key].userPassword === password) {
        return true;
      }
    }
  } return false;
}


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

