function populateTemplate(name, description, title, cheevoBlocks) {
  if (!document.getElementById("cheevo-h1"))
    return;
  document.getElementById("cheevo-h1").textContent = unescape(name);
  let titleEl = document.getElementById("cheevo-h2");
  if (title)
    titleEl.textContent = unescape(title);
  else
    titleEl.parentNode.removeChild(titleEl);
  document.getElementById("cheevo-message").textContent = unescape(description);
  document.getElementById("cheevo-blocks").innerHTML = unescape(cheevoBlocks);
  let twitterLink = document.getElementById("twitterLink");
  twitterLink.setAttribute("data-text", twitterLink.getAttribute("data-text").replace("#1", unescape(name)));
  document.getElementById("twitterScript").src = 'https://platform.twitter.com/widgets.js';
}
