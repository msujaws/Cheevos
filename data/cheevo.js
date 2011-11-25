function populateTemplate(name, message, title, cheevoBlocks) {
  if (!document.getElementById("cheevo-h1"))
    return;
  document.getElementById("cheevo-h1").textContent = unescape(name);
  document.getElementById("cheevo-h2").textContent = unescape(title);
  document.getElementById("cheevo-message").textContent = unescape(message);
  document.getElementById("cheevo-blocks").innerHTML = unescape(cheevoBlocks);

  let shareClicked = false;
  let twitterLink = document.getElementById("twitterLink");
  document.getElementById("share").addEventListener("click", function () {
    if (!shareClicked) {
      shareClicked = true;
      this.insertAdjacentHTML('afterend', '<a href="https://twitter.com/share" class="twitter-share-button" data-url="https://www.mozilla.org" data-text="Cheevo for Firefox achieved!" data-count="none" data-via="firefox" data-related="weinjared:Author of Cheevos for Firefox">Tweet</a><script type="text/javascript" src="https://platform.twitter.com/widgets.js"></script>');
    }
  }, false);
}
