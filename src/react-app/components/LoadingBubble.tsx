import React from "react";

export const LoadingBubble: React.FC = () => {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-200 text-gray-800 rounded-lg rounded-bl-none p-4 max-w-[70%]">
        <div className="flex space-x-2">
          <div
            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
            style={{ animationDelay: "200ms" }}
          />
          <div
            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
            style={{ animationDelay: "400ms" }}
          />
        </div>
      </div>
    </div>
  );
};
