import React, { useState, useEffect } from "react";
import { readExcelFile } from "./utils/readExcelFile";
import { readJsonFile } from "./utils/readJsonFile";
import { extractJsonUrls } from "./utils/extractJsonUrls";
import { findMissingEndpoints } from "./utils/findMissingEndpoints";
import HeadBodyModal from "./utils/headBodyModal";
import { extractExcelBody } from "./utils/extractExcelBody";
import { extractJsonBody } from "./utils/extractJsonBody";
import { parseBodyContent } from "./utils/extractExcelBody";
import "./App.css";

const App = () => {
  const [excelFile, setExcelFile] = useState(null);
  const [jsonFile, setJsonFile] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [filteredEndpoints, setFilteredEndpoints] = useState([]);
  const [filter, setFilter] = useState("all");
  const [totalEndpoints, setTotalEndpoints] = useState(0);
  const [matchRate, setMatchRate] = useState(0);
  const [missingCount, setMissingCount] = useState(0);
  const [filesProcessed, setFilesProcessed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [endpointsPerPage, setEndpointsPerPage] = useState(20);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const pageSizeOptions = [20, 50, 100, "All"];
  const [modalVisible, setModalVisible] = useState(false);
  const [comparisonResult, setComparisonResult] = useState("");

  const boldEndpoint = (url) => {
    if (url) {
      const parts = url.split("/v1/");
      if (parts.length > 1) {
        return (
          <span>
            {parts[0]}/v1/<strong>{parts[1]}</strong>
          </span>
        );
      }
      return url;
    }
    return null; // Return null if url is null or undefined
  };

  useEffect(() => {
    const calculateStats = () => {
      setTotalEndpoints(endpoints.length);
      const matchingEndpoints = endpoints.filter(
        (endpoint) => endpoint.existsInJson
      );
      setMatchRate((matchingEndpoints.length / endpoints.length) * 100);
      setMissingCount(endpoints.length - matchingEndpoints.length);
    };

    calculateStats();
  }, [endpoints]);

  const handleExcelFileChange = (event) => {
    setExcelFile(event.target.files[0]);
  };

  const handleJsonFileChange = (event) => {
    setJsonFile(event.target.files[0]);
  };

  const handleProcessFiles = async () => {
    if (!excelFile || !jsonFile) {
      alert("Please upload both Excel and JSON files.");
      return;
    }

    try {
      const [excelData, jsonData] = await Promise.all([
        readExcelFile(excelFile),
        readJsonFile(jsonFile),
      ]);

      const jsonUrls = extractJsonUrls(jsonData);

      const excelEndpoints = excelData.slice(1).map((row) => ({
        url: row[3] ? row[3].split("?")[0] : null,
        existsInJson: jsonUrls.includes(
          row[3] ? row[3].split("?")[0].split("/v1/")[1] : null
        ),
        rationale: jsonUrls.includes(
          row[3] ? row[3].split("?")[0].split("/v1/")[1] : null
        )
          ? "Exists in both"
          : "Missing in JSON",
      }));

      const combinedEndpoints = excelEndpoints.concat(
        jsonUrls
          .filter(
            (url) =>
              !excelEndpoints.some((ep) => ep.url && ep.url.includes(url))
          )
          .map((url) => ({
            url: `https://api.stripe.com/v1/${url}`,
            existsInJson: true,
            rationale: "Exists only in JSON",
          }))
      );

      setEndpoints(combinedEndpoints);
      setFilteredEndpoints(combinedEndpoints);
      setFilesProcessed(true);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (newFilter === "all") {
      setFilteredEndpoints(endpoints);
    } else if (newFilter === "matching") {
      setFilteredEndpoints(
        endpoints.filter((endpoint) => endpoint.existsInJson)
      );
    } else if (newFilter === "not-matching") {
      setFilteredEndpoints(
        endpoints.filter((endpoint) => !endpoint.existsInJson)
      );
    }
    setCurrentPage(1); // Reset to first page whenever filter changes
  };

  const handleEndpointsPerPageChange = (e) => {
    const value =
      e.target.value === "All"
        ? endpoints.length
        : parseInt(e.target.value, 10);
    setEndpointsPerPage(value);
    setCurrentPage(1); // Reset to first page whenever page size changes
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const indexOfLastEndpoint = currentPage * endpointsPerPage;
  const indexOfFirstEndpoint = indexOfLastEndpoint - endpointsPerPage;
  const currentEndpoints = filteredEndpoints.slice(
    indexOfFirstEndpoint,
    indexOfLastEndpoint
  );

  const handleEndpointClick = async (endpoint) => {
    setSelectedEndpoint(endpoint);
    const comparison = await performHeadBodyComparison(endpoint);
    setComparisonResult(comparison);
    setModalVisible(true);
  };
  const performHeadBodyComparison = async (endpoint) => {
    try {
      const jsonData = await readJsonFile(jsonFile);
      const excelData = await readExcelFile(excelFile);

      const targetUrl = endpoint.url.split("/v1/")[1].split("?")[0];
      const jsonBodyData = extractJsonBody(jsonData, targetUrl);

      let excelBodyContentKeys = [];

      // Parse Excel data to extract body content
      excelData.forEach((row) => {
        const apiDocumentation = row[5];
        if (apiDocumentation) {
          const documentationLines = apiDocumentation.split("\n");
          console.log("Documentation Lines:", documentationLines);
          documentationLines.forEach((line, index) => {
            // Use the index parameter of forEach
            if (line.startsWith("Body Content:")) {
              // If "Body Content:" is found, start parsing content
              console.log("Start Index:", index + 1);
              const bodyContentKeys = parseBodyContent(
                documentationLines,
                index + 1 // Increment index by 1 to start
              );
              console.log("Excel Body Content Keys:", bodyContentKeys);

              // Merge the parsed keys into the overall list of keys
              excelBodyContentKeys =
                excelBodyContentKeys.concat(bodyContentKeys);
            }
          });
        }
      });

      // Extract the keys from the JSON body data
      const jsonKeys = jsonBodyData?.body?.map((item) => item.key) || [];

      // Compare the keys from the Excel data with the JSON keys
      const matchedKeys = excelBodyContentKeys.filter((excelKey) =>
        jsonKeys.includes(excelKey)
      );

      // Prepare the comparison result object
      const comparisonResult = {
        jsonKeys,
        excelKeys: excelBodyContentKeys,
        matchedKeys,
        matchCount: matchedKeys.length,
      };

      console.log("Comparison Result:", comparisonResult);

      // Return the comparison result
      return JSON.stringify(comparisonResult, null, 2);
    } catch (error) {
      console.error("Comparison Error:", error);
      return "An error occurred during comparison.";
    }
  };

  // const performHeadBodyComparison = async (endpoint) => {
  //   try {
  //     const jsonData = await readJsonFile(jsonFile);
  //     const excelData = await readExcelFile(excelFile);

  //     const targeUrl = endpoint.url.split("/v1/")[1];
  //     const targetUrl = targeUrl.split("?")[0];
  //     const jsonBodyData = extractJsonBody(jsonData, targetUrl);

  //     let excelBodyContent = {}; // Initialize Excel body content object
  //     let jsonBodyContent = {}; // Initialize JSON body content object

  //     excelData.forEach((row) => {
  //       const apiDocumentation = row[5];
  //       if (apiDocumentation) {
  //         const documentationLines = apiDocumentation.split("\n");
  //         console.log("Documentation Lines:", documentationLines);
  //         documentationLines.forEach((line, index) => {
  //           // Use the index parameter of forEach
  //           if (line.startsWith("Body Content:")) {
  //             // If "Body Content:" is found, start parsing content
  //             console.log("Start Index:", index + 1);
  //             excelBodyContent = parseBodyContent(
  //               documentationLines,
  //               index + 1 // Increment index by 1 to start parsing from the next line
  //             );

  //             console.log("Excel Body Content:", excelBodyContent);
  //           }
  //         });
  //       }
  //     });

  //     // Extract the key and value from the JSON body
  //     const jsonKey = jsonBodyData?.body?.[0]?.key;
  //     const jsonValue = jsonBodyData?.body?.[0]?.value;

  //     // Extract relevant keys from the Excel body content
  //     const excelAmountKey = excelBodyContent?.bodyContent?.amount?.type;
  //     const excelExpandKey = excelBodyContent?.bodyContent?.expand?.type;

  //     // Compare JSON key with Excel keys
  //     const match = jsonKey === excelAmountKey && jsonKey === excelExpandKey;
  //     const matchedKeys = match ? 1 : 0;

  //     // Prepare the comparison result object
  //     const comparisonResult = {
  //       jsonKey,
  //       jsonValue,
  //       excelAmountKey,
  //       excelExpandKey,
  //       match,
  //       matchedKeys,
  //     };

  //     // console.log("Comparison Result:", comparisonResult); // Log the comparison result

  //     // Return the comparison result
  //     return JSON.stringify(comparisonResult, null, 2);
  //   } catch (error) {
  //     console.error("Comparison Error:", error);
  //     return "An error occurred during comparison.";
  //   }
  // };

  return (
    <div className="container-fluid mt-5">
      <div className="row mb-3">
        <div className="col-sm-12 mb-3 w-75 mx-auto">
          <div className="file-input-container">
            <label htmlFor="excel-file" className="form-label">
              Upload Excel File:
            </label>
            <input
              type="file"
              id="excel-file"
              onChange={handleExcelFileChange}
              className="form-control"
              accept=".xlsx, .xls"
            />
          </div>
        </div>
        <div className="col-sm-12 w-75 mx-auto">
          <div className="file-input-container">
            <label htmlFor="json-file" className="form-label">
              Upload JSON File:
            </label>
            <input
              type="file"
              id="json-file"
              onChange={handleJsonFileChange}
              className="form-control"
              accept=".json"
            />
          </div>
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-12 col-md-2 mb-5 mx-auto">
          <button
            onClick={handleProcessFiles}
            className="btn btn-primary w-100"
          >
            Process Files
          </button>
        </div>
      </div>

      {filesProcessed && (
        <div>
          <div className="row mb-3">
            <div className="col-12 col-md-9 mb-3 mx-auto">
              <div className="stats text-center">
                <p className="mb-0">Total Endpoints: {totalEndpoints}</p>
                {missingCount > 0 && (
                  <p className="mb-0">Missing Endpoints: {missingCount}</p>
                )}
                <p className="mb-0">
                  Match Rate:{" "}
                  {isNaN(matchRate) ? "0.00%" : matchRate.toFixed(2)}%
                </p>
              </div>
            </div>
            <div className="col-12 col-md-9 mb-3 mx-auto">
              <div className="filter-dropdown">
                <label htmlFor="filter" className="form-label">
                  Filter Results:
                </label>
                <select
                  id="filter"
                  value={filter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="form-select"
                >
                  <option value="all">All Endpoints</option>
                  <option value="matching">Matching Endpoints</option>
                  <option value="not-matching">Non-Matching Endpoints</option>
                </select>
              </div>
            </div>
            <div className="col-12 col-md-9 mb-3 mx-auto">
              <div className="page-size-dropdown">
                <label htmlFor="page-size" className="form-label">
                  Results Per Page:
                </label>
                <select
                  id="page-size"
                  value={
                    endpointsPerPage === endpoints.length
                      ? endpoints.length
                      : endpointsPerPage
                  }
                  onChange={handleEndpointsPerPageChange}
                  className="form-select"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-12">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Endpoint URL</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEndpoints.map((endpoint, index) => (
                    <tr
                      key={index}
                      onClick={() => handleEndpointClick(endpoint)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{boldEndpoint(endpoint.url)}</td>
                      <td>{endpoint.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <nav>
                <ul className="pagination justify-content-center">
                  {Array.from(
                    {
                      length: Math.ceil(
                        filteredEndpoints.length / endpointsPerPage
                      ),
                    },
                    (_, index) => (
                      <li
                        key={index}
                        className={`page-item ${
                          currentPage === index + 1 ? "active" : ""
                        }`}
                      >
                        <a
                          className="page-link"
                          onClick={() => paginate(index + 1)}
                          href="#!"
                        >
                          {index + 1}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      )}

      {modalVisible && (
        <HeadBodyModal
          show={modalVisible}
          onHide={() => setModalVisible(false)}
          endpoint={selectedEndpoint}
          comparisonResult={comparisonResult}
        />
      )}
    </div>
  );
};

export default App;
