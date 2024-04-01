// Original file (e.g., styles.js)
import { css } from '@linaria/core';

// Define styles as template literals
const toolbarClassname = css`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-block-end: 8px;
`;

const dialogContainerClassname = css`
  position: absolute;
  inset: 0;
  display: flex;
  place-items: center;
  background: rgba(0, 0, 0, 0.1);

  > dialog {
    width: 300px;
    > input {
      width: 100%;
    }

    > menu {
      text-align: end;
    }
  }
`;

const searchButtonStyle = css`
  opacity: 0;
  transition: opacity 0.3s ease;
  margin-left: 8px;
`;

const cellWithButtonStyle = css`
  &:hover .${searchButtonStyle} {
    opacity: 1;
  }
`;

// Export styles as strings
export const toolbarStyleString = toolbarClassname.toString();
export const dialogContainerStyleString = dialogContainerClassname.toString();
export const searchButtonStyleString = searchButtonStyle.toString();
export const cellWithButtonStyleString = cellWithButtonStyle.toString();
