import * as React from "react";
import "./style.css";

const LoadAndBindPdf = () => {
  return (
    <div className="loader-container">
      {/* Circular Progress Loader with "Generating PDF..." */}
      {/* <div className="circle-loader">
        <div className="circle"></div>
        <div className="text">Generating PDF...</div>
      </div> */}

      {/* Text Typing "Generating PDF..." */}
      {/* <div className="typing-loader">Generating PDF...</div> */}

      {/* Bouncing Dots Loader (modern, smooth) */}
      <div>
        <div className="dots-loader">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="text">Generating PDF...</div>
      </div>
    </div>
  );
};
export default LoadAndBindPdf;
