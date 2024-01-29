"use client";
import axios from "axios";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

import { FaArrowUpLong } from "react-icons/fa6";
import { FiEdit, FiEdit2 } from "react-icons/fi";
import { GoPaste } from "react-icons/go";
import { IoMdCheckmark } from "react-icons/io";
import { IoPerson } from "react-icons/io5";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { SiSendinblue } from "react-icons/si";

import CopyToClipboard from "react-copy-to-clipboard";
import "./app.css";

const HomePage = () => {
  const [prompt, setPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [history, setHistory] = useState([]);
  const [codeblockCopied, setCodeblockCopied] = useState(false);
  const [gptResponseCopied, setGptResponseCopied] = useState(false);
  const [chatHistory, setChatHistory] = useState(
    JSON.parse(localStorage.getItem("chat_history")) || []
  );
  const [currentSelectedHistoryId, setCurrentSelectedHistoryId] =
    useState(null);

  const promptRef = useRef(null);
  const bottomRef = useRef(null);

  const sendPromptToServer = async () => {
    const _history = [
      ...history,
      {
        role: "user",
        parts: prompt,
        id: uuid(),
      },
    ];

    const response = await axios({
      method: "POST",
      url: "/api/chat",
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        prompt,
        history: [..._history].map((item) => {
          delete item.id;
          return item;
        }),
      }),
    });

    const { data, error, success } = response.data || {};

    if (success) {
      setAiResponse(data);
      _history.push({
        role: "model",
        parts: data,
        id: uuid(),
      });
      setHistory(_history);
    } else {
      console.log(error);
    }
  };

  useEffect(() => {
    if (prompt.trim().length > 0) {
      setHistory((prev) => [
        ...prev,
        {
          role: "user",
          parts: prompt,
        },
      ]);
      sendPromptToServer();
    }
  }, [prompt]);

  const extractLanguageKeywordAndText = (input) => {
    const regex = /^\s*```(\w+)\n([\s\S]*?)\n\s*```/;
    const matches = input.match(regex);

    if (matches && matches.length >= 3) {
      const languageKeyword = matches[1];
      const text = matches[2];
      const blockId = uuid();
      return { languageKeyword, text, blockId };
    }

    return null;
  };

  const renderText = (text) => (
    <p
      key={text + 1}
      dangerouslySetInnerHTML={{
        __html: text
          .replaceAll(/\*\*(.*?)\*\*/g, "<b>$1</b>")
          .replaceAll(/(?<!`)(`[^`]+`)(?!`)/g, (match, p1) => {
            const encodedContent = p1.replace(/[<>&'"]/g, (char) => {
              switch (char) {
                case "<":
                  return "&lt;";
                case ">":
                  return "&gt;";
                case "&":
                  return "&amp;";
                case "'":
                  return "&#39;";
                case '"':
                  return "&quot;";
                default:
                  return char;
              }
            });
            console.log(encodedContent);
            return `<span class='highlight'>${encodedContent}</span>`;
          })
          .replace(/^\*/, "-"),
      }}
    ></p>
  );

  const handleNewChatClick = () => {
    const oldHistoryData = [...chatHistory];
    if (currentSelectedHistoryId) {
      const oldHistoryIndex = oldHistoryData.findIndex(
        (item) => item.historyId === currentSelectedHistoryId
      );
      if (oldHistoryIndex > -1) {
        oldHistoryData[oldHistoryIndex].history = history;
      }
    } else {
      const title = history[0].parts;
      const historyId = uuid();
      const data = {
        historyId,
        title,
        history,
      };
      oldHistoryData.unshift(data);
    }
    localStorage.setItem("chat_history", JSON.stringify(oldHistoryData));
    setChatHistory(oldHistoryData);
    setHistory([]);
    setPrompt("");
  };

  const handleOldChatClick = (historyId) => {
    if (!currentSelectedHistoryId && history.length > 0) {
      const oldHistoryData = [...chatHistory];
      const title = history[0].parts;
      const historyId = uuid();
      const data = {
        historyId,
        title,
        history,
      };
      oldHistoryData.unshift(data);
      setChatHistory(oldHistoryData);
      localStorage.setItem("chat_history", JSON.stringify(oldHistoryData));
    }
    const _chatHistory = chatHistory.find(
      (item) => item.historyId === historyId
    );

    if (_chatHistory) {
      const { history, historyId } = _chatHistory;
      setHistory(history);
      setCurrentSelectedHistoryId(historyId);
    }
  };

  const renderGptResponse = (data) => {
    const { text, languageKeyword, blockId } =
      extractLanguageKeywordAndText(data) || {};

    if (data.startsWith("```") && extractLanguageKeywordAndText(data)) {
      return (
        <div key={data} className="code-block-container">
          <div className="title-copy-container">
            <span>{languageKeyword}</span>
            <CopyToClipboard
              text={text}
              onCopy={(text, result) => {
                setCodeblockCopied(result);
              }}
            >
              <div className="icon">
                <div className="d-flex">
                  {codeblockCopied ? <IoMdCheckmark /> : <GoPaste />}
                </div>
                <span>{codeblockCopied ? "Copied" : "Copy Code"}</span>
              </div>
            </CopyToClipboard>
          </div>
          <pre className="code-block">
            <code>{text}</code>
          </pre>
        </div>
      );
    } else if (data.split("\n").filter((d) => d.length > 0).length > 0) {
      return data
        .split("\n")
        .filter((d) => d.length > 0)
        .map((d) => renderText(d));
    }

    return renderText(data);
  };

  const handlePromptData = () => {
    if (promptRef.current.value.trim().length > 0) {
      setPrompt(promptRef.current.value);
      promptRef.current.value = "";
    }
  };

  useEffect(() => {
    const textarea = promptRef.current;

    textarea.addEventListener("keydown", (e) => {
      if (e.keyCode === 13 || e.key === "Enter") {
        e.preventDefault();
        handlePromptData();
        textarea.style.height = "auto";
      }
    });

    return () => {
      textarea.removeEventListener("keydown", (e) => {
        if (e.keyCode === 13 || e.key === "Enter") {
          e.preventDefault();
          handlePromptData();
          textarea.style.height = "auto";
        }
      });
    };
  }, []);

  useEffect(() => {
    if (bottomRef.current)
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  useEffect(() => {
    if (codeblockCopied) {
      setTimeout(() => {
        setCodeblockCopied(false);
      }, 1500);
    }
  }, [codeblockCopied]);

  useEffect(() => {
    if (gptResponseCopied) {
      setTimeout(() => {
        setGptResponseCopied(false);
      }, 1500);
    }
  }, [gptResponseCopied]);

  return (
    <div id="content">
      <div className="sidebar-container">
        <div className="new-chat-container" onClick={handleNewChatClick}>
          <div className="new-chat">
            <div className="icon">
              <SiSendinblue />
            </div>
            <span>New Chat</span>
          </div>
          <div className="edit-icon">
            <FiEdit />
          </div>
        </div>
        <div className="chat-history-container">
          {chatHistory.length > 0
            ? chatHistory.map((item) => (
                <div
                  key={item.historyId}
                  className="title-container"
                  onClick={() => handleOldChatClick(item.historyId)}
                >
                  <p className="title">{item.title}</p>
                </div>
              ))
            : null}
        </div>
      </div>

      <div className="chat-container">
        <div className="header">
          <div className="title-version">
            <span>ChatGPT 3.5</span>
            <MdOutlineKeyboardArrowDown />
          </div>
        </div>
        <div className="chat-response-container">
          {history.length > 0 ? (
            history.map((item, index) => (
              <>
                <div
                  key={index + 1}
                  className={clsx("response-container", item.role)}
                >
                  <div
                    className={clsx("chat-response", {
                      "show-edit-icon": item.role === "user",
                    })}
                  >
                    <div className="user-details">
                      <div className="icon">
                        {item.role === "user" ? <IoPerson /> : <SiSendinblue />}
                      </div>
                      <span>{item.role === "user" ? "You" : "ChatGPT"}</span>
                    </div>
                    <div className="response">
                      {item.role === "user" ? (
                        <p>{item.parts}</p>
                      ) : (
                        item.parts
                          .split(/(```[^`]+```)/)
                          .map((data) => renderGptResponse(data))
                      )}
                    </div>
                    <div className="tools">
                      {item.role === "user" ? (
                        <FiEdit2 />
                      ) : (
                        <CopyToClipboard
                          text={item.parts}
                          onCopy={(text, result) =>
                            setGptResponseCopied(result)
                          }
                        >
                          {gptResponseCopied ? <IoMdCheckmark /> : <GoPaste />}
                        </CopyToClipboard>
                      )}
                    </div>
                  </div>
                </div>
                {index === history.length - 1 && (
                  <>
                    <div className="last-section" />
                    <div ref={bottomRef}></div>
                  </>
                )}
              </>
            ))
          ) : (
            <div className="default-screen">
              <div className="icon">
                <SiSendinblue />
              </div>
              <h2>How can I help you today?</h2>
            </div>
          )}
        </div>

        <div className="input-container">
          <div className="interact">
            <textarea
              type="text"
              name="prompt"
              rows={1}
              ref={promptRef}
              onInput={(e) => {
                promptRef.current.style.height = "auto";
                promptRef.current.style.height = `${promptRef.current.scrollHeight}px`;
              }}
              placeholder="Message ChatGPT..."
            />
            <div className={clsx("send-btn")} onClick={handlePromptData}>
              <FaArrowUpLong />
            </div>
          </div>
          <p className="disclaimer">
            ChatGPT Clone may produce inaccurate information about people,
            places, or facts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
