/** The tech and consumer writing index. */

import { data, renderBlogPage } from "./views.js";
import { mountAssistant } from "./assistant.js";
import { protectPage } from "./protect.js";

renderBlogPage(document.getElementById("main"));
mountAssistant(document.getElementById("assistant-root"), data);
protectPage();
