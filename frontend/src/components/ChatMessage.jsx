import React, { useState } from 'react';
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

const ChatMessage = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple markdown-like rendering
  const renderContent = (content) => {
    // Split by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        // Code block
        const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
        const language = match?.[1] || '';
        const code = match?.[2] || part.slice(3, -3);
        return (
          <div key={index} className="my-4 rounded-lg overflow-hidden bg-[#1e1e1e]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-xs text-gray-400">
              <span>{language || 'code'}</span>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <Copy className="h-3 w-3" />
                Code kopieren
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code className="text-gray-300">{code}</code>
            </pre>
          </div>
        );
      } else {
        // Regular text with inline formatting
        return (
          <div key={index} className="whitespace-pre-wrap">
            {renderInlineFormatting(part)}
          </div>
        );
      }
    });
  };

  const renderInlineFormatting = (text) => {
    // Split by inline code
    const parts = text.split(/(`[^`]+`)/g);

    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="bg-[#3f3f3f] px-1.5 py-0.5 rounded text-sm text-pink-400">
            {part.slice(1, -1)}
          </code>
        );
      }

      // Handle bold text
      let formatted = part;
      const boldParts = formatted.split(/(\*\*[^*]+\*\*)/g);

      return boldParts.map((boldPart, boldIndex) => {
        if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
          return (
            <strong key={`${index}-${boldIndex}`} className="font-semibold">
              {boldPart.slice(2, -2)}
            </strong>
          );
        }

        // Handle headers
        const lines = boldPart.split('\n');
        return lines.map((line, lineIndex) => {
          if (line.startsWith('## ')) {
            return (
              <h2 key={`${index}-${boldIndex}-${lineIndex}`} className="text-lg font-semibold mt-4 mb-2">
                {line.slice(3)}
              </h2>
            );
          }
          if (line.startsWith('# ')) {
            return (
              <h1 key={`${index}-${boldIndex}-${lineIndex}`} className="text-xl font-bold mt-4 mb-2">
                {line.slice(2)}
              </h1>
            );
          }
          if (line.startsWith('- ')) {
            return (
              <div key={`${index}-${boldIndex}-${lineIndex}`} className="flex items-start gap-2 ml-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{line.slice(2)}</span>
              </div>
            );
          }
          return lineIndex < lines.length - 1 ? (
            <React.Fragment key={`${index}-${boldIndex}-${lineIndex}`}>
              {line}
              <br />
            </React.Fragment>
          ) : (
            <React.Fragment key={`${index}-${boldIndex}-${lineIndex}`}>{line}</React.Fragment>
          );
        });
      });
    });
  };

  return (
    <div className={`py-6 ${isUser ? '' : 'bg-transparent'}`}>
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {isUser ? (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#19c37d] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3934 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.4985C30.0864 3.62941 27.9098 3.40259 25.8215 3.85078C24.8796 2.7893 23.7219 1.94125 22.4257 1.36341C21.1295 0.785575 19.7249 0.491269 18.3058 0.500197C16.1708 0.495044 14.0893 1.16803 12.3614 2.42214C10.6335 3.67624 9.34853 5.44666 8.6917 7.47815C7.30085 7.76286 5.98686 8.3414 4.8377 9.17505C3.68854 10.0087 2.73073 11.0782 2.02839 12.312C0.956464 14.1591 0.## ChatMessage continues...
504623 16.2718 0.googletag720365 18.3404C0.936107 20.409 1.82788 22.3334 3.30126 23.8402C2.85281 25.1868 2.69729 26.6136 2.84498 28.0251C2.99267 29.4366 3.44014 30.8002 4.15755 32.0247C5.22086 33.8769 6.84526 35.3433 8.79618 36.2124C10.7471 37.0815 12.9237 37.3083 15.012 36.8601C15.954 37.9216 17.1117 38.7697 18.408 39.3475C19.7042 39.9254 21.1088 40.2197 22.528 40.2107C24.6629 40.2159 26.7444 39.5429 28.4723 38.2888C30.2002 37.0347 31.4852 35.2643 32.1421 33.2328C33.533 32.9481 34.8469 32.3696 35.996 31.5359C37.1452 30.7023 38.103 29.6327 38.8054 28.3989C39.8774 26.5519 40.2391 24.4391 39.9099 22.3705C39.5807 20.3019 38.6889 18.3776 37.2155 16.8707H37.5324ZM22.528 37.8988C20.4838 37.8991 18.5091 37.1853 16.9562 35.8817C17.0391 35.8399 17.1798 35.7587 17.2746 35.7054L24.7293 31.4012C24.9704 31.2655 25.1692 31.0665 25.3048 30.8258C25.4404 30.585 25.5076 30.3119 25.4992 30.0361V19.1498L28.6988 21.0028C28.7181 21.0123 28.7348 21.0266 28.7476 21.0443C28.7603 21.062 28.7687 21.0826 28.772 21.1044V30.1651C28.7694 32.2127 27.9519 34.1757 26.4945 35.6309C25.0371 37.0861 23.0717 37.9009 21.022 37.8988H22.528ZM6.38963 30.8916C5.36648 29.1163 5.0049 27.0484 5.36963 25.0424C5.45177 25.0859 5.58977 25.1698 5.6897 25.2231L13.1444 29.5273C13.3832 29.6638 13.6548 29.7354 13.931 29.7354C14.2072 29.7354 14.4788 29.6638 14.7176 29.5273L23.8393 24.262V27.968C23.8409 27.9905 23.8371 28.0131 23.8283 28.0339C23.8195 28.0546 23.8059 28.0729 23.7886 28.0873L16.2574 32.4394C14.4817 33.4614 12.4029 33.8252 10.3857 33.468C8.36852 33.1108 6.54185 32.0553 5.24355 30.4916L6.38963 30.8916ZM4.29755 13.8152C5.3178 12.0368 6.93077 10.6701 8.85663 9.94973C8.85663 10.0421 8.85311 10.1975 8.85311 10.3095V18.9178C8.84475 19.193 8.91135 19.4654 9.04595 19.7057C9.18055 19.946 9.37799 20.1451 9.61755 20.2817L18.7393 25.5464L15.5397 27.3994C15.5201 27.4107 15.4981 27.4174 15.4754 27.4188C15.4527 27.4203 15.43 27.4166 15.4091 27.4079L7.87787 23.052C6.1052 22.0268 4.75296 20.415 4.03765 18.5008C3.32235 16.5866 3.28791 14.487 3.93963 12.5512L4.29755 13.8152ZM31.5361 20.7183L22.4144 15.4546L25.614 13.6006C25.6337 13.5893 25.6556 13.5826 25.6783 13.5812C25.701 13.5797 25.7237 13.5834 25.7447 13.5921L33.2759 17.9443C34.6103 18.7145 35.7069 19.8426 36.4401 21.1967C37.1733 22.5509 37.5135 24.0762 37.4229 25.6067C37.3323 27.1372 36.8144 28.6116 35.9256 29.8703C35.0368 31.129 33.813 32.1214 32.3929 32.7325V24.0862C32.4013 23.811 32.3347 23.5386 32.2001 23.2983C32.0655 23.058 31.868 22.8589 31.6285 22.7223L31.5361 20.7183ZM34.7181 15.9577C34.6359 15.9134 34.4979 15.8303 34.3981 15.777L26.9433 11.4728C26.7045 11.3363 26.433 11.2647 26.1567 11.2647C25.8805 11.2647 25.6089 11.3363 25.3701 11.4728L16.2484 16.738V13.0321C16.2468 13.0096 16.2506 12.987 16.2594 12.9662C16.2682 12.9454 16.2818 12.9271 16.2991 12.9128L23.8303 8.5606C25.1648 7.79093 26.6849 7.39878 28.2234 7.42742C29.7618 7.45606 31.2643 7.9044 32.5657 8.72236C33.8671 9.54032 34.9188 10.6975 35.6113 12.0665C36.3038 13.4355 36.6113 14.9658 36.5027 16.4959L34.7181 15.9577ZM14.4861 21.8502L11.2865 19.9972C11.2672 19.9877 11.2505 19.9734 11.2377 19.9557C11.225 19.938 11.2166 19.9174 11.2133 19.8956V10.8349C11.216 8.78629 12.0339 6.82221 13.4926 5.36649C14.9512 3.91077 16.9186 3.09632 18.9697 3.10007C20.0014 3.09875 21.022 3.31968 21.9639 3.74822C22.9058 4.17676 23.748 4.80264 24.4351 5.58341L24.3582 5.58341L16.9035 9.88764C16.6624 10.0234 16.4636 10.2223 16.328 10.4631C16.1924 10.7039 16.1252 10.977 16.1336 11.2527L14.4861 21.8502ZM16.2484 18.0693L20.044 15.8712L23.8393 18.0693V22.4651L20.044 24.6632L16.2484 22.4651V18.0693Z" fill="white"/>
                </svg>
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-200 mb-1">
              {isUser ? 'Du' : 'KI-Assistent'}
            </div>
            <div className="text-gray-200 leading-relaxed">
              {renderContent(message.content)}
            </div>

            {/* Action buttons for AI messages */}
            {!isUser && (
              <div className="flex items-center gap-1 mt-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-500 hover:text-gray-200 hover:bg-[#2f2f2f]"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-500 hover:text-gray-200 hover:bg-[#2f2f2f]"
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-500 hover:text-gray-200 hover:bg-[#2f2f2f]"
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-500 hover:text-gray-200 hover:bg-[#2f2f2f]"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
