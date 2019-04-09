const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

// Setting up view engine to ejs
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", function(req, res){
  let templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", function(req, res) {
  res.render("urls_new");
});

app.get("/urls/:shortURL", function(req, res){
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", function(req, res){
  console.log(req.body.longURL);
  res.send("ok");
});

function generateRandomString() {
  let shortURL = '';
  const possiblities = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0 ; i < 6 ; i ++){
    shortURL += possiblities.chartAt(Math.floor(Math.random() * possiblities.length);
  }

  return shortURL;
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

