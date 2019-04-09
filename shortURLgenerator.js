function generateRandomString() {
  let shortURL = '';
  const possiblities = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0 ; i < 6 ; i ++){
    shortURL += possiblities.charAt(Math.floor(Math.random() * possiblities.length));
  }

  return shortURL;
}

module.exports = generateRandomString;
