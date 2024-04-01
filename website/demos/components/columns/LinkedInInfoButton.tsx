import type React from 'react';
import { useState } from 'react';
import { css } from '@linaria/core';

const linkedinSearchButtonStyle = css`
  opacity: 0;
  transition: opacity 0.3s ease;
  margin-left: 8px;
`;

const cellWithButtonStyle = css`
  &:hover .${linkedinSearchButtonStyle} {
    opacity: 1;
  }
`;

interface LinkedInInfoButtonProps {
  linkedinUrl: string;
  onLinkedInDataFetched: (data: unknown) => void; // Adjust typing as necessary
}

const LinkedInInfoButton: React.FC<LinkedInInfoButtonProps> = ({
  linkedinUrl,
  onLinkedInDataFetched
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchLinkedInData = async () => {
    setIsLoading(true);
    // Ensure the URL is correctly concatenated without double-encoding
    const searchUrl = `${import.meta.env.VITE_REACT_LINKEDIN_SOFT_SEARCH_URL}${linkedinUrl}`;
    const response = await fetch(searchUrl);
    const jsonData = await response.json();
    setIsLoading(false);
    if (jsonData?.data) {
      const linkedInData = JSON.parse(jsonData.data)[0]; // Parse the stringified JSON data
      onLinkedInDataFetched(linkedInData);
    }
  };

  return (
    <div>
      <button onClick={fetchLinkedInData} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Get info'}
      </button>
    </div>
  );
};

export default LinkedInInfoButton;
