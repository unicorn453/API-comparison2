// Function to parse headers from the string
const parseHeaders = (headerString) => {
  // Implement parsing logic here
  // This function should return an object containing parsed headers
};

// Function to parse query parameters or path parameters from the string
const parseParameters = (parameterString) => {
  // Implement parsing logic here
  // This function should return an object containing parsed parameters
};
export const parseBodyContent = (lines, startIndex) => {
  const bodyContent = {};
  let contentType;

  // Regular expression pattern to match lines starting with "Content-Type:"
  const contentTypePattern = /^Content-Type:\s*(.+)/;

  // Iterate over each line starting from the provided index
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim(); // Trim the line to remove leading and trailing spaces
    const match = line.match(contentTypePattern); // Check if the line matches the pattern
    if (match) {
      contentType = match[1]?.trim(); // Extract the content type from the matched line

      // Initialize object for the content type if it doesn't exist
      if (!bodyContent[contentType]) {
        bodyContent[contentType] = {};
      }

      // Start parsing body content details from the next line
      let j = i + 1;
      while (j < lines.length && lines[j].startsWith("    ")) {
        const detailLine = lines[j].trim(); // Trim the detail line
        const keyValue = detailLine.split(":");
        if (keyValue.length === 2) {
          // Check if line contains key-value pair
          const key = keyValue[0]?.trim(); // Use optional chaining to avoid TypeError
          const value = keyValue[1]?.trim(); // Use optional chaining to avoid TypeError
          bodyContent[contentType][key] = value;
        }
        j++;
      }

      // Update the outer loop index
      i = j - 1;
    }
  }

  // Extract the keys from the bodyContent object
  const keys = Object.keys(bodyContent).flatMap((contentType) =>
    Object.keys(bodyContent[contentType]).map((key) => `${contentType}[${key}]`)
  );

  console.log("Keys:", keys);

  return keys;
};
