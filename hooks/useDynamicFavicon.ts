import { useEffect } from 'react';

/**
 * A custom React hook to dynamically update the page's favicon.
 * It cleverly uses a data URL to render an emoji as an SVG icon.
 * @param emoji The emoji character to display as the favicon.
 */
export const useDynamicFavicon = (emoji: string) => {
  useEffect(() => {
    // Get the current favicon link element or create one if it doesn't exist
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    
    if (!favicon) {
      // Create a new favicon link element if one doesn't exist
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    
    // Create the SVG markup with the emoji centered inside
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <text y=".9em" font-size="90">${emoji}</text>
      </svg>
    `.trim();
    
    // Create a data URL from the SVG string
    const dataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    
    // Update the href of the favicon link
    favicon.href = dataUrl;
    
    // Also update the apple-touch-icon for iOS devices
    const appleTouchIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (appleTouchIcon) {
      appleTouchIcon.href = dataUrl;
    }
  }, [emoji]); // This effect re-runs only when the emoji character changes
};