export const extractJsonUrls = (jsonData) => {
  let urls = [];
  const traverse = (item) => {
    if (item.request && item.request.url && item.request.url.raw) {
      let url = item.request.url.raw;
      if (url.includes("?")) {
        url = url.split("?")[0];
      }
      const urlParts = url.split("/v1/");
      if (urlParts.length > 1) {
        urls.push(urlParts[1]);
      }
    }
    if (item.item) {
      item.item.forEach((subItem) => traverse(subItem));
    }
  };
  if (jsonData.item && Array.isArray(jsonData.item)) {
    jsonData.item.forEach((item) => traverse(item));
  }
  return urls;
};
