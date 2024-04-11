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
  onLinkedInDataFetched: (data: unknown) => void;
}

const LinkedInInfoButton: React.FC<LinkedInInfoButtonProps> = ({
  linkedinUrl,
  onLinkedInDataFetched
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState<unknown | null>(null);

  // Utility function to clean the LinkedIn URL
  const cleanLinkedInUrl = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      // Remove 'www.' if present and return the hostname without it along with the pathname
      const hostname = parsedUrl.hostname.replace(/^www\./, '');
      return `${hostname}${parsedUrl.pathname}`;
    } catch (error) {
      console.error('Error parsing URL:', error);
      return url; // Return the original URL if parsing fails
    }
  };

  const fetchLinkedInData = async () => {
    setIsLoading(true);
    const searchUrl = `${import.meta.env.VITE_REACT_LINKEDIN_SOFT_SEARCH_URL}${linkedinUrl}`;
    const response = await fetch(searchUrl);
    const jsonData = await response.json();
    setIsLoading(false);
    if (jsonData?.data) {
      const linkedInData = JSON.parse(jsonData.data)[0];
      setFetchedData(linkedInData);
      onLinkedInDataFetched(linkedInData);
    }
  };

  return (
    <div>
      {/* Use the cleanLinkedInUrl function to display a cleaned URL */}
      <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
        {cleanLinkedInUrl(linkedinUrl)}
      </a>
      <button onClick={fetchLinkedInData} disabled={isLoading} className="cellWithButtonStyle">
        {isLoading ? 'Loading...' : 'Get info'}
      </button>
      {/* Display fetched data */}
    </div>
  );
};

export default LinkedInInfoButton;
