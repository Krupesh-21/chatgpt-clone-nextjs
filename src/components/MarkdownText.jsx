import React from "react";
import { marked } from "marked";
import { extractLanguageKeywordAndText } from "@/app/utils/utils";
import DOMPurify from "dompurify";

const MarkdownText = ({ data }) => {
  // const [codeblockCopied, setCodeblockCopied] = useState({
  //   copied: false,
  //   index: null,
  // });
  const renderer = new marked.Renderer();

  const escapeHtml = (unsafe) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  renderer.code = (code) => {
    const { languageKeyword: lk } =
      extractLanguageKeywordAndText(code.raw) || {};
    const languageKeyword = code.lang || lk || "plaintext";

    const text = escapeHtml(code.text.trim());

    return `
            <div class="code-block-container">
                <div class="title-copy-container">
                    <span>${languageKeyword}</span>
                    </div>
                    <pre class="code-block text-sm">
                        <code>${text}</code>
                    </pre>
                </div>
                `;
    // <button class='copy-button'>
    //   <span>
    //      ${
    //        codeblockCopied.copied &&
    //        index === codeblockCopied.index
    //          ? "Copied"
    //          : "Copy Code"
    //     }
    //   </span>
    // </button>
  };
  const htmlString = marked(data, { renderer });
  const sanitizedHtml = DOMPurify.sanitize(htmlString);

  return <p dangerouslySetInnerHTML={{ __html: sanitizedHtml }}></p>;
};

export default MarkdownText;
