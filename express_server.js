const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const shortURLgenerator = require("./shortURLgenerator");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
// const cookieParser = require('cookie-parser')

// Setting up view engine to ejs
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieSession({
  name: "session",
  secret: "test"
}));

const password = "purple-monkey-dinosaur";
const hashedPassword = bcrypt.hashSync(password, 10);

//Database object for testing/checking/adding in new data
const urlDatabase = {

};

//Object database for testing cases for userID, Email and password
const users = {

};

//Home page that redirects users to urls page when logged in and to login page when not logged in.
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//Url page that when users are logged in direct them to same url page. When not logged in, redirect to registration page.
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const URLs = urlsForUser(userID);

  let templateVars = {
    urls: URLs,
    user: users[userID]
  };

  if (userID) {
    res.render("urls_index", templateVars);
    res.redirect("/urls");
  } else {
    res.render("registration", templateVars);
  }
});

//Creating new URLs page. If users are not logged in, redirect them to login page
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };

  if (!req.session.user_id) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

//Registration page where users can register with their Email address.
app.get("/register", (req, res) => {
  res.render("urls_register");
});

//Login page where users can log in with their Email address.
app.get("/login", (req, res) => {
  res.render("urls_login");
});

//Page after new URL creation where users can see their shortened URL with original URL. Users get to update their original URL with update button.
//When users are not logged in, they are redirected to the registration page. If logged in but when the shortened URL does not belong to them or the
//URL is not found, error message pops up
app.get("/urls/:shortURL", (req, res) => {
  const foundURL = urlDatabase[req.params.shortURL];

  if (!req.session.user_id) {
    res.render("registration");
  } else {
    if (!foundURL) {
      res.render("ErrorMessage");
      return;
    }

    if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
      res.render("ErrorMessage");
    } else {

      let templateVars = {
        shortURL: req.params.shortURL,
        longURL: foundURL.longURL,
        user: users[req.session.user_id]
      };

      res.render("urls_show", templateVars);
    }
  }
});

//When users input endpoint of /u/shortendedURL, they are redirected to the original website. If the original URL is invalid, error message pops up.
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;

  if (longURL.includes('https://') || (longURL.includes('http://'))) {
    res.redirect(longURL);
  } else {
    res.render("ErrorMessage");
  }

});

//Creating new randomized short URL for the users. Creating/posting new user database with certain shortened URL, users input URL and their user ID into the database.
app.post("/urls", (req, res) => {
  const randomURL = shortURLgenerator();
  const longURL = req.body.longURL;
  urlDatabase[randomURL] = {
    longURL: longURL,
    userID: req.session.user_id
  };

  // urlDatabase[randomURL] = longURL;
  res.redirect(`/urls/${randomURL}`);
});

//When users click delete button, shortURL and the long URL are being deleted. If users are logged in and their user ID and password match, users are able to delete and redirected to URL page.
//When users are not logged in and try to delete certain URLs, they are redirected to error message page.
//When users are not logged in, they are redirected to registration page and when then shortened URL is not found, error message pops up.
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;

  if (userID) {
    if (checkingUserID(userID, shortURL)) {
      delete urlDatabase[shortURL];
      res.redirect('/urls');
    } else {
      res.send("Nice try 🤟");
    }
  } else {
    res.send("Nice try 🤟");
  }

  const foundURL = urlDatabase[shortURL];

  if (!req.session.user_id) {
    res.render("registration");
    return;
  }
  if (!foundURL) {
    res.render("ErrorMessage");
    return;
  }
});

//When users click update button, users are able to update/edit the long URL they entered. If users do not wish to edit the URL, they can just click update button.
//After updating the URL, users are redirected to URL page.
app.post("/urls/:id/update", (req, res) => {
  const id = req.params.id;
  const newURL = req.body.longURL;
  if (newURL) {
    urlDatabase[id] = {
      longURL: newURL,
      userID: urlDatabase[id].userID
    };

  }
  res.redirect("/urls");
});

//Users are redirected to login page. If users enter Email address / password  that does not match with the database, error messages pop up.
//If entered Email address and password match with the database, users are redirected to the URL page.
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;


  if (!emailLookUp(email)) {
    res.status(403).send("Status Code 403: Your Email address does not match! Please try again.");
  }

  if (!comparePassword(password, email)) {
    res.status(403).send("Status Code 403: Your password does not match! Please try again.");
  }

  let user_id = findUserId(email);
  if (user_id) {
    req.session.user_id = user_id;
    res.redirect("/urls");
  } else {
    res.send("Sorry the user is not found");
  }
});

//After logging in, if users click logout button, they are logged out and redirected to URL page. When logged out, users cookie information is cleared.
//When users are not logged in and try to access URL page, "registration/login required" message pops up.
app.post("/logout", (req, res) => {
  res.clearCookie('session');
  res.redirect("/urls");
});

//After entering new Email address and passwored, users are able to register by clicking register button.
//If users do not enter any data in Email/password section, error message pops up.
//If users enter Email address and password that do not match with the database, error message pop up.
//If users enter Email address that already exists, error message pops up.
app.post("/register", (req, res) => {
  const userID = shortURLgenerator();

  const userInfo = {
    "userID": userID,
    "userEmail": req.body.email,
    "userPassword": bcrypt.hashSync(req.body.password, 10)
  }

  if (userInfo["userEmail"] == '' || userInfo["userPassword"] == '') {
    res.render("NoInputErrorMessage");
    // res.status(400).send("Status Code 400: Please enter email and password correctly.");
  }

  if (emailLookUp(req.body.email)) {
    res.render("EmailError");
    // res.send("This Email address already exists. Please try again with different Email address.");
  }

  users[userID] = userInfo;
  req.session.user_id = userInfo.userID;
  res.redirect("/urls");
});

//Function for checking if user entered email already exists or not.
function emailLookUp(email) {
  for (key in users) {
    if (users[key].userEmail === email) {
      return true;
    }
  }
  return false;
}

//Function for checking if user password is correct or not.
function comparePassword(password, email) {
  for (key in users) {
    if (emailLookUp(email)) {
      if (bcrypt.compareSync(password, users[key].userPassword)) {
        return true;
      }
    }
  }
  return false;
}

//Checking if the user is logged in and assigning new values.
function urlsForUser(id) {
  let newURLs = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      newURLs[key] = urlDatabase[key];
    }
  }
  return newURLs;
}

//Finding userID (key) at certain email address.
function findUserId(email) {
  for (let key in users) {
    if (users[key].userEmail === email) {
      return key;
    }
  }
}

//Checking if userID with certain shortURL matches with logged in ID
function checkingUserID(id, shortURL) {
  return (urlDatabase[shortURL].userID === id);
}

//Checking if the server is running and listening to port 8080.
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
