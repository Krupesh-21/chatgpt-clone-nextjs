"use client";
import { Editor } from "@monaco-editor/react";
import axios from "axios";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

import { FiEdit2, FiSend } from "react-icons/fi";
import { IoPerson } from "react-icons/io5";
import { SiSendinblue } from "react-icons/si";

import "./app.css";

const HomePage = () => {
  const [prompt, setPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [history, setHistory] = useState([]);

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
    const regex = /^```(\w+)\n([\s\S]*?)\n```/;
    const matches = input.match(regex);

    if (matches && matches.length >= 3) {
      const languageKeyword = matches[1];
      const text = matches[2];
      return { languageKeyword, text };
    }

    return null;
  };

  console.log({ history });

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
            return `<span class='highlight'>${encodedContent.slice(
              1,
              -1
            )}</span>`;
          })
          .replace(/^\*/, "-"),
      }}
    ></p>
  );

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

  return (
    <div className="chat-container">
      <div className="chat-response-container">
        {history.map((item, index) => (
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
                <div className="icon">
                  {item.role === "user" ? <IoPerson /> : <SiSendinblue />}
                </div>
                <div className="response">
                  {item.role === "user" ? (
                    <p>{item.parts}</p>
                  ) : (
                    item.parts.split(/(```[^`]+```)/).map((data) =>
                      data.startsWith("```") &&
                      extractLanguageKeywordAndText(data) ? (
                        <Editor
                          height="200px"
                          width="100%"
                          theme="vs-dark"
                          value={extractLanguageKeywordAndText(data).text}
                          language={
                            extractLanguageKeywordAndText(data).languageKeyword
                          }
                          key={data + 1}
                          options={{
                            domReadOnly: true,
                            readOnly: true,
                            cursorBlinking: false,
                            cursorWidth: 0,
                            minimap: { enabled: false },
                            lineNumbers: "off",
                            wordWrap: "on",
                          }}
                        />
                      ) : data.split("\n").filter((d) => d.length > 0).length >
                        0 ? (
                        data
                          .split("\n")
                          .filter((d) => d.length > 0)
                          .map((d) => renderText(d))
                      ) : (
                        renderText(data)
                      )
                    )
                  )}
                </div>
                <div className="edit-icon">
                  <FiEdit2 />
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
        ))}
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
          />
          <div className={clsx("send-btn")} onClick={handlePromptData}>
            <FiSend />
          </div>
        </div>
        <p className="disclaimer">
          ChatGPT Clone may produce inaccurate information about people, places,
          or facts.
        </p>
      </div>
    </div>
  );
};

export default HomePage;
