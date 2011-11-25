function populateTemplate(name, message, title, cheevoList) {
  if (!document.getElementById("cheevo-h1"))
    return;
  document.getElementById("cheevo-h1").textContent = unescape(name);
  document.getElementById("cheevo-h2").textContent = unescape(title);
  document.getElementById("cheevo-message").textContent = unescape(message);
  document.getElementById("cheevo-ul").innerHTML = unescape(cheevoList);
}
