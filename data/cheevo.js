function populateTemplate(tweetText, stats, cheevoBlocks, styleCss) {
  if (!document.getElementById("cheevo-h1"))
    return;
  document.getElementById("cheevo-h1").textContent = "Cheevos for Firefox";
  document.getElementById("cheevo-h2").textContent = "Use Firefox, gain achievements.";
  document.getElementById("cheevo-message").textContent = unescape(stats);
  document.getElementById("cheevo-blocks").innerHTML = unescape(cheevoBlocks);
  document.getElementById("cheevo-stylesheet").href = unescape(styleCss);
  document.getElementById("twitterLink").setAttribute("data-text", unescape(tweetText));
  document.getElementById("twitterScript").src = 'https://platform.twitter.com/widgets.js';
}
