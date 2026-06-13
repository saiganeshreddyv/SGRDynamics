import { useEffect } from "react";
import { createChat } from "@n8n/chat";
import "@n8n/chat/style.css";

export default function IRISChat() {
  useEffect(() => {
    createChat({
      webhookUrl:
        "http://43.204.230.165:5678/webhook/b6efb0e3-fde4-469e-b1c2-6b997603cf1b/chat",

      mode: "window",

      showWelcomeScreen: false,

      initialMessages: [
        "Hi, I'm IRIS 👋",
        "How can I help your business today?"
      ],

      i18n: {
        en: {
            title: "IRIS Assistant",
            subtitle: "AI Engineering Consultant",
            footer: "",
            getStarted: "Start Chat",
            inputPlaceholder: "",
            closeButtonTooltip: ""
        }
      }
    });
  }, []);

  return null;
}