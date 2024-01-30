"use client";
import axios from "axios";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { v4 as uuid } from "uuid";

import { FaRegTrashAlt } from "react-icons/fa";
import { FaArrowUpLong } from "react-icons/fa6";
import { FiEdit } from "react-icons/fi";
import { GoPaste } from "react-icons/go";
import { HiMiniPencil } from "react-icons/hi2";
import { IoMdCheckmark } from "react-icons/io";
import { IoPerson } from "react-icons/io5";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { PiDotsThreeBold } from "react-icons/pi";
import { SiSendinblue } from "react-icons/si";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PopoverClose } from "@radix-ui/react-popover";
import "./app.css";

const HomePage = () => {
  const [prompt, setPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [history, setHistory] = useState([]);
  const [codeblockCopied, setCodeblockCopied] = useState({
    copied: false,
    index: null,
  });
  const [gptResponseCopied, setGptResponseCopied] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentSelectedHistoryId, setCurrentSelectedHistoryId] =
    useState(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showOldChatPopover, setShowOldChatPopover] = useState(false);
  const [renameChatTitle, setRenameChatTitle] = useState({
    id: null,
    value: "",
  });
  const [updateUserQuestion, setUpdateUserQuestion] = useState({
    edit: false,
    id: null,
    value: "",
  });

  const promptRef = useRef(null);
  const bottomRef = useRef(null);
  const chatHistoryTitleRef = useRef(null);

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
        history: [..._history].map((item) => ({
          role: item.role,
          parts: item.parts,
        })),
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

      const historyId = uuid();

      const oldHistoryData = [...chatHistory];

      if (!currentSelectedHistoryId) {
        const data = {
          historyId,
          history: _history,
          title: splitString(prompt),
        };
        oldHistoryData.unshift(data);
        setCurrentSelectedHistoryId(historyId);
      } else {
        const oldHistoryIndex = oldHistoryData.findIndex(
          (item) => item.historyId === currentSelectedHistoryId
        );
        if (oldHistoryIndex > -1) {
          oldHistoryData[oldHistoryIndex].history = _history;
        }
      }
      localStorage.setItem("chat_history", JSON.stringify(oldHistoryData));
      setChatHistory(oldHistoryData);
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
        {
          role: "model",
          parts: "",
        },
      ]);
      sendPromptToServer();
    }
  }, [prompt]);

  const extractLanguageKeywordAndText = (input) => {
    const regex = /^\s*```(\w*)\s*\n*([\s\S]*?)\n*\s*```/;
    const matches = input.match(regex);

    if (matches && matches.length >= 3) {
      const languageKeyword = matches[1];
      const text = matches[2];
      const blockId = uuid();
      return { languageKeyword, text, blockId };
    }

    return null;
  };

  function splitString(input) {
    // Match pattern until the first comma, full stop, semicolon, or question mark is encountered, or until the 200th character
    const regex = /^(.{0,200}[^,.;?]*)(?:,|\.|;|\?)?/;
    const matches = input.match(regex);
    if (matches && matches[1]) {
      return matches[1];
    }
    return input.slice(0, 200); // If pattern not found, return the first 200 characters
  }

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
            return `<span class='highlight'>${encodedContent}</span>`;
          })
          .replace(/^\*/, "-"),
      }}
    ></p>
  );

  const handleNewChatClick = () => {
    const oldHistoryData = [...chatHistory];
    if (
      !currentSelectedHistoryId &&
      history.length < 1 &&
      prompt.trim().length < 1
    ) {
      return;
    }
    if (currentSelectedHistoryId) {
      const oldHistoryIndex = oldHistoryData.findIndex(
        (item) => item.historyId === currentSelectedHistoryId
      );
      if (oldHistoryIndex > -1) {
        oldHistoryData[oldHistoryIndex].history = history;
      }
    } else {
      const title = splitString(history[0].parts);
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
    if (historyId === currentSelectedHistoryId) return;
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
      const oldHistoryId = currentSelectedHistoryId;
      const oldHistoryData = [...chatHistory];
      const oldHistoryIndex = oldHistoryData.findIndex(
        (item) => item.historyId === oldHistoryId
      );

      if (oldHistoryIndex > -1) {
        oldHistoryData[oldHistoryIndex].active = false;
      }

      const { history, historyId } = _chatHistory;
      setHistory(history);
      setCurrentSelectedHistoryId(historyId);

      const newHistoryIndex = oldHistoryData.findIndex(
        (item) => item.historyId === historyId
      );
      if (newHistoryIndex > -1) {
        oldHistoryData[newHistoryIndex].active = true;
      }

      setChatHistory(oldHistoryData);
      localStorage.setItem("chat_history", JSON.stringify(oldHistoryData));
    }
  };

  const renderGptResponse = (data, index) => {
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
                setCodeblockCopied({ copied: result, index });
              }}
            >
              <div className="icon">
                <div className="d-flex">
                  {codeblockCopied.copied && index === codeblockCopied.index ? (
                    <IoMdCheckmark />
                  ) : (
                    <GoPaste />
                  )}
                </div>
                <span>
                  {codeblockCopied.copied && index === codeblockCopied.index
                    ? "Copied"
                    : "Copy Code"}
                </span>
              </div>
            </CopyToClipboard>
          </div>
          <pre className="code-block text-sm	">
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

  const togglePricingModal = () => {
    setShowPriceModal((prev) => !prev);
  };

  const handleUserEditClick = (id, value, reset = false) => {
    setUpdateUserQuestion(
      reset ? { edit: false, id: null, value: "" } : { edit: true, id, value }
    );
  };

  const handleUserEditSave = (oldValue = "") => {
    if (
      updateUserQuestion.value.trim().toLowerCase() ===
      oldValue.trim().toLowerCase()
    ) {
      handleUserEditClick(null, null, true);
      return;
    }

    const index = history.findIndex(
      (item) => item.id === updateUserQuestion.id
    );

    const _history = history.slice(0, index);
    setPrompt(updateUserQuestion.value);
    setHistory(_history);
    handleUserEditClick(null, null, true);
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

    if (localStorage) {
      setChatHistory(JSON.parse(localStorage.getItem("chat_history")) || []);

      const oldHistoryData =
        JSON.parse(localStorage.getItem("chat_history")) || [];
      if (oldHistoryData.length > 0) {
        const lastActiveHistory = oldHistoryData.find((item) => item.active);

        if (lastActiveHistory) {
          setCurrentSelectedHistoryId(lastActiveHistory.historyId);
          setHistory(lastActiveHistory.history);
        }
      }
    }

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
    if (codeblockCopied.copied) {
      setTimeout(() => {
        setCodeblockCopied({ copied: false, index: null });
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
    <>
      <div id="content">
        <div className="sidebar-container lg:block md:hidden sm:hidden xs:hidden">
          <div
            className="new-chat-container hover:bg-stone-300/15"
            onClick={handleNewChatClick}
          >
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
          <div className="chat-history-container" ref={chatHistoryTitleRef}>
            {chatHistory.length > 0
              ? chatHistory.map((item) =>
                  renameChatTitle.id === item.historyId ? (
                    <Input
                      key={item.historyId}
                      value={renameChatTitle.value}
                      onChange={({ target: { value } }) =>
                        setRenameChatTitle((prev) => ({ ...prev, value }))
                      }
                      autoFocus
                      className="bg-transparent mt-1 text-white outline-0 focus:outline-0 focus:border-0"
                      onBlur={() => {
                        const _chatHistory = [...chatHistory];
                        const index = _chatHistory.findIndex(
                          (item) => item.historyId === renameChatTitle.id
                        );
                        if (index > -1) {
                          _chatHistory[index].title = renameChatTitle.value;
                          setChatHistory(_chatHistory);
                          setRenameChatTitle({ id: null, value: "" });
                          setShowOldChatPopover(null);
                          localStorage.setItem(
                            "chat_history",
                            JSON.stringify(_chatHistory)
                          );
                        }
                      }}
                    />
                  ) : (
                    <div
                      key={item.historyId}
                      className={clsx(
                        "title-container hover:bg-zinc-400 rounded-xl mt-1 relative overflow-hidden group",
                        {
                          "bg-zinc-400 remove-bg-lenear":
                            !!currentSelectedHistoryId &&
                            currentSelectedHistoryId === item.historyId,
                        }
                      )}
                      onClick={() => handleOldChatClick(item.historyId)}
                    >
                      <p className="title">{item.title}</p>
                      <div
                        className={clsx(
                          "absolute h-full w-full top-0 right-0 bg-apply"
                        )}
                      />
                      <div
                        className={clsx(
                          "absolute group-hover:bg-zinc-400 items-center justify-end h-full top-0 right-0 hidden group-hover:flex settings",
                          {
                            "d-flex": showOldChatPopover,
                          }
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Popover
                          onOpenChange={(open) => {
                            if (!open) {
                              setShowOldChatPopover(open);
                            }
                          }}
                        >
                          <PopoverTrigger
                            onClick={() => setShowOldChatPopover(true)}
                            className="px-3"
                          >
                            <PiDotsThreeBold className="fill-white" />
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            className="rounded-lg p-0"
                          >
                            <div className="d-flex w-full flex-col justify-center p-2">
                              <PopoverClose
                                className="d-flex gap-3 items-center p-2 hover:bg-zinc-200 rounded-lg cursor-pointer"
                                onClick={() => {
                                  const _chatHistory = chatHistory.filter(
                                    (data) => item.historyId !== data.historyId
                                  );
                                  setChatHistory(_chatHistory);
                                  setShowOldChatPopover(false);
                                  localStorage.setItem(
                                    "chat_history",
                                    JSON.stringify(_chatHistory)
                                  );
                                }}
                              >
                                <FaRegTrashAlt className="fill-red-400" />
                                <span>Delete Chat</span>
                              </PopoverClose>
                              <PopoverClose
                                className="d-flex gap-3 items-center p-2 hover:bg-zinc-200	rounded-lg cursor-pointer w-full"
                                onClick={() => {
                                  setRenameChatTitle({
                                    id: item.historyId,
                                    value: item.title,
                                  });
                                  setShowOldChatPopover(false);
                                }}
                              >
                                <HiMiniPencil />
                                <span>Rename Chat</span>
                              </PopoverClose>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )
                )
              : null}
          </div>
        </div>

        {/* <Sheet>
          <SheetTrigger className="lg:hidden md:block">Open</SheetTrigger>
          <SheetContent side={"left"}>
            <SheetHeader>
              <SheetTitle>Are you absolutely sure?</SheetTitle>
              <SheetDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet> */}

        <div className="chat-container">
          <div className="d-flex p-2 justify-between">
            <Popover>
              <PopoverTrigger className="focus:bg-zinc-100 rounded-lg">
                <div className="d-flex items-center gap-2 p-2 ">
                  <span className="font-bold">ChatGPT 3.5</span>
                  <MdOutlineKeyboardArrowDown />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-2">
                  <div className="d-flex justify-between items-center gap-2.5 p-3 hover:bg-zinc-100 rounded-lg cursor-pointer">
                    <div className="d-flex flex-col	">
                      <span className="font-bold">GPT-3.5</span>
                      <span className="text-sm text-muted-foreground">
                        Great for everyday tasks.
                      </span>
                    </div>
                    <div>
                      <Checkbox className="rounded-full" checked />
                    </div>
                  </div>
                  <div
                    className="d-flex justify-between mt-1.5 items-center gap-2.5 p-3 hover:bg-zinc-100 rounded-lg cursor-pointer"
                    onClick={togglePricingModal}
                  >
                    <div className="d-flex flex-col	">
                      <span className="font-bold">GPT-4</span>
                      <span className="text-sm text-muted-foreground">
                        Our smartes and most capable model. Includes DALL-E,
                        browsing and more
                      </span>
                      <Button className="mt-1 bg-violet-500">
                        Upgrade to Plus
                      </Button>
                    </div>
                    <div>
                      <Checkbox className="rounded-full" disabled />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="chat-response-container">
            {history.length > 0 ? (
              history.map((item, index) => (
                <>
                  <div
                    key={index + 1}
                    className={clsx(
                      "response-container w-full max-w-[768px] mx-auto",
                      item.role
                    )}
                  >
                    <div
                      className={clsx("chat-response", {
                        "show-edit-icon": item.role === "user",
                      })}
                    >
                      <div className="user-details">
                        <div className="icon">
                          {item.role === "user" ? (
                            <IoPerson />
                          ) : (
                            <SiSendinblue />
                          )}
                        </div>
                        <span className="font-bold">
                          {item.role === "user" ? "You" : "ChatGPT"}
                        </span>
                      </div>
                      <div className="response">
                        {item.role === "user" ? (
                          updateUserQuestion.edit &&
                          updateUserQuestion.id === item.id ? (
                            <div className="d-flex flex-col w-full">
                              <Textarea
                                autoFocus
                                value={updateUserQuestion.value}
                                onChange={({ target: { value } }) =>
                                  handleUserEditClick(
                                    updateUserQuestion.id,
                                    value
                                  )
                                }
                                rows={1}
                                id="edit-text-area"
                                className="mt-1 resize-none max-h-[300px]"
                                onInput={() => {
                                  const el =
                                    document.getElementById("edit-text-area");
                                  if (el) {
                                    el.style.height = "auto";
                                    el.style.height = `${el.scrollHeight}px`;
                                  }
                                }}
                              />
                              <div className="d-flex justify-end items-center w-full mt-1.5 gap-3">
                                <Button
                                  className="bg-[#10a37f] hover:bg-[#10a37f]"
                                  onClick={() => handleUserEditSave(item.parts)}
                                >
                                  Save & Submit
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() =>
                                    handleUserEditClick(null, null, true)
                                  }
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p>{item.parts}</p>
                          )
                        ) : item.parts ? (
                          item.parts
                            .split(/(```[^`]+```)/)
                            .map((data, index) =>
                              renderGptResponse(data, index)
                            )
                        ) : (
                          <div
                            id="blinking-cursor"
                            className=" h-3.5 w-2 bg-zinc-950	 rounded-md"
                          />
                        )}
                      </div>
                      <div className="tools">
                        {item.role === "user" ? (
                          updateUserQuestion.edit &&
                          updateUserQuestion.id === item.id ? null : (
                            <HiMiniPencil
                              className="fill-gray-400"
                              onClick={() =>
                                handleUserEditClick(item.id, item.parts)
                              }
                            />
                          )
                        ) : item.parts ? (
                          <CopyToClipboard
                            text={item.parts}
                            onCopy={(text, result) =>
                              setGptResponseCopied(result)
                            }
                          >
                            {gptResponseCopied ? (
                              <IoMdCheckmark className="fill-gray-500" />
                            ) : (
                              <GoPaste className="fill-gray-500" />
                            )}
                          </CopyToClipboard>
                        ) : null}
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
                <h2 className="text-3xl mt-1">How can I help you today?</h2>
              </div>
            )}
          </div>

          <div className="input-container">
            <div className="interact w-full max-w-[768px] mx-auto relative">
              <Textarea
                type="text"
                name="prompt"
                rows={1}
                ref={promptRef}
                onInput={() => {
                  promptRef.current.style.height = "auto";
                  promptRef.current.style.height = `${promptRef.current.scrollHeight}px`;
                }}
                placeholder="Message ChatGPT..."
              />
              <div className={clsx("send-btn")} onClick={handlePromptData}>
                <FaArrowUpLong />
              </div>
            </div>
            <p className="disclaimer w-full max-w-[768px] mx-auto">
              ChatGPT Clone may produce inaccurate information about people,
              places, or facts.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
