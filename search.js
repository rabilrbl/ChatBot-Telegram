import DOMParser from "dom-parser";

export async function bingSearch(query, page=1) {
  const response = await fetch(
    `https://www.bing.com/search?q=${query}&page=${page}&count=10`
  );
  const html = await response.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const results = doc.getElementsByClassName("b_algo");
  const links = results.map((result) => {
    const link = result.getElementsByTagName("a")[0];
    let description = "";
    result.getElementsByTagName("p").forEach((p) => {
        const text = p.textContent;
        if (text.slice(0, 2) === "Web") {
            text = text.slice(2);
        }
      description += `${text}\n`;
    });
    result.getElementsByTagName("li").forEach((li) => {
      description += `${li.textContent}\n`;
    });
    description = description.slice(0, 400);
    return {
      title: link.textContent,
      url: link.getAttribute("href"),
      description: description,
    };
  });

  //   Remove duplicates
  const seen = new Set();
  const filteredLinks = links.filter((link) => {
    const duplicate = seen.has(link.url);
    seen.add(link.url);
    return !duplicate;
  });

  return filteredLinks;
}
