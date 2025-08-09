import React, { useEffect, useState } from "react";

type Props = {
  prompt: string;
  creditsLeft: number;
  onTokenStatusChange: (isValid: boolean) => void;
};

function estimateTokenCount(text: string): number {
  if (!text) return 0;

  const tokens = text.match(/[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu);
  if (!tokens) return 0;

  let count = 0;

  for (const token of tokens) {
    if (/^[\p{L}\p{N}_]+$/u.test(token)) {
      count += Math.ceil(token.length / 4);
    } else {
      count += 1;
    }
  }

  return count;
}

export const TokenCreditInfo: React.FC<Props> = ({
  prompt,
  creditsLeft,
  onTokenStatusChange,
}) => {
  const [tokenCount, setTokenCount] = useState(0);
  const [tokenLimitExceeded, setTokenLimitExceeded] = useState(false);

  useEffect(() => {
    const tokens = estimateTokenCount(prompt);
    setTokenCount(tokens);

    const exceeded = tokens > 500;
    setTokenLimitExceeded(exceeded);
    onTokenStatusChange(!exceeded);
  }, [prompt]);

  return (
    <div className="mb-4">
      <p className="text-sm text-gray-700">
        Token count:{" "}
        <span className={tokenLimitExceeded ? "text-red-600" : "text-green-700"}>
          {tokenCount} / 500
        </span>
      </p>
      {tokenLimitExceeded && (
        <p className="text-red-600 text-sm mt-1">
          🚫 Token limit exceeded. Please shorten your prompt.
        </p>
      )}
      <p className="text-sm text-gray-700">Credits left: {creditsLeft}</p>
    </div>
  );
};