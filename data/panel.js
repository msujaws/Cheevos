function populateTemplate(name, description, points, award, medal, styleCss) {
  document.getElementsByTagName("h1")[0].textContent = unescape(name);
  document.getElementsByTagName("h2")[0].textContent = unescape(description);
  document.getElementById("logo").classList.add(unescape(award));
  document.getElementById("points").textContent = unescape(points);
  document.getElementById("medals").classList.add(unescape(medal));
  document.getElementById("style").href = unescape(styleCss);
}
