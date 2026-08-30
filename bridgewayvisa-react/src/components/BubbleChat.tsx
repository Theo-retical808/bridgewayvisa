import { useState } from 'react'

export default function BubbleChat() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
      {/* Chat Window Box */}
      {isOpen && (
        <div className="mb-4 w-80 h-96 bg-neutral-900 rounded-2xl shadow-2xl border border-red-900/40 flex flex-col overflow-hidden transition-all duration-300">
          {/* Chat Header */}
          <div className="bg-red-700 text-white p-4 flex justify-between items-center shadow-md">
            <h3 className="font-semibold text-lg tracking-wide">Chat with Us</h3>
            <button 
              onClick={toggleChat}
              className="text-white hover:text-gray-200 focus:outline-none transition-colors"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Chat Body */}
          <div className="flex-1 p-4 overflow-y-auto text-gray-200 text-sm space-y-3 bg-neutral-900">
            <div className="bg-neutral-800 p-3 rounded-xl inline-block max-w-[85%] shadow-sm border border-neutral-700/50">
              <p>Hello! 👋 Welcome to Bridgeway Visa. How can we assist your travel plans today?</p>
            </div>
          </div>

          {/* Chat Footer / Input Area */}
          <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex gap-2 items-center">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-red-600 transition-colors"
            />
            <button className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md">
              Send
            </button>
          </div>
        </div>
      )}

      {/* Chat Bubble Toggle Button */}
      <button
        onClick={toggleChat}
        className="w-14 h-14 bg-red-700 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none ring-2 ring-red-900/30"
        aria-label="Toggle chat"
      >
        {isOpen ? (
          // Close Icon
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Chat Bubble Icon
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        )}
      </button>
    </div>
  )
}