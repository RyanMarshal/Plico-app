"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  const cycleTheme = () => {
    const themeOrder = ["light", "dark", "system"];
    const currentIndex = themeOrder.indexOf(theme || "system");
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <SunIcon className="w-5 h-5 text-yellow-500" />;
      case "dark":
        return <MoonIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <ComputerDesktopIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNextThemeLabel = () => {
    switch (theme) {
      case "light":
        return "dark";
      case "dark":
        return "system";
      default:
        return "light";
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        variant="ghost"
        size="icon"
        onClick={cycleTheme}
        className="relative w-9 h-9 rounded-lg"
        aria-label={`Switch to ${getNextThemeLabel()} theme`}
      >
        <motion.div
          key={theme}
          initial={{ opacity: 0, rotate: -180 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={{ opacity: 0, rotate: 180 }}
          transition={{ duration: 0.3 }}
        >
          {getIcon()}
        </motion.div>
      </Button>
    </motion.div>
  );
}
