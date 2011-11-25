function populateTemplate(name, message, title, cheevoList, cheevoBlocks) {
  if (!document.getElementById("cheevo-h1"))
    return;
  document.getElementById("cheevo-h1").textContent = unescape(name);
  document.getElementById("cheevo-h2").textContent = unescape(title);
  document.getElementById("cheevo-message").textContent = unescape(message);
  document.getElementById("cheevo-wrapper").innerHTML = unescape(cheevoList);
  document.getElementById("cheevo-blocks").innerHTML = unescape(cheevoBlocks);
}
