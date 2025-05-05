/* eslint-disable no-debugger */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-empty-function */

import { sp } from "@pnp/sp";
import * as React from "react";
import { useEffect, useState } from "react";
import Loader from "../Loader/Loader";
import {
  // categoryBase64String,
  greenbase64String,
  logoBase64String,
  questionBase64String,
  redbase64String,
} from "./base64";
// import { FontSizes } from "@fluentui/react";

const htmlToPdfmake = require("html-to-pdfmake") as any;
const pdfMake = require("pdfmake/build/pdfmake");
const pdfFonts = require("pdfmake/build/vfs_fonts");
pdfMake.vfs = pdfFonts?.pdfMake?.vfs;

import "./style.css";

const LoadAndBindPdf = () => {
  const [categoryAndQuestions, setCategoryAndQuestions] = useState<any[]>([]);
  const [customerDetails, setCustomerDetails] = useState<any>({});
  const [showModal, setShowModal] = useState(true);

  const dataUrlToBlob = async (dataUrl: any) => {
    const byteString = atob(dataUrl.split(",")[1]);
    const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
    const buffer = new ArrayBuffer(byteString.length);
    const view = new Uint8Array(buffer);

    for (let i = 0; i < byteString.length; i++) {
      view[i] = byteString.charCodeAt(i);
    }

    return new Blob([buffer], { type: mimeString });
  };

  const enforceTableWidths = (node: any): any => {
    if (Array.isArray(node)) {
      return node.map(enforceTableWidths);
    }

    if (typeof node === "object" && node !== null) {
      if (node.style && node.style.includes("borderBottom")) {
        // Add a bottom border if not already specified
        node.border = [false, true, false, false];
        node.borderColor = "#e0e0e0";
        node.margin = [0, 5, 0, 15];
        node.alignment = "center";
      }
      // Check if the current node is a table with 'mainTable' class
      const isMainTable =
        node.table &&
        ((Array.isArray(node.style) && node.style.includes("mainTable")) ||
          (typeof node.class === "string" && node.class.includes("mainTable")));

      if (isMainTable && Array.isArray(node.table.body)) {
        const firstRow = node.table.body[0];
        if (firstRow && firstRow.length === 2) {
          node.table.widths = ["*", "*"];
        }
        return node; // ✅ Stop here — don’t go deeper into child tables
      }

      // Recurse for other (non-mainTable) structures
      for (const key in node) {
        if (typeof node[key] === "object") {
          node[key] = enforceTableWidths(node[key]);
        }
      }
    }

    return node;
  };

  const processPdf = async (CustDetails: any) => {
    const sectionElements = document.querySelector("#divToPrint");
    if (sectionElements) {
      const htmlContent = sectionElements.innerHTML;
      // Parse and clean the HTML
      const container = document.createElement("div");
      container.innerHTML = htmlContent;
      const cleanHtml = (node: any) => {
        const children = [...node.childNodes];
        children.forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE && !child.nodeValue.trim()) {
            node.removeChild(child);
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            cleanHtml(child);
          }
        });
      };
      cleanHtml(container);
      const cleanedHtml = container.innerHTML;
      let pdfContent = await htmlToPdfmake(cleanedHtml);
      pdfContent = enforceTableWidths(pdfContent);

      const finalContent = pdfContent.map((item: any) => {
        if (Array.isArray(item.style) && item.style.includes("sectionTitle")) {
          return {
            table: {
              widths: ["*"],
              body: [
                [
                  {
                    text: item.text,
                    fillColor: "#e0e0e0", // Use the actual color from HTML
                    style: "sectionTitle",
                    border: [false, false, false, false],
                    margin: [10, 5, 0, 5],
                    bold: true,
                    color: "#2e238b",
                  },
                ],
              ],
            },
            layout: "noBorders",
            margin: [0, 5, 0, 5],
          };
        } else {
          return item;
        }
      });

      const pdfStructure = {
        header: () => {},
        footer: (currentPage: any, pageCount: any) => {
          return [
            {
              columns: [
                {
                  text: `Page ${currentPage} of ${pageCount}`,
                  style: "footer",
                  width: "100%",
                  alignment: "right",
                  margin: [0, 5, 20, 10],
                  fontSize: 10,
                },
              ],
            },
          ];
        },
        pageMargins: [20, 20, 20, 30],
        content: await finalContent,
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            margin: [0, 0, 0, 10],
          },
          sectionTitle: {
            width: "100%",
          },
          tableCell: {
            widths: ["50%"],
          },
        },
      };
      const pdfDocGenerator = await pdfMake.createPdf(pdfStructure);
      await pdfDocGenerator.getDataUrl(async (dataUrl: string) => {
        if (!dataUrl) {
          console.log("Failed to generate data URL for the PDF.");
          return;
        }

        const pdfBlob = await dataUrlToBlob(dataUrl);
        if (pdfBlob) {
          const filePath = `pdfLibrary/${CustDetails?.Customer}.pdf`;
          await sp.web
            .getFolderByServerRelativeUrl("pdfLibrary")
            .files.add(filePath, pdfBlob, true)
            .then(async (res: any) => {
              // Get list item for the uploaded file
              const item = await res.file.getItem();

              // Update metadata (including lookup column)
              await item.update({
                EventDetailsId: CustDetails?.Id,
              });
              setShowModal(false);
            })
            .catch((err: any) => {
              console.log("Error : ", err);
            });
        } else {
          console.log("Not Uploaded");
        }

        // const iframeContainer = document.querySelector("#iframeContainer");

        // if (!iframeContainer) {
        //   console.error("Iframe container not found.");
        //   return;
        // }
        // const iframe = document.createElement("iframe");
        // iframe.src = dataUrl;
        // iframe.name = "pdfIframe";
        // iframe.style.width = "100%";
        // iframe.style.height = "500px";
        // iframeContainer.appendChild(iframe);
      });
    }
  };

  const getMimeType = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "png":
        return "image/png";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "gif":
        return "image/gif";
      case "svg":
        return "application/svg";
      default:
        return "application/octet-stream";
    }
  };

  const getBase64FromUrl = async (
    url: string,
    fileName: string
  ): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result?.toString().split(",")[1] || "";
        const mimeType = getMimeType(fileName);
        resolve(`data:${mimeType};base64,${base64}`);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const getSharepointData = async () => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("eventId");
    const numericId = idParam ? Number(idParam) : null;

    if (!numericId) {
      console.error("Invalid ID parameter:", idParam);
      window.close();
    }
    let configType = "";
    try {
      const CustomerDetails = await sp.web.lists
        .getByTitle("WalkConfig")
        .items.getById(numericId ?? 0)
        .get();

      setCustomerDetails(CustomerDetails);

      configType = CustomerDetails.ConfigType.split(" ")[0];

      let categorySNoData = await sp.web.lists
        .getByTitle("CategoryConfig")
        .items.filter(`WalkType eq '${configType}'`)
        .getAll();
      categorySNoData = categorySNoData.sort((a: any, b: any) => a.SNo - b.SNo);

      const categoryQuestions = await sp.web.lists
        .getByTitle("WalkDetails")
        .select("EventDetails/Id,CategoryConfig/Id,CategoryConfig/Title")
        .expand("EventDetails,CategoryConfig")
        .items.filter(`EventDetailsId eq ${numericId}`)
        .getAll();

      // Create a rank map from masterArray
      const rankMap = new Map(
        categorySNoData.map((item, index) => [item.Id, index])
      );

      // Sort myArray based on the rankMap
      const sortedArray = [...categoryQuestions].sort(
        (a, b) =>
          (rankMap.get(a.CategoryConfigId) ?? Infinity) -
          (rankMap.get(b.CategoryConfigId) ?? Infinity)
      );

      // Now, fetch attachments for each item
      const itemsWithAttachments = await Promise.all(
        sortedArray.map(async (item) => {
          const attachments = await sp.web.lists
            .getByTitle("WalkDetails")
            .items.getById(item.Id)
            .attachmentFiles.get();

          const attachmentsBase64 = await Promise.all(
            attachments.map(async (file) => {
              const base64 = await getBase64FromUrl(
                file.ServerRelativeUrl,
                file.FileName
              );
              return {
                fileName: file.FileName,
                base64,
              };
            })
          );

          return {
            ...item,
            attachments: attachmentsBase64,
          };
        })
      );

      const outputArray: any[] = [];
      categorySNoData.forEach((configItem) => {
        const matchedQuestions = itemsWithAttachments.filter(
          (item) => item.CategoryConfigId === configItem.Id
        );
        if (matchedQuestions.length > 0) {
          outputArray.push({
            id: configItem.Id,
            title: configItem.Title,
            Questions: matchedQuestions,
          });
        }
      });
      setCategoryAndQuestions([...outputArray]);
      setTimeout(async () => {
        await processPdf(CustomerDetails);
      }, 3000);
    } catch (error) {
      console.log("Error fetching SharePoint data:", error);
    }
  };

  useEffect(() => {
    getSharepointData();
  }, []);

  const bindImages = (data: any[]): JSX.Element[] => {
    const rows: JSX.Element[] = [];

    for (let i = 0; i < data.length; i += 2) {
      const first = data[i];
      const second = data[i + 1];

      rows.push(
        <tr key={i}>
          <td
            style={{
              border: "none",
              paddingTop: "10px",
              margin: "10px",
            }}
            className="tableCell"
          >
            <img
              alt={first.fileName}
              width="250"
              height="100"
              src={first.base64}
            />
          </td>
          {second ? (
            <td
              style={{
                border: "none",
                padding: "10px",
                margin: "10px",
              }}
              className="tableCell"
            >
              <img
                alt={second.fileName}
                width="250"
                height="100"
                src={second.base64}
              />
            </td>
          ) : (
            <td
              style={{
                border: "none",
                padding: "10px",
                // borderBottom: "1px solid #e0e0e0",
              }}
              className="tableCell"
            >
              {" "}
            </td>
          )}
        </tr>
      );
    }

    return rows;
  };

  const calculateCategoryPassPercentage = (items: any) => {
    if (!items.length) return 0;

    const passCount = items.filter(
      (item: any) => item.Status === "Pass"
    ).length;
    const percentage = (passCount / items.length) * 100;

    return Math.round(percentage);
  };
  const calculateOverallFailPercentage = (items: any) => {
    const allQuestions = items.flatMap((item: any) => item.Questions);
    const total = allQuestions.length;
    const failCount = allQuestions.filter(
      (q: any) => q.Status === "Fail"
    ).length;

    const failPercentage = Math.round((failCount / total) * 100);

    return Math.round(failPercentage);
  };

  return (
    <div>
      {showModal ? (
        <Loader />
      ) : (
        <div id="pdfSuccessMessage">
          <div style={{ textAlign: "center" }}>
            <h2 id="pdfFileName">{customerDetails?.Customer}.pdf</h2>
            <p>
              <strong style={{ color: "green" }}>Success!</strong> The PDF was
              generated and delivered to the recipient.
            </p>
          </div>
        </div>
      )}
      <div style={{ width: "100%", display: "none" }} id="divToPrint">
        <div>
          <img width="170" height="45" src={logoBase64String} />
        </div>
        {calculateOverallFailPercentage(categoryAndQuestions) !== 0 && (
          <table className="mainTable">
            <tbody>
              <tr>
                <td style={{ border: "none", backgroundColor: "#f9f9f9" }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      margin: "10px 0px",
                      color: "red",
                    }}
                  >
                    Cotegories
                  </div>
                </td>
                <td style={{ border: "none", backgroundColor: "#f9f9f9" }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      margin: "10px 0px",
                      color: "red",
                    }}
                  >
                    {customerDetails?.Site}{" "}
                    {calculateOverallFailPercentage(categoryAndQuestions)}%
                  </div>
                </td>
              </tr>
              {categoryAndQuestions?.map((category) => {
                return (
                  category.Questions.some(
                    (item: any) => item.Status === "Fail"
                  ) && (
                    <tr>
                      <td style={{ border: "none", fontSize: "13px" }}>
                        {category.title}
                      </td>
                      <td
                        style={{
                          border: "none",
                          color: "red",
                          fontSize: "13px",
                          fontWeight: "bold",
                        }}
                      >
                        Fail
                      </td>
                    </tr>
                  )
                );
              })}
            </tbody>
          </table>
        )}
        <div
          style={{
            padding: "20px",
            fontSize: "14px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <div style={{ fontWeight: "bold", margin: "15px" }}>
            <span
              style={{
                color: "red",
                fontWeight: "bold",
              }}
            >
              Customer
            </span>{" "}
            {customerDetails?.Customer}
          </div>
          <div style={{ fontWeight: "bold", margin: "15px" }}>
            <span
              style={{
                color: "red",
                fontWeight: "bold",
              }}
            >
              Country
            </span>{" "}
            {customerDetails?.Country}
          </div>
          <div style={{ fontWeight: "bold", margin: "15px" }}>
            <span
              style={{
                color: "red",
                fontWeight: "bold",
              }}
            >
              Site
            </span>{" "}
            {customerDetails?.Site}
          </div>
        </div>
        {categoryAndQuestions.map((category) => {
          return (
            <>
              <div className="sectionTitle">
                {/* <img width="15" height="15" src={categoryBase64String} /> */}
                {category.title}{" "}
                {calculateCategoryPassPercentage(category.Questions)}%
              </div>
              {/* <table className="mainTable">
                <tbody> */}
              {category.Questions.map((question: any, index: number) => {
                return (
                  <>
                    <table className="mainTable">
                      <tbody>
                        <tr key={question.Id}>
                          <td
                            style={{
                              border: "none",
                              borderTop: `${
                                index === 0 ? null : "1px solid #e0e0e0"
                              }`,
                              marginTop: "10px",
                            }}
                          >
                            <table>
                              <tbody>
                                <tr>
                                  <td style={{ border: "none" }}>
                                    <img
                                      width="15"
                                      height="15"
                                      src={questionBase64String}
                                    />
                                  </td>
                                  <td
                                    style={{
                                      border: "none",
                                      fontSize: "13px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {question.Question}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                          <td
                            style={{
                              border: "none",
                              borderTop: `${
                                index === 0 ? null : "1px solid #e0e0e0"
                              }`,
                              marginTop: "10px",
                            }}
                          >
                            <table>
                              <tbody>
                                <tr>
                                  <td style={{ border: "none" }}>
                                    <img
                                      width="15"
                                      height="15"
                                      src={
                                        question?.Status === "Fail"
                                          ? redbase64String
                                          : greenbase64String
                                      }
                                    />
                                  </td>
                                  <td
                                    style={{
                                      border: "none",
                                      fontSize: "13px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {question.Status}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                        {question.attachments.length > 0 &&
                          bindImages(question.attachments)}
                      </tbody>
                    </table>
                    {question.attachments.length > 0 && (
                      <div
                        style={{
                          fontSize: "11px",
                          border: "none",
                          borderTop: "1px solid #e0e0e0",
                        }}
                        className="borderBottom"
                      >
                        {question.ActionDescription}
                      </div>
                    )}
                  </>
                );
              })}
              {/* </tbody>
              </table> */}
            </>
          );
        })}
      </div>
      {/* <div id="iframeContainer" style={{ width: "100%" }}></div> */}
    </div>
  );
};
export default LoadAndBindPdf;
