import { PopoverClose } from "@radix-ui/react-popover";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

import clsx from "clsx";
import { FaRegTrashAlt } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { HiMiniPencil } from "react-icons/hi2";
import { PiDotsThreeBold } from "react-icons/pi";
import { SiSendinblue } from "react-icons/si";

const Sidebar = ({
  chatHistory,
  handleNewChatClick,
  renameChatTitle,
  setRenameChatTitle,
  setChatHistory,
  currentSelectedHistoryId,
  handleOldChatClick,
  showOldChatPopover,
  setShowOldChatPopover,
}) => {
  return (
    <>
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
      <div className="chat-history-container overflow-auto h-[calc(100%_-_60px)]">
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
                      <PopoverContent align="start" className="rounded-lg p-0">
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
    </>
  );
};

export default Sidebar;
