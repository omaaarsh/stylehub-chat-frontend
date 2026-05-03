export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 w-fit">
      <span className="text-xs text-gray-400 mr-1">typing</span>
      <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full inline-block" />
      <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full inline-block" />
      <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full inline-block" />
    </div>
  );
}
