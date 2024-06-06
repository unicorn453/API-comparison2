// export const extractJsonBody = (jsonData) => {
//   let mode = [];
//   let key = [];
//   let value = [];
//   let description = [];
//   let disabled = [];
//   const traverse = (item) => {
//     if (
//       item.request &&
//       item.request.body &&
//       item.request.body.urlencoded &&
//       item.request.body.mode
//     ) {
//       let key = item.request.body.urlencoded.key;
//       let value = item.request.body.urlencoded.value;
//       let description = item.request.body.urlencoded.description;
//       let disabled = item.request.body.urlencoded.disabled;
//       let mode = item.request.body.mode;
//     }
//     if (item.item) {
//       item.item.forEach((subItem) => traverse(subItem));
//     }
//   };
//   if (jsonData.item && Array.isArray(jsonData.item)) {
//     jsonData.item.forEach((item) => traverse(item));
//   }
//   return key, value, description, disabled, mode;
// };
export const extractJsonBody = (jsonData, targetUrl) => {
  let result = null;

  const traverse = (item) => {
    if (item.request && item.request.url && item.request.url.raw) {
      let url = item.request.url.raw;
      if (url.includes("?")) {
        url = url.split("?")[0];
      }
      const urlParts = url.split("/v1/");
      if (urlParts.length > 1 && urlParts[1] === targetUrl) {
        // Found the matching URL, extract the body content
        if (item.request.body && item.request.body.urlencoded) {
          result = {
            mode: item.request.body.mode,
            body: item.request.body.urlencoded.map((field) => ({
              key: field.key,
              value: field.value,
              description: field.description,
              disabled: field.disabled,
            })),
          };
        }
      }
    }
    if (item.item) {
      item.item.forEach((subItem) => traverse(subItem));
    }
  };

  if (jsonData.item && Array.isArray(jsonData.item)) {
    jsonData.item.forEach((item) => traverse(item));
  }

  return result;
};
