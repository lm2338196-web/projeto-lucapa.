/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface TechSpinnerProps {
  size?: "sm" | "md" | "lg";
  fullscreen?: boolean;
}

export default function TechSpinner({ size = "md", fullscreen = false }: TechSpinnerProps) {
  const pixelSize = size === "sm" ? "w-6 h-6 border-2" : size === "lg" ? "w-16 h-16 border-4" : "w-10 h-10 border-[3px]";

  const spinnerMarkup = (
    <div className="flex flex-col items-center justify-center space-y-2 p-2" id="tech-spinner">
      {/* Dynamic continuous rotating dashed spinner with primary blue color */}
      <div
        className={`${pixelSize} rounded-full border-dashed animate-spin`}
        style={{
          borderStyle: "dashed",
          borderColor: "#007bff transparent #007bff #007bff", // Nice styling contrast
        }}
      />
      {size !== "sm" && (
        <span className="text-[10px] font-bold text-gray-550 uppercase tracking-widest mt-1">
          CARREGANDO...
        </span>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-[#f0f4f8]/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
        <div className="bg-white p-6 rounded-[12px] custom-shadow border border-gray-200 flex flex-col items-center">
          {spinnerMarkup}
        </div>
      </div>
    );
  }

  return spinnerMarkup;
}
