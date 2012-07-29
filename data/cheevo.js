function populateTemplate(tweetText, stats, cheevoBlocks, styleCss, cheevosFullName, cheevosTagLine) {
  if (!document.getElementById("cheevo-h1"))
    return;
  document.getElementById("cheevo-h1").textContent = unescape(cheevosFullName);
  document.getElementById("cheevo-h2").textContent = unescape(cheevosTagLine);
  document.getElementById("cheevo-message").textContent = unescape(stats);
  document.getElementById("cheevo-blocks").innerHTML = unescape(cheevoBlocks);
  document.getElementById("cheevo-stylesheet").href = unescape(styleCss);
  document.getElementById("twitterLink").setAttribute("data-text", unescape(tweetText));
  document.getElementById("twitterScript").src = 'https://platform.twitter.com/widgets.js';
}
