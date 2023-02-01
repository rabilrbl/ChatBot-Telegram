import DOMParser from "dom-parser";
import google from "googlethis";

export const googleSearch = async (query, page = 0) => {
  const options = {
    page,
    safe: false, // Safe Search
    parse_ads: false, // If set to true sponsored results will be parsed
    additional_params: {
      // add additional parameters here, see https://moz.com/blog/the-ultimate-guide-to-the-google-search-parameters and https://www.seoquake.com/blog/google-search-param/
      hl: "en",
    },
  };
  const response = await google.search(query, options);
  return response;
};

export const googleImages = async (query) => {
  const images = await google.image(query, { safe: false });
  return images.slice(0, 5);
};

export const googleSearchResults = async (query, page = 0) => {
  const response = await googleSearch(query, page);
  let links = [];
  response.knowledge_panel &&
    response.knowledge_panel.title &&
    links.push({
      title: response.knowledge_panel.title,
      url: response.knowledge_panel.url,
      description: response.knowledge_panel.description,
    });
  response.results.forEach((result) => {
    links.push({
      title: result.title,
      url: result.url,
      description: result.description,
    });
  });
  return links;
};

export const googleTranslate = async (word, lang) => {
  const response = await googleSearch(`translate ${word} to ${lang}`);
  return response.translation;
};

export const googleDictionary = async (word) => {
  const response = await googleSearch(`define ${word}`);
  return response.dictionary;
};

export const googleWeather = async (place) => {
  const response = await googleSearch(`Weather in ${place}`);
  return response.weather;
};

export async function bingSearch(query, page = 1) {
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
