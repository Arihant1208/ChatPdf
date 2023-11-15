import React from "react";

type Props = { pdf_url: string };

const PDFViewer = ({ pdf_url }: Props) => {
  console.log(pdf_url);
  return (
    <>
      {/* <meta
        httpEquiv="Content-Security-Policy"
        content="default-src *; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      /> */}

      <iframe
        src={`//docs.google.com/gview?url=${pdf_url}&embedded=true`}
        className="w-full h-full"
      ></iframe>
    </>
  );
};

export default PDFViewer;
