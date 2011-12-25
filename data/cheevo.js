function populateTemplate(name, description, title, cheevoBlocks, styleCss) {
  if (!document.getElementById("cheevo-h1"))
    return;
  document.getElementById("cheevo-h1").textContent = "Cheevos for Firefox";
  let titleEl = document.getElementById("cheevo-h2");
  if (title)
    titleEl.textContent = unescape(title);
  else if (titleEl)
    titleEl.parentNode.removeChild(titleEl);
  document.getElementById("cheevo-message").textContent = unescape(description);
  document.getElementById("cheevo-blocks").innerHTML = unescape(cheevoBlocks);
  document.getElementById("cheevo-stylesheet").href = unescape(styleCss);
  let twitterLink = document.getElementById("twitterLink");
  twitterLink.setAttribute("data-text", unescape(name));
  document.getElementById("twitterScript").src = 'https://platform.twitter.com/widgets.js';
}
