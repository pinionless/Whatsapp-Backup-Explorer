import { atom } from 'jotai';

import {
  extractFile,
  extractStartEndDatesFromMessages,
  messagesFromFile,
  participantsFromMessages,
} from '../utils/utils';

const isMenuOpenAtom = atom(false);
const activeUserAtom = atom('');
const isAnonymousAtom = atom(false);
const rawFileAtom = atom<FileReader['result']>(null);
const extractedFileAtom = atom(get => extractFile(get(rawFileAtom)));
const messagesAtom = atom(get =>
  messagesFromFile(get(extractedFileAtom), get(isAnonymousAtom)),
);
const participantsAtom = atom(get =>
  participantsFromMessages(get(messagesAtom)),
);

const messagesDateBoundsAtom = atom(get =>
  extractStartEndDatesFromMessages(get(messagesAtom)),
);

// Prefix for chat folders, used when constructing file paths
export const CHAT_FOLDER_PREFIX = "WhatsApp Chat with ";
const SERVER_DATA_PATH_PREFIX = "/chats/"; // Path on the server where chat data folders are (for autoindex and file fetching)
const CLIENT_ROUTING_PATH_PREFIX = "/chat/"; // Path used for client-side routing (browser URL)

// availableChatIdentifiersAtom fetches and parses Nginx autoindex HTML
const availableChatIdentifiersAtom = atom<Promise<string[]>>(async () => {
  try {
    const response = await fetch(SERVER_DATA_PATH_PREFIX); // Fetch the directory listing from /chats/
    if (!response.ok) {
      console.error("Failed to fetch chat directory listing:", response.statusText);
      return [];
    }
    const htmlText = await response.text();
    
    // Parse the HTML to find directory names
    // Nginx autoindex typically creates <a> tags for directories ending with '/'
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const links = Array.from(doc.querySelectorAll('a'));
    const directoryNames: string[] = [];

    links.forEach(link => {
      const href = link.getAttribute('href');
      // Nginx directory links in autoindex usually end with a slash
      // and we are looking for folders that start with CHAT_FOLDER_PREFIX
      if (href && href.endsWith('/') ) {
        // Decode URI component in case of spaces, then remove trailing slash
        const decodedFolderName = decodeURIComponent(href.slice(0, -1)); 
        if (decodedFolderName.startsWith(CHAT_FOLDER_PREFIX)) {
          directoryNames.push(decodedFolderName.substring(CHAT_FOLDER_PREFIX.length));
        }
      }
    });
    
    if (directoryNames.length === 0) {
        console.warn("No chat folders found in /chat/ directory listing or folders do not match prefix.", CHAT_FOLDER_PREFIX);
    }
    return directoryNames;

  } catch (error) {
    console.error("Error fetching or parsing chat directory listing:", error);
    return [];
  }
});

// Internal primitive atom to store the dynamic part of the selected chat identifier.
// Initial value is empty. App.tsx (AppContent) will set it once available chats are loaded and URL is parsed.
const _selectedChatIdentifierPrimitiveAtom = atom<string>("");


// Exported atom that components will use to get and set the selected chat identifier.
const selectedChatIdentifierAtom = atom(
  (get) => get(_selectedChatIdentifierPrimitiveAtom), // Read function
  (get, set, newIdentifier: string) => {             // Write function
    const currentIdentifier = get(_selectedChatIdentifierPrimitiveAtom);

    if (currentIdentifier !== newIdentifier) {
      set(_selectedChatIdentifierPrimitiveAtom, newIdentifier); 
      set(rawFileAtom, null);                               
      
      const newClientPath = newIdentifier ? `${CLIENT_ROUTING_PATH_PREFIX}${encodeURIComponent(newIdentifier)}` : "/";
      if (history.state?.identifier !== newIdentifier || window.location.pathname !== newClientPath) { 
          history.pushState({ identifier: newIdentifier }, '', newClientPath);
      }

    } else if (newIdentifier) {
      const expectedClientPath = `${CLIENT_ROUTING_PATH_PREFIX}${encodeURIComponent(newIdentifier)}`;
      if (window.location.pathname !== expectedClientPath) {
        history.replaceState({ identifier: newIdentifier }, '', expectedClientPath);
      }
    } else if (!newIdentifier && window.location.pathname !== "/") { 
        history.replaceState(null, '', "/");
    }
  }
);

export {
  isMenuOpenAtom,
  activeUserAtom,
  isAnonymousAtom,
  rawFileAtom,
  messagesAtom,
  participantsAtom,
  extractedFileAtom,
  messagesDateBoundsAtom,
  availableChatIdentifiersAtom,
  selectedChatIdentifierAtom, 
};
