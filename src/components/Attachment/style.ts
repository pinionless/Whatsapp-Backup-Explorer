import styled from 'styled-components';

import { normalizeInput, standardButton } from '../../utils/styles';

const Button = styled.button`
  ${normalizeInput}
  ${standardButton}
`;

export const P = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

export const Unsupported = styled.div`
  padding: 0.5rem;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  color: #555;
  text-align: center;

  @media (prefers-color-scheme: dark) {
    background-color: #3a3a3a;
    border-color: #555;
    color: #ccc;
  }
`;

export const Img = styled.img`
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin-top: 0.25rem;
`;

export const Video = styled.video`
  display: block;
  max-width: 100%;
  border-radius: 6px;
  margin-top: 0.25rem;
`;

export const Audio = styled.audio`
  width: 100%;
  margin-top: 0.25rem;
`;

export { Button };
