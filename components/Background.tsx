'use client'

import { useEffect, useState } from 'react'

interface ThemeColors {
  primary_color: string;
  background_color: string;
  secondary_background_color: string;
  text_color: string;
  divider_color: string;
}

const THEME_COLORS: ThemeColors = {
  primary_color: "#AEBFAE", // Sage Green
  background_color: "#F8F8F8", // Light Off-White
  secondary_background_color: "#F5F5F5", // Light Neutral Gray
  text_color: "#333333", // Dark Gray
  divider_color: "#DADADA", // Soft Divider Color
};

function generateRandomSymbolBackground(): string {
  const symbols = ["Docs", "gifs", "!", "🎥", "📹", "📄", "▶"];
  const numSymbols = 30;
  const width = 1000;
  const height = 1000;

  let elements = "";

  for (let i = 0; i < numSymbols; i++) {
    const sym = symbols[Math.floor(Math.random() * symbols.length)];
    const x = Math.floor(Math.random() * (width - 50));
    const y = Math.floor(Math.random() * (height - 10)) + 40;
    const fontSize = Math.floor(Math.random() * 30) + 20;
    const color = THEME_COLORS.text_color;

    elements += `<text x="${x}" y="${y}" font-size="${fontSize}" fill="${color}" opacity="0.1">${sym}</text>`;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      ${elements}
    </svg>
  `;
}

export default function Background() {
  const [backgroundImage, setBackgroundImage] = useState<string>('');

  useEffect(() => {
    const svgContent = generateRandomSymbolBackground();
    const encodedSvg = encodeURIComponent(svgContent);
    setBackgroundImage(`url("data:image/svg+xml,${encodedSvg}")`);
  }, []);

  return (
    <div 
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        backgroundImage: `${backgroundImage}`,
        backgroundColor: THEME_COLORS.background_color,
        backgroundRepeat: 'repeat',
        backgroundSize: '1000px 1000px',
      }}
    />
  );
}

