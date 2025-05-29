import React, { useEffect, Suspense } from 'react'; // Add Suspense back
import { useAtomValue, useSetAtom, useAtom } from 'jotai';

import { showError } from './utils/utils';
import { 
  rawFileAtom, 
  messagesAtom, 
  selectedChatIdentifierAtom,
  availableChatIdentifiersAtom, // This is now async again
  CHAT_FOLDER_PREFIX 
} from './stores/global';
import MessageViewer from './components/MessageViewer/MessageViewer';
import Sidebar from './components/Sidebar/Sidebar';
import * as S from './style';

const SERVER_DATA_PATH_PREFIX = "/chats/"; // For fetching data from server
const CLIENT_ROUTING_PATH_PREFIX = "/chat/"; // For parsing client-side routes from URL

// Create AppContent again for Suspense
function AppContent() {
  const messages = useAtomValue(messagesAtom);
  const setRawFile = useSetAtom(rawFileAtom);
  const [currentChatIdentifier, setCurrentChatIdentifier] = useAtom(selectedChatIdentifierAtom);
  const availableChats = useAtomValue(availableChatIdentifiersAtom); // Will suspend if promise is pending

  // Effect for initial load and popstate (back/forward button)
  useEffect(() => {
    // This effect runs after availableChats has resolved due to Suspense
    const syncIdentifierFromPath = (path: string) => {
      let identifierFromPath = "";
      if (path.startsWith(CLIENT_ROUTING_PATH_PREFIX)) { // Parse client route
        identifierFromPath = decodeURIComponent(path.substring(CLIENT_ROUTING_PATH_PREFIX.length));
      }

      if (availableChats.includes(identifierFromPath)) {
        if (currentChatIdentifier !== identifierFromPath) {
          setCurrentChatIdentifier(identifierFromPath);
        }
      } else if (availableChats.length > 0) {
        if (currentChatIdentifier !== availableChats[0] || (path !== `${CLIENT_ROUTING_PATH_PREFIX}${encodeURIComponent(availableChats[0])}`)) { // Check client route
           setCurrentChatIdentifier(availableChats[0]);
        }
      } else {
        if (currentChatIdentifier !== "") {
          setCurrentChatIdentifier("");
        }
      }
    };

    syncIdentifierFromPath(window.location.pathname);

    const handlePopState = (event: PopStateEvent) => {
      syncIdentifierFromPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [availableChats, setCurrentChatIdentifier, currentChatIdentifier]);

  // Effect to load chat data when currentChatIdentifier (dynamic part) changes
  useEffect(() => {
    const loadChatFromFile = async () => {
      if (!currentChatIdentifier) { 
        setRawFile(null); 
        return;
      }

      const fullFolderName = `${CHAT_FOLDER_PREFIX}${currentChatIdentifier}`;
      // Use SERVER_DATA_PATH_PREFIX for constructing URLs to fetch data from the server
      const mediaBaseUrl = `${SERVER_DATA_PATH_PREFIX}${encodeURIComponent(fullFolderName)}/`; 
      const chatFileName = `${fullFolderName}.txt`; 
      const chatFilePath = `${mediaBaseUrl}${encodeURIComponent(chatFileName)}`;
      
      // console.log(`Loading chat: ${currentChatIdentifier}, Path: ${chatFilePath}`); // For debugging

      try {
        const response = await fetch(chatFilePath);
        if (!response.ok) {
          throw new Error(`Failed to fetch chat file ${chatFilePath}: ${response.statusText}`);
        }
        const textContent = await response.text();
        setRawFile(textContent); // This should trigger messagesAtom to re-evaluate
      } catch (error) {
        setRawFile(null); 
        if (error instanceof Error) {
          showError(`Error loading chat file: ${error.message}`, error);
        } else {
          showError('An unknown error occurred while loading the chat file.');
        }
      }
    };

    loadChatFromFile();
  }, [currentChatIdentifier, setRawFile]); 

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) =>
      document.documentElement.classList.toggle('ctrl-down', e.ctrlKey);

    document.addEventListener('keydown', keyHandler);
    document.addEventListener('keyup', keyHandler);

    return () => {
      document.removeEventListener('keydown', keyHandler);
      document.removeEventListener('keyup', keyHandler);
    };
  }, []);

  // Construct mediaBaseUrl using the full folder name
  const fullFolderNameForMedia = currentChatIdentifier ? `${CHAT_FOLDER_PREFIX}${currentChatIdentifier}` : "";
  // Use SERVER_DATA_PATH_PREFIX for media URLs
  const mediaBaseUrl = fullFolderNameForMedia ? `${SERVER_DATA_PATH_PREFIX}${encodeURIComponent(fullFolderNameForMedia)}/` : "";

  return (
    <>
      <S.GlobalStyles />
      <S.Container>
        <MessageViewer 
          key={currentChatIdentifier || 'no-chat'}
          mediaBaseUrl={mediaBaseUrl} 
        />
        {currentChatIdentifier ? <Sidebar /> : null}
      </S.Container>
    </>
  );
}

function App() {
  return (
    <Suspense fallback={<div>Loading chat list...</div>}>
      <AppContent />
    </Suspense>
  );
}

export default App;
