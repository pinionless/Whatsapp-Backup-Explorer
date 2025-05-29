import { useEffect, useState, useCallback, Suspense } from 'react';
import { useAtomValue } from 'jotai';

import { extractedFileAtom } from '../../stores/global';
import { getMimeType, showError } from '../../utils/utils';
import * as S from './style';
import JSZip from 'jszip'; // Assuming JSZip is used for zip file handling

// Define or update your IAttachment interface
interface IAttachment {
  fileName: string;
  srcUrl?: string; // Add srcUrl as an optional prop
}

// Fallback component for unsupported types or errors
const FallbackDisplay = ({ fileName }: { fileName: string }) => (
  <S.Unsupported>
    <S.P>
      Unsupported file type or error loading:
      <br />
      {fileName}
    </S.P>
  </S.Unsupported>
);

function Attachment({ fileName, srcUrl }: IAttachment) {
  const extractedFile = useAtomValue(extractedFileAtom);
  const mimeType = getMimeType(fileName);

  // Prioritize srcUrl if available (for direct server loading)
  if (srcUrl) {
    if (mimeType?.startsWith('image/')) {
      return <S.Img src={srcUrl} alt={fileName} loading="lazy" />;
    }
    if (mimeType?.startsWith('video/')) {
      return (
        <S.Video controls src={srcUrl}>
          Your browser does not support the video tag.
        </S.Video>
      );
    }
    if (mimeType?.startsWith('audio/')) {
      return (
        <S.Audio controls src={srcUrl}>
          Your browser does not support the audio tag.
        </S.Audio>
      );
    }
    // Fallback for other types when srcUrl is present (e.g., link to download)
    return (
      <a href={srcUrl} target="_blank" rel="noopener noreferrer">
        Download {fileName}
      </a>
    );
  }

  // Existing logic for loading from JSZip or other sources if srcUrl is not provided
  if (!extractedFile || typeof extractedFile === 'string') {
    showError(`Cannot display attachment: ${fileName}. No ZIP data found.`);
    return <FallbackDisplay fileName={fileName} />;
  }

  const zip = extractedFile as JSZip; // Type assertion
  const fileInZip = zip.file(fileName);

  if (!fileInZip) {
    showError(`File not found in zip: ${fileName}`);
    return <FallbackDisplay fileName={fileName} />;
  }

  const loadFile = async () => {
    try {
      const blob = await fileInZip.async('blob');
      const objectURL = URL.createObjectURL(blob);

      // Cleanup function to revoke object URL
      const cleanup = () => URL.revokeObjectURL(objectURL);

      if (mimeType?.startsWith('image/')) {
        return <S.Img src={objectURL} alt={fileName} loading="lazy" onLoad={cleanup} onError={cleanup} />;
      }
      if (mimeType?.startsWith('video/')) {
        return (
          <S.Video controls src={objectURL} onLoadedData={cleanup} onError={cleanup}>
            Your browser does not support the video tag.
          </S.Video>
        );
      }
      if (mimeType?.startsWith('audio/')) {
        return (
          <S.Audio controls src={objectURL} onLoadedData={cleanup} onError={cleanup}>
            Your browser does not support the audio tag.
          </S.Audio>
        );
      }
      // If not image, video, or audio, provide a download link
      const downloadUrl = objectURL; // Or re-create blob for download if needed
      return (
        <a href={downloadUrl} download={fileName} onClick={cleanup}>
          Download {fileName}
        </a>
      );
    } catch (err) {
      showError(`Error loading attachment ${fileName}:`, err as Error);
      return <FallbackDisplay fileName={fileName} />;
    }
  };

  // Using a simple functional component to use async result in Suspense
  const AsyncFileLoader = () => {
    const [Component, setComponent] = useState<React.ReactNode>(null);
    useEffect(() => {
      let active = true;
      loadFile().then(comp => {
        if (active) setComponent(comp);
      });
      return () => { active = false; /* cleanup if objectURL was created and not cleaned by component */ };
    }, [fileName]); // Re-run if fileName changes

    return <>{Component || `Loading ${fileName}...`}</>;
  };

  return (
    <Suspense fallback={`Preparing ${fileName}...`}>
      <AsyncFileLoader />
    </Suspense>
  );
}

export default Attachment;

// Make sure S.P, S.Unsupported, S.Img, S.Video, S.Audio are defined in your style.ts
// For example:
// export const P = styled.p``;
// export const Unsupported = styled.div` color: red; `;
// export const Img = styled.img` max-width: 100%; height: auto; `;
// export const Video = styled.video` max-width: 100%; `;
// export const Audio = styled.audio` width: 100%; `;
