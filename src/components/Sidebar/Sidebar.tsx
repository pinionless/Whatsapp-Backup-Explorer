import { useRef, useEffect, useState, startTransition } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import styled from 'styled-components';

import Credits from '../Credits/Credits';
import FilterModeSelector from '../FilterModeSelector/FilterModeSelector';
import FilterMessageLimitsForm from '../FilterMessageLimitsForm/FilterMessageLimitsForm';
import FilterMessageDatesForm from '../FilterMessageDatesForm/FilterMessageDatesForm';
import ActiveUserSelector from '../ActiveUserSelector/ActiveUserSelector';

import * as S from './style';
import {
  activeUserAtom,
  isAnonymousAtom,
  isMenuOpenAtom,
  messagesDateBoundsAtom,
  participantsAtom,
  availableChatIdentifiersAtom,
  selectedChatIdentifierAtom,
} from '../../stores/global';
import {
  datesAtom,
  globalFilterModeAtom,
  limitsAtom,
} from '../../stores/filters';
import { FilterMode } from '../../types';

const ChatLinkList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ChatLinkItem = styled.li<{ $isActive: boolean }>`
  padding: 0; // Remove padding if <a> tag inside will have it
  cursor: default; // No longer directly clickable if <a> is the target
  background-color: ${props => (props.$isActive ? '#e0e0e0' : 'transparent')};
  border-bottom: 1px solid #f0f0f0;

  @media (prefers-color-scheme: dark) {
    background-color: ${props => (props.$isActive ? '#4a4a4a' : 'transparent')};
    border-bottom-color: #3a3a3a;
  }

  a {
    display: block;
    padding: 0.5rem 1rem;
    text-decoration: none;
    color: inherit; // Inherit color from parent, or set explicitly
    &:hover {
      background-color: #f5f5f5;
      @media (prefers-color-scheme: dark) {
        background-color: #333;
      }
    }
  }
`;

const SidebarSection = styled.div`
  margin-bottom: 1rem;
  h3 {
    font-size: 0.9rem;
    margin: 0 0 0.5rem 1rem;
    color: #555;
    @media (prefers-color-scheme: dark) {
      color: #ccc;
    }
  }
`;

const CLIENT_ROUTING_PATH_PREFIX_SIDEBAR = "/chat/"; // Links should use the client-side routing prefix

function Sidebar() {
  const [isMenuOpen, setIsMenuOpen] = useAtom(isMenuOpenAtom);
  const [isAnonymous, setIsAnonymous] = useAtom(isAnonymousAtom);
  const [filterMode, setFilterMode] = useState<FilterMode>('index');
  const setGlobalFilterMode = useSetAtom(globalFilterModeAtom);
  const [limits, setLimits] = useAtom(limitsAtom);
  const setDates = useSetAtom(datesAtom);
  const messagesDateBounds = useAtomValue(messagesDateBoundsAtom);
  const participants = useAtomValue(participantsAtom);
  const [activeUser, setActiveUser] = useAtom(activeUserAtom);
  const availableChats = useAtomValue(availableChatIdentifiersAtom);
  const [selectedChat, setSelectedChat] = useAtom(selectedChatIdentifierAtom);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  const setMessageLimits = (e: React.FormEvent<HTMLFormElement>) => {
    const entries = Object.fromEntries(new FormData(e.currentTarget));

    e.preventDefault();
    setLimits({
      low: parseInt(entries.lowerLimit as string, 10),
      high: parseInt(entries.upperLimit as string, 10),
    });
    setGlobalFilterMode('index');
  };

  const setMessagesByDate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDates({
      start: e.currentTarget.startDate.valueAsDate,
      end: e.currentTarget.endDate.valueAsDate,
    });
    setGlobalFilterMode('date');
  };

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };

    document.addEventListener('keydown', keyDownHandler);
    return () => document.removeEventListener('keydown', keyDownHandler);
  }, [setIsMenuOpen]);

  useEffect(() => {
    if (isMenuOpen) closeButtonRef.current?.focus();
    else openButtonRef.current?.focus();
  }, [isMenuOpen]);

  return (
    <>
      <S.MenuOpenButton
        className="menu-open-button"
        type="button"
        onClick={() => setIsMenuOpen(true)}
        ref={openButtonRef}
      >
        Open menu
      </S.MenuOpenButton>
      <S.Overlay
        type="button"
        $isActive={isMenuOpen}
        onClick={() => setIsMenuOpen(false)}
        tabIndex={-1}
      />
      <S.Sidebar $isOpen={isMenuOpen}>
        <S.MenuCloseButton
          type="button"
          onClick={() => setIsMenuOpen(false)}
          ref={closeButtonRef}
        >
          Close menu
        </S.MenuCloseButton>
        <S.SidebarContainer>
          <S.SidebarChildren>
            <FilterModeSelector
              filterMode={filterMode}
              setFilterMode={setFilterMode}
            />
            {filterMode === 'index' && (
              <FilterMessageLimitsForm
                limits={limits}
                setMessageLimits={setMessageLimits}
              />
            )}
            {filterMode === 'date' && (
              <FilterMessageDatesForm
                messagesDateBounds={messagesDateBounds}
                setMessagesByDate={setMessagesByDate}
              />
            )}
            <ActiveUserSelector
              participants={participants}
              activeUser={activeUser}
              setActiveUser={setActiveUser}
            />

            <S.Field>
              <S.Label htmlFor="is-anonymous">Anonymize users</S.Label>
              <S.ToggleCheckbox
                id="is-anonymous"
                type="checkbox"
                checked={isAnonymous}
                onChange={() =>
                  startTransition(() => setIsAnonymous(bool => !bool))
                }
              />
            </S.Field>

            <SidebarSection>
              <h3>Available Chats</h3>
              <ChatLinkList>
                {availableChats.map(chatId => (
                  <ChatLinkItem
                    key={chatId}
                    $isActive={selectedChat === chatId}
                  >
                    <a href={`${CLIENT_ROUTING_PATH_PREFIX_SIDEBAR}${encodeURIComponent(chatId)}`}>
                      {chatId.replace("WhatsApp Chat with ", "")} {/* Display a cleaner name */}
                    </a>
                  </ChatLinkItem>
                ))}
              </ChatLinkList>
            </SidebarSection>
          </S.SidebarChildren>
          <Credits />
        </S.SidebarContainer>
      </S.Sidebar>
    </>
  );
}

export default Sidebar;
