function populateTemplate(name, message, title, cheevoBlocks) {
  if (!document.getElementById("cheevo-h1"))
    return;
  document.getElementById("cheevo-h1").textContent = unescape(name);
  document.getElementById("cheevo-h2").textContent = unescape(title);
  document.getElementById("cheevo-message").textContent = unescape(message);
  document.getElementById("cheevo-blocks").innerHTML = unescape(cheevoBlocks);
  let twitterLink = document.getElementById("twitterLink");
  twitterLink.setAttribute("data-text", twitterLink.getAttribute("data-text").replace("#1", unescape(name)));
  document.getElementById("twitterScript").src = 'https://platform.twitter.com/widgets.js';
}
