/* eslint-disable no-debugger */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-use-before-define */

import React, { useEffect, useState } from "react";

interface PdfSuccessModalProps {
  fileName: string;
  onClose: () => void;
}

const PdfSuccessModal: React.FC<PdfSuccessModalProps> = ({
  fileName,
  onClose,
}) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          //   onClose();
          const url = new URL(window.location.href);
          url.searchParams.delete("eventId");

          // Replace current history state (no page reload here)
          window.history.replaceState(
            {},
            document.title,
            url.pathname + url.search
          );

          // Then reload the page
          window.location.reload();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleClose = () => {
    //   onClose();
    const url = new URL(window.location.href);
    url.searchParams.delete("eventId");

    // Replace current history state (no page reload here)
    window.history.replaceState({}, document.title, url.pathname + url.search);

    // Then reload the page
    window.location.reload();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>{fileName}.pdf</div>
        <div style={styles.content}>
          Your PDF file has been generated successfully.
        </div>
        <div style={styles.footer}>
          <button onClick={handleClose} style={styles.button}>
            Okay ({countdown}s)
          </button>
        </div>
      </div>
    </div>
  );
};

// Basic inline styles for the modal
const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  modal: {
    background: "#fff",
    borderRadius: "8px",
    padding: "20px",
    width: "400px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  header: {
    fontWeight: "bold",
    fontSize: "19px",
    marginBottom: "10px",
  },
  content: {
    marginBottom: "20px",
    fontSize: "15px",
  },
  footer: {},
  button: {
    padding: "10px 20px",
    backgroundColor: "#0078d4",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default PdfSuccessModal;
